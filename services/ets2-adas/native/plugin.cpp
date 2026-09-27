#define _WIN32_WINNT 0x0600
#include <windows.h>
#include <math.h>
#include <string.h>
#include "protocol.h"
#include "scssdk_telemetry.h"
#include "scssdk_input.h"
#include "common/scssdk_telemetry_truck_common_channels.h"

static HANDLE mapping;
static PocShared *shared;
static PocTelemetry latest = {};
static unsigned input_index;
static uint32_t blocked_token;
static bool blocked=false, telem_active=false, input_active=false;
static float frame_steer=0;
static uint32_t frame_buttons=0;
static scs_input_device_input_t inputs[] = {
 {"steering", "PoC steering", SCS_VALUE_TYPE_float},
 {"cruiectrl", "PoC cruise set or cancel", SCS_VALUE_TYPE_bool},
 {"cruiectrlres", "PoC cruise resume", SCS_VALUE_TYPE_bool},
 {"cruiectrlinc", "PoC cruise increase", SCS_VALUE_TYPE_bool},
 {"cruiectrldec", "PoC cruise decrease", SCS_VALUE_TYPE_bool},
 {"laneassist", "PoC lane assist toggle", SCS_VALUE_TYPE_bool},
 {"lblinkerh", "PoC left indicator hold", SCS_VALUE_TYPE_bool},
 {"rblinkerh", "PoC right indicator hold", SCS_VALUE_TYPE_bool}
};
static bool ensure_memory() {
 if(shared) return true;
 mapping=CreateFileMappingA(INVALID_HANDLE_VALUE,NULL,PAGE_READWRITE,0,sizeof(PocShared),POC_MAP_NAME);
 if(!mapping) return false;
 shared=(PocShared*)MapViewOfFile(mapping,FILE_MAP_ALL_ACCESS,0,0,sizeof(PocShared));
 if(!shared) { CloseHandle(mapping); mapping=NULL; return false; }
 memset(shared,0,sizeof(PocShared));
 latest.magic=POC_MAGIC; latest.version=1; latest.paused=1;
 shared->telemetry.magic=POC_MAGIC; shared->telemetry.version=1;
 return true;
}
static void cleanup() {
 if(telem_active || input_active) return;
 if(shared) { shared->telemetry.tick_ms=0; UnmapViewOfFile(shared); shared=NULL; }
 if(mapping) { CloseHandle(mapping); mapping=NULL; }
}
static void publish() {
 if(!shared) return;
 latest.tick_ms=GetTickCount64(); latest.stop_latched=blocked?1:0;
 InterlockedIncrement(&shared->telemetry.seq);
 // seq is owned by the synchronization protocol, never copied over.
 memcpy((char*)&shared->telemetry, &latest, 8);
 memcpy((char*)&shared->telemetry+12, (char*)&latest+12,116);
 MemoryBarrier(); InterlockedIncrement(&shared->telemetry.seq);
}
static SCSAPI_VOID on_float(scs_string_t, scs_u32_t, const scs_value_t* value, scs_context_t context) {
 if(value) *(float*)context=value->value_float.value;
}
static SCSAPI_VOID on_pose(scs_string_t, scs_u32_t, const scs_value_t* value, scs_context_t) {
 if(!value) return;
 latest.x=value->value_dplacement.position.x;
 latest.z=value->value_dplacement.position.z;
 latest.heading_turns=value->value_dplacement.orientation.heading;
}
static SCSAPI_VOID on_event(scs_event_t event,const void*,scs_context_t) {
 if(event==SCS_TELEMETRY_EVENT_paused) { latest.paused=1; blocked=true; blocked_token=shared->command.arm_token; }
 if(event==SCS_TELEMETRY_EVENT_started) latest.paused=0;
 publish();
}
extern "C" __declspec(dllexport) SCSAPI_RESULT scs_telemetry_init(scs_u32_t version,const scs_telemetry_init_params_t* params) {
 if(version!=SCS_TELEMETRY_VERSION_1_00) return SCS_RESULT_unsupported;
 const scs_telemetry_init_params_v100_t* p=(const scs_telemetry_init_params_v100_t*)params;
 if(!ensure_memory()) return SCS_RESULT_generic_error;
 telem_active=true;
 if(p->register_for_event(SCS_TELEMETRY_EVENT_frame_end,on_event,NULL)!=SCS_RESULT_ok ||
    p->register_for_event(SCS_TELEMETRY_EVENT_paused,on_event,NULL)!=SCS_RESULT_ok ||
    p->register_for_event(SCS_TELEMETRY_EVENT_started,on_event,NULL)!=SCS_RESULT_ok) {
  telem_active=false; cleanup(); return SCS_RESULT_generic_error;
 }
 bool ok=p->register_for_channel(SCS_TELEMETRY_TRUCK_CHANNEL_world_placement,SCS_U32_NIL,SCS_VALUE_TYPE_dplacement,0,on_pose,NULL)==SCS_RESULT_ok;
 struct Channel {const char* name; float* target; bool required;};
 Channel channels[]={
  {SCS_TELEMETRY_TRUCK_CHANNEL_speed,&latest.speed_mps,true},
  {SCS_TELEMETRY_TRUCK_CHANNEL_cruise_control,&latest.cruise_mps,true},
  {SCS_TELEMETRY_TRUCK_CHANNEL_input_steering,&latest.input_steer,true},
  {SCS_TELEMETRY_TRUCK_CHANNEL_input_brake,&latest.input_brake,true},
  {SCS_TELEMETRY_TRUCK_CHANNEL_effective_steering,&latest.effective_steer,false},
  {SCS_TELEMETRY_TRUCK_CHANNEL_navigation_speed_limit,&latest.limit_mps,false},
  {SCS_TELEMETRY_TRUCK_CHANNEL_navigation_distance,&latest.route_distance_m,false}
 };
 for(unsigned i=0;i<sizeof(channels)/sizeof(channels[0]);i++) {
  bool registered=p->register_for_channel(channels[i].name,SCS_U32_NIL,SCS_VALUE_TYPE_float,0,on_float,channels[i].target)==SCS_RESULT_ok;
  if(channels[i].required && !registered) ok=false;
 }
 latest.channels_ready=ok?1:0;
 p->common.log(ok?SCS_LOG_TYPE_message:SCS_LOG_TYPE_error,ok?"[adas-poc] Telemetry connected, protocol v1":"[adas-poc] Required telemetry channel missing: controls disabled");
 publish(); return SCS_RESULT_ok;
}
static SCSAPI_RESULT input_event(scs_input_event_t* event,scs_u32_t flags,scs_context_t) {
 if(!shared) return SCS_RESULT_not_found;
 if(flags&SCS_INPUT_EVENT_CALLBACK_FLAG_first_in_frame) {
  input_index=0; frame_steer=0; frame_buttons=0;
  PocCommand c={}; long before=shared->command.seq;
  MemoryBarrier(); memcpy(&c,&shared->command,sizeof(c)); MemoryBarrier();
  uint64_t now=GetTickCount64();
  bool consistent=!(before&1) && before==shared->command.seq;
  bool emergency=(GetAsyncKeyState(VK_F8)&0x8000)!=0 || latest.input_brake>0.05f;
  if(c.lateral_active && ((GetAsyncKeyState(VK_LEFT)|GetAsyncKeyState(VK_RIGHT))&0x8000)) emergency=true;
  if(emergency) {blocked=true;blocked_token=c.arm_token;}
  bool fresh=consistent && c.tick_ms<=now && now-c.tick_ms<=300;
  if(c.armed && !fresh) {blocked=true;blocked_token=c.arm_token;}
  if(fresh && c.armed && c.arm_token!=blocked_token && !emergency && !latest.paused) blocked=false;
  bool allowed=fresh && c.armed && !blocked && !latest.paused && latest.channels_ready;
  if(allowed) {
   if(c.lateral_active && isfinite(c.steering) && latest.speed_mps>=8.33f && latest.speed_mps<=31.0f)
    // This profile's stock steering mix subtracts semantical.steering.
    // Public command convention is positive-left, matching telemetry heading.
    frame_steer=-fmaxf(-0.25f,fminf(0.25f,c.steering));
   frame_buttons=c.buttons&127;
  }
  latest.stop_latched=blocked?1:0;
 }
 if(input_index>=sizeof(inputs)/sizeof(inputs[0])) return SCS_RESULT_not_found;
 event->input_index=input_index;
 if(input_index==0) event->value_float.value=frame_steer;
 else event->value_bool.value=(frame_buttons&(1u<<(input_index-1)))?1:0;
 input_index++; return SCS_RESULT_ok;
}
extern "C" __declspec(dllexport) SCSAPI_RESULT scs_input_init(scs_u32_t version,const scs_input_init_params_t* params) {
 if(version!=SCS_INPUT_VERSION_1_00) return SCS_RESULT_unsupported;
 const scs_input_init_params_v100_t* p=(const scs_input_init_params_v100_t*)params;
 if(!ensure_memory()) return SCS_RESULT_generic_error;
 scs_input_device_t device={}; device.name="adas_poc"; device.display_name="ETS2 ADAS PoC";
 device.type=SCS_INPUT_DEVICE_TYPE_semantical; device.input_count=sizeof(inputs)/sizeof(inputs[0]);
 device.inputs=inputs;device.input_event_callback=input_event;
 if(p->register_device(&device)!=SCS_RESULT_ok) { cleanup(); return SCS_RESULT_generic_error; }
 input_active=true; latest.input_ready=1;
 p->common.log(SCS_LOG_TYPE_message,"[adas-poc] Input connected; F8 cancels custom controls; 300ms command timeout");
 return SCS_RESULT_ok;
}
extern "C" __declspec(dllexport) SCSAPI_VOID scs_telemetry_shutdown() {telem_active=false;cleanup();}
extern "C" __declspec(dllexport) SCSAPI_VOID scs_input_shutdown() {input_active=false;latest.input_ready=0;cleanup();}

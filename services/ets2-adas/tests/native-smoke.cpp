#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <math.h>
#include "scssdk_telemetry.h"
#include "scssdk_input.h"
#include "../native/protocol.h"
static scs_input_device_t device;
struct Channel {const char* name;scs_telemetry_channel_callback_t callback;scs_context_t context;};
static Channel channels[16]; static int count=0;
static scs_telemetry_event_callback_t events[16];
static SCSAPI_VOID logfn(scs_log_type_t,const char* s){puts(s);}
static SCSAPI_RESULT reg_event(scs_event_t e,scs_telemetry_event_callback_t cb,scs_context_t){events[e]=cb;return SCS_RESULT_ok;}
static SCSAPI_RESULT reg_channel(scs_string_t name,scs_u32_t,scs_value_type_t,scs_u32_t,scs_telemetry_channel_callback_t cb,scs_context_t context){channels[count++]={name,cb,context};return SCS_RESULT_ok;}
static SCSAPI_RESULT reg_device(const scs_input_device_t* info){device=*info;return SCS_RESULT_ok;}
static void set_float(const char* name,float v){for(int i=0;i<count;i++)if(!strcmp(channels[i].name,name)){scs_value_t val={};val.type=SCS_VALUE_TYPE_float;val.value_float.value=v;channels[i].callback(name,SCS_U32_NIL,&val,channels[i].context);}}
static void event(scs_event_t id){events[id](id,NULL,NULL);}
static void require(bool ok,const char* label){if(!ok){fprintf(stderr,"FAIL: %s\n",label);ExitProcess(1);}printf("PASS: %s\n",label);}
int main(int argc,char**argv){
 require(argc==2,"DLL argument");HMODULE lib=LoadLibraryA(argv[1]);require(lib!=NULL,"DLL loads without extra runtime");
 auto ti=(scs_result_t (*)(scs_u32_t,const scs_telemetry_init_params_t*))GetProcAddress(lib,"scs_telemetry_init");
 auto ii=(scs_result_t (*)(scs_u32_t,const scs_input_init_params_t*))GetProcAddress(lib,"scs_input_init");
 auto ts=(void (*)())GetProcAddress(lib,"scs_telemetry_shutdown");auto is=(void (*)())GetProcAddress(lib,"scs_input_shutdown");
 require(ti&&ii&&ts&&is,"SDK exports");
 scs_telemetry_init_params_v100_t tp={};tp.common.log=logfn;tp.register_for_event=reg_event;tp.register_for_channel=reg_channel;
 scs_input_init_params_v100_t ip={};ip.common.log=logfn;ip.register_device=reg_device;
 require(ti(SCS_TELEMETRY_VERSION_1_00,&tp)==SCS_RESULT_ok,"telemetry callback registration");
 require(ii(SCS_INPUT_VERSION_1_00,&ip)==SCS_RESULT_ok,"input callback registration");
 HANDLE h=OpenFileMappingA(FILE_MAP_ALL_ACCESS,FALSE,POC_MAP_NAME);require(h!=NULL,"shared memory available");
 PocShared* s=(PocShared*)MapViewOfFile(h,FILE_MAP_ALL_ACCESS,0,0,sizeof(PocShared));
 set_float("truck.speed",25);set_float("truck.input.brake",0);event(SCS_TELEMETRY_EVENT_started);event(SCS_TELEMETRY_EVENT_frame_end);
 require(s->telemetry.magic==POC_MAGIC && s->telemetry.speed_mps==25 && s->telemetry.channels_ready==1,"telemetry ABI");
 auto command=[&](unsigned token,float steer){InterlockedIncrement(&s->command.seq);s->command.arm_token=token;s->command.tick_ms=GetTickCount64();s->command.steering=steer;s->command.armed=1;s->command.lateral_active=1;s->command.buttons=1;InterlockedIncrement(&s->command.seq);};
 auto first=[&](){scs_input_event_t e={};require(device.input_event_callback(&e,SCS_INPUT_EVENT_CALLBACK_FLAG_first_in_frame,NULL)==SCS_RESULT_ok,"input frame");return e.value_float.value;};
 command(123,.1f);require(fabsf(first()+.1f)<.00001f,"positive-left command uses negative semantic axis");
 scs_input_event_t e={};device.input_event_callback(&e,0,NULL);require(e.input_index==1&&e.value_bool.value==1,"cruise pulse");
 Sleep(350);require(first()==0,"native 300ms watchdog neutralizes steering");
 command(123,.1f);require(first()==0,"expired command cannot auto-resume");
 command(124,.1f);require(first()<0,"explicit new arm token resumes");
 event(SCS_TELEMETRY_EVENT_paused);require(first()==0,"paused game neutralizes steering");
 event(SCS_TELEMETRY_EVENT_started);require(first()==0,"resume requires rearm");
 command(125,.1f);require(first()<0,"rearm after pause");
 set_float("truck.input.brake",.4f);require(first()==0,"driver brake cancels steering");
 set_float("truck.input.brake",0);command(126,NAN);require(first()==0,"non-finite command is rejected");
 command(127,1);require(fabsf(first()+.25f)<.00001f,"steering bound");
 is();ts();UnmapViewOfFile(s);CloseHandle(h);FreeLibrary(lib);puts("Native smoke checks passed.");return 0;
}

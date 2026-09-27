#pragma once
#include <stdint.h>
#define POC_MAP_NAME "Local\\ETS2_ADAS_POC_V1"
#define POC_MAGIC 0x504F4331u
// Fixed ABI. Telemetry (0..127) and commands (128..159) have separate writers.
struct PocTelemetry {
 uint32_t magic, version;
 volatile long seq;
 uint32_t paused;
 uint64_t tick_ms;
 float speed_mps, cruise_mps, input_steer, input_brake;
 float effective_steer, limit_mps;
 double x, z, heading_turns;
 float route_distance_m;
 uint32_t input_ready, stop_latched, channels_ready;
 uint8_t reserved[40];
};
struct PocCommand {
 volatile long seq;
 uint32_t arm_token;
 uint64_t tick_ms;
 float steering;
 uint32_t buttons, armed, lateral_active;
};
struct PocShared { PocTelemetry telemetry; PocCommand command; };
static_assert(sizeof(PocTelemetry)==128, "telemetry ABI");
static_assert(sizeof(PocCommand)==32, "command ABI");

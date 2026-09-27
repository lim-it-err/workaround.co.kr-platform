"""Windows named-memory adapter. SDK I/O only; no planning and no network."""
import ctypes, json, math, struct, sys, threading, time
from ctypes import wintypes

NAME = r'Local\ETS2_ADAS_POC_V1'
SIZE = 160
kernel = ctypes.WinDLL('kernel32', use_last_error=True)
kernel.OpenFileMappingW.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.LPCWSTR]
kernel.OpenFileMappingW.restype = wintypes.HANDLE
kernel.MapViewOfFile.argtypes = [wintypes.HANDLE,wintypes.DWORD,wintypes.DWORD,wintypes.DWORD,ctypes.c_size_t]
kernel.MapViewOfFile.restype = ctypes.c_void_p
kernel.UnmapViewOfFile.argtypes = [ctypes.c_void_p]
kernel.CloseHandle.argtypes = [wintypes.HANDLE]
kernel.GetTickCount64.restype = ctypes.c_ulonglong
command = None
command_at = 0.0
lock = threading.Lock()
alive = True

def read_commands():
    global command, command_at, alive
    try:
        for line in sys.stdin:
            if len(line)>2048: continue
            try:
                item=json.loads(line)
                steer=float(item.get('steering',0))
                if not math.isfinite(steer): continue
                with lock:
                    command=dict(armToken=int(item.get('armToken',0)) & 0xffffffff,
                                 steering=max(-.25,min(.25,steer)),buttons=int(item.get('buttons',0))&127,
                                 armed=bool(item.get('armed',False)), lateralActive=bool(item.get('lateralActive',False)))
                    command_at=time.monotonic()
            except (ValueError,TypeError,OverflowError): pass
    finally: alive=False

def emit(data):
    try: print(json.dumps(data,allow_nan=False,separators=(',',':')),flush=True)
    except (BrokenPipeError,ValueError): pass

threading.Thread(target=read_commands,daemon=True).start()
handle=pointer=None
try:
    while alive:
        if not pointer:
            handle=kernel.OpenFileMappingW(0xf001f,False,NAME)
            if handle: pointer=kernel.MapViewOfFile(handle,0xf001f,0,0,SIZE)
            if not pointer:
                if handle: kernel.CloseHandle(handle)
                handle=None
                emit(dict(connected=False,reason='ETS2 플러그인 대기'))
                time.sleep(.5); continue
        raw=ctypes.string_at(pointer,128)
        seq=struct.unpack_from('<I',raw,8)[0]
        seq_after=ctypes.c_uint32.from_address(pointer+8).value
        if seq&1 or seq!=seq_after:
            time.sleep(.01); continue
        magic,version=struct.unpack_from('<II',raw)
        paused=struct.unpack_from('<I',raw,12)[0]
        tick=struct.unpack_from('<Q',raw,16)[0]
        now=kernel.GetTickCount64()
        speed,cruise,input_steer,brake,effective,limit=struct.unpack_from('<ffffff',raw,24)
        x,z,heading=struct.unpack_from('<ddd',raw,48)
        distance,ready,stopped,channels=struct.unpack_from('<fIII',raw,72)
        connected=magic==0x504f4331 and version==1 and 0<=now-tick<1000 and tick!=0
        with lock:
            c=command.copy() if command and time.monotonic()-command_at<.2 else None
        if c and connected:
            # Only fresh upstream commands renew the native watchdog.
            payload=struct.pack('<IQfIII',c['armToken'],now,c['steering'],c['buttons'],int(c['armed']),int(c['lateralActive']))
            # Aligned uint32 stores are atomic on the supported Windows x64 target.
            # There is one writer; x86 store ordering and the reader's barriers
            # publish the payload between the odd/even sequence stores.
            seq_cell=ctypes.c_uint32.from_address(pointer+128)
            seq_cell.value=(seq_cell.value+1)&0xffffffff
            ctypes.memmove(pointer+132,payload,len(payload))
            seq_cell.value=(seq_cell.value+1)&0xffffffff
        emit(dict(connected=connected,paused=bool(paused),speedMps=speed,cruiseMps=cruise,
                  inputSteer=input_steer,inputBrake=brake,effectiveSteer=effective,
                  speedLimitMps=limit,x=x,z=z,headingRad=heading*math.tau,
                  routeDistanceM=distance,inputReady=bool(ready),stopLatched=bool(stopped),channelsReady=bool(channels)))
        if not connected:
            kernel.UnmapViewOfFile(pointer); kernel.CloseHandle(handle); pointer=handle=None
        time.sleep(.04)
finally:
    if pointer: kernel.UnmapViewOfFile(pointer)
    if handle: kernel.CloseHandle(handle)

"""Capture only the ETS2 window via Windows Graphics Capture.

NDJSON frames go to the loopback dashboard. There is no desktop-wide fallback
and no disk recording. The named-window owner is checked before each session.
"""
import base64
import ctypes
from ctypes import wintypes
import io
import json
import os
import sys
import threading
import time
from PIL import Image, ImageStat
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'vendor'))
from windows_capture import WindowsCapture

user = ctypes.WinDLL('user32', use_last_error=True)
kernel = ctypes.WinDLL('kernel32', use_last_error=True)
user.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
user.IsWindowVisible.argtypes = [wintypes.HWND]
user.IsIconic.argtypes = [wintypes.HWND]
user.GetForegroundWindow.restype = wintypes.HWND
user.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
kernel.OpenProcess.restype = wintypes.HANDLE
kernel.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
kernel.CloseHandle.argtypes = [wintypes.HANDLE]
CALLBACK = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
user.EnumWindows.argtypes = [CALLBACK, wintypes.LPARAM]
alive = True

def emit(value):
    print(json.dumps(value, ensure_ascii=True, separators=(',', ':')), flush=True)

def find_game():
    found = []
    @CALLBACK
    def visit(hwnd, _):
        title = ctypes.create_unicode_buffer(512)
        user.GetWindowTextW(hwnd, title, len(title))
        if title.value != 'Euro Truck Simulator 2' or not user.IsWindowVisible(hwnd):
            return True
        pid = wintypes.DWORD()
        user.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        handle = kernel.OpenProcess(0x1000, False, pid.value)
        if handle:
            name, size = ctypes.create_unicode_buffer(32768), wintypes.DWORD(32768)
            ok = kernel.QueryFullProcessImageNameW(handle, 0, name, ctypes.byref(size))
            kernel.CloseHandle(handle)
            if ok and os.path.basename(name.value).lower() == 'eurotrucks2.exe':
                found.append((hwnd, pid.value))
        return True
    user.EnumWindows(visit, 0)
    return found[0] if len(found) == 1 else None

def parent_input():
    global alive
    for _ in sys.stdin:
        pass
    alive = False

def main():
    threading.Thread(target=parent_input, daemon=True).start()
    previous_stop = False
    controller = None
    bound_game = None
    latest = None
    latest_at = 0
    emitted_at = 0
    lock = threading.Lock()
    last_check = 0
    game = None
    while alive:
        now = time.monotonic()
        if now - last_check >= 1:
            game = find_game()
            last_check = now
        stopped = bool(game and user.GetForegroundWindow() == game[0] and user.GetAsyncKeyState(0x77) & 0x8000)  # F8
        if stopped and not previous_stop:
            emit({'type': 'stop'})
        previous_stop = stopped
        try:
            if not game:
                if controller:
                    controller.stop()
                    controller = None
                if now - emitted_at >= 1:
                    emit({'type': 'status', 'available': False, 'reason': 'ETS2 창 대기'})
                    emitted_at = now
            elif user.IsIconic(game[0]):
                if now - emitted_at >= 1:
                    emit({'type': 'status', 'available': False, 'reason': 'ETS2 창이 최소화되어 있습니다'})
                    emitted_at = now
            else:
                if controller is None or bound_game != game or controller.is_finished():
                    if controller and not controller.is_finished():
                        controller.stop()
                    latest = None
                    latest_at = 0
                    bound_game = game
                    capturer = WindowsCapture(window_hwnd=game[0], cursor_capture=False,
                                              minimum_update_interval=1000)

                    @capturer.event
                    def on_frame_arrived(frame, capture_control):
                        nonlocal latest, latest_at
                        if not alive:
                            capture_control.stop()
                            return
                        image = Image.fromarray(frame.frame_buffer[:, :, 2::-1])
                        image.thumbnail((1280, 720))
                        with lock:
                            latest, latest_at = image, time.monotonic()

                    @capturer.event
                    def on_closed():
                        pass

                    controller = capturer.start_free_threaded()
                if now - emitted_at >= 1:
                    with lock:
                        frame, at = latest, latest_at
                    if frame is None or now - at > 3:
                        emit({'type': 'status', 'available': False, 'reason': '게임 화면 프레임 대기'})
                    elif max(ImageStat.Stat(frame.resize((32, 18))).mean) < 2:
                        emit({'type': 'status', 'available': False, 'reason': '검은 화면 · 게임 창을 확인하세요'})
                    else:
                        output = io.BytesIO()
                        frame.save(output, 'JPEG', quality=76)
                        emit({'type': 'frame', 'available': True, 'at': time.time() - (now - at),
                              'width': frame.width, 'height': frame.height, 'pid': game[1],
                              'jpeg': base64.b64encode(output.getvalue()).decode('ascii')})
                    emitted_at = now
        except Exception as exc:
            emit({'type': 'status', 'available': False, 'reason': '캡처 실패: ' + str(exc)})
            time.sleep(1)
        time.sleep(.05)
    if controller and not controller.is_finished():
        controller.stop()

if __name__ == '__main__':
    try:
        main()
    except BrokenPipeError:
        pass

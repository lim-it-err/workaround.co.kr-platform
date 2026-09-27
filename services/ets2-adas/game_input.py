"""ETS2-only scan-code input for the requested local recovery application.

Every action verifies the foreground window belongs to eurotrucks2.exe.
This module does not expose arbitrary keystrokes through HTTP.
"""
import ctypes
from ctypes import wintypes
import time
from capture import find_game

user = ctypes.WinDLL('user32', use_last_error=True)
ULONG_PTR = ctypes.c_size_t

class KEYBDINPUT(ctypes.Structure):
    _fields_=[('wVk',wintypes.WORD),('wScan',wintypes.WORD),('dwFlags',wintypes.DWORD),('time',wintypes.DWORD),('dwExtraInfo',ULONG_PTR)]
class MOUSEINPUT(ctypes.Structure):
    _fields_=[('dx',wintypes.LONG),('dy',wintypes.LONG),('mouseData',wintypes.DWORD),('dwFlags',wintypes.DWORD),('time',wintypes.DWORD),('dwExtraInfo',ULONG_PTR)]
class INPUT_UNION(ctypes.Union):
    _fields_=[('ki',KEYBDINPUT),('mi',MOUSEINPUT)]
class INPUT(ctypes.Structure):
    _anonymous_=('data',)
    _fields_=[('type',wintypes.DWORD),('data',INPUT_UNION)]

user.SendInput.argtypes=[wintypes.UINT,ctypes.POINTER(INPUT),ctypes.c_int]
user.SendInput.restype=wintypes.UINT
user.GetForegroundWindow.restype=wintypes.HWND
user.SetForegroundWindow.argtypes=[wintypes.HWND]
user.MapVirtualKeyW.argtypes=[wintypes.UINT,wintypes.UINT]
user.GetClientRect.argtypes=[wintypes.HWND,ctypes.POINTER(wintypes.RECT)]
user.ClientToScreen.argtypes=[wintypes.HWND,ctypes.POINTER(wintypes.POINT)]
user.SetCursorPos.argtypes=[ctypes.c_int,ctypes.c_int]

KEYS={'F7':0x76,'ENTER':0x0d,'1':0x31,'ESC':0x1b,'TAB':0x09}

class GameInput:
    def __init__(self,cancelled=lambda:False):
        game=find_game()
        if not game: raise RuntimeError('ETS2 창을 찾을 수 없습니다.')
        self.game=game
        self.cancelled=cancelled
        self.held=[]

    def check(self):
        if self.cancelled() or user.GetAsyncKeyState(0x77)&0x8000:
            raise RuntimeError('사용자가 복구를 중단했습니다.')
        if find_game()!=self.game:
            raise RuntimeError('ETS2 창 또는 프로세스가 바뀌었습니다.')
        if user.GetForegroundWindow()!=self.game[0]:
            raise RuntimeError('ETS2가 활성 창이 아닙니다. 입력하지 않았습니다.')

    def focus(self):
        user.SetForegroundWindow(self.game[0])
        self.wait(.8)
        self.check()

    def send(self,item):
        if user.SendInput(1,ctypes.byref(item),ctypes.sizeof(INPUT))!=1:
            raise RuntimeError('게임 입력 전송 실패: '+str(ctypes.get_last_error()))

    def key(self,name):
        self.check()
        scan=user.MapVirtualKeyW(KEYS[name],0)
        down=INPUT(type=1,ki=KEYBDINPUT(0,scan,0x0008,0,0))
        up=INPUT(type=1,ki=KEYBDINPUT(0,scan,0x0008|0x0002,0,0))
        self.held.append(up)
        try:
            self.send(down)
            self.wait(.15)
        finally:
            self.send(up)
            self.held.remove(up)

    def wait(self,seconds):
        deadline=time.monotonic()+seconds
        while time.monotonic()<deadline:
            if self.cancelled() or user.GetAsyncKeyState(0x77)&0x8000:
                raise RuntimeError('사용자가 복구를 중단했습니다.')
            time.sleep(.01)

    def click(self,x,y,width=1280,height=720):
        self.check()
        rect=wintypes.RECT()
        if not user.GetClientRect(self.game[0],ctypes.byref(rect)):
            raise RuntimeError('게임 화면 크기 조회 실패')
        if abs((rect.right-rect.left)/(rect.bottom-rect.top)-width/height)>.02:
            raise RuntimeError('게임 화면 비율이 보정한 화면과 다릅니다.')
        point=wintypes.POINT(round(x/width*rect.right),round(y/height*rect.bottom))
        user.ClientToScreen(self.game[0],ctypes.byref(point))
        # Send an absolute MOVE event as well as button state; SetCursorPos alone
        # does not update every game's internal pointer.
        left,top=user.GetSystemMetrics(76),user.GetSystemMetrics(77)
        desktop_w,desktop_h=user.GetSystemMetrics(78),user.GetSystemMetrics(79)
        self.send(INPUT(type=0,mi=MOUSEINPUT(round((point.x-left)*65535/(desktop_w-1)),round((point.y-top)*65535/(desktop_h-1)),0,0x8000|0x4000|0x0001,0,0)))
        self.wait(.5)
        self.check()
        down=INPUT(type=0,mi=MOUSEINPUT(0,0,0,0x0002,0,0))
        up=INPUT(type=0,mi=MOUSEINPUT(0,0,0,0x0004,0,0))
        self.held.append(up)
        try:
            self.send(down)
            self.wait(.4)
        finally:
            self.send(up)
            self.held.remove(up)

    def release(self):
        for item in self.held[:]:
            try: self.send(item)
            except Exception: pass
        self.held.clear()

"""Screen-checked ETS2 recovery adapter; calibration is developed in stages."""
import io
import json
from pathlib import Path
import sys
import math
import time
import threading
import urllib.request
import numpy as np
from PIL import Image
from game_input import GameInput

ROOT=Path(__file__).resolve().parent

def emit(value):
    print(json.dumps(value,ensure_ascii=True),flush=True)

def screen():
    with urllib.request.urlopen('http://127.0.0.1:8765/api/frame.jpg',timeout=3) as response:
        return Image.open(io.BytesIO(response.read())).convert('RGB')

def state():
    with urllib.request.urlopen('http://127.0.0.1:8765/api/state',timeout=3) as response:
        return json.load(response)

def matches(image,name,box):
    expected=np.asarray(Image.open(ROOT/'recovery-templates'/name).convert('L'),dtype=np.float32)
    actual=np.asarray(image.crop(box).convert('L'),dtype=np.float32)
    if actual.shape!=expected.shape: return False
    a=actual.ravel()-actual.mean();b=expected.ravel()-expected.mean()
    score=float(np.dot(a,b)/max(1,np.linalg.norm(a)*np.linalg.norm(b)))
    return score>=.93

def main():
    request=json.loads(sys.stdin.readline())
    cancelled=threading.Event()
    def watch_parent():
        try:
            for line in sys.stdin:
                if json.loads(line).get('action')=='cancel':
                    break
        except Exception:
            pass
        finally:
            cancelled.set()
    threading.Thread(target=watch_parent,daemon=True).start()
    control=None
    try:
        frame=screen()
        if frame.size!=(1280,720):
            raise RuntimeError('현재 화면이 보정한 1280×720 화면과 다릅니다.')
        control=GameInput(cancelled=cancelled.is_set)
        control.focus()
        if matches(frame,'tow-confirm.png',(453,323,594,339)):
            before=request['telemetry']
            control.key('ENTER')
            emit({'type':'progress','message':'정비소 견인 확인 · 실제 위치 이동 대기'})
            deadline=time.monotonic()+90
            while time.monotonic()<deadline:
                current=state()['telemetry']
                if current.get('connected') and math.hypot(current.get('x',before['x'])-before['x'],current.get('z',before['z'])-before['z'])>5:
                    emit({'type':'result','requestId':request['id'],'moved':True,'repaired':False,'reason':'정비소 이동을 SDK 위치 변화로 확인 · 수리 메뉴 확인 대기'})
                    return
                control.wait(.5)
            raise RuntimeError('견인 후 실제 위치 이동을 확인하지 못했습니다.')
        elif matches(frame,'service-title.png',(595,23,705,47)):
            control.key('1')
            emit({'type':'progress','message':'견인 서비스 선택 키 전송 · 다음 화면 검증 대기'})
            emit({'type':'result','requestId':request['id'],'moved':False,'repaired':False,'reason':'견인 서비스 입력 시험 완료 · 실제 이동·수리 확인 전'})
        elif matches(frame,'workshop-title.png',(605,187,675,208)):
            raise RuntimeError('정비소 도착 · 서비스 선택 자동 클릭이 반영되지 않아 수리 연결 보류')
        elif matches(frame,'workshop-prompt.png',(570,42,737,55)):
            control.key('ENTER')
            emit({'type':'progress','message':'검증한 정비소 위치에서 서비스 메뉴 열기'})
            emit({'type':'result','requestId':request['id'],'moved':False,'repaired':False,'reason':'정비소 메뉴 열기 · 이번 요청에서 이동·수리 완료는 미확인'})
        else:
            raise RuntimeError('현재 화면이 확인된 F7 서비스/견인 확인 메뉴가 아닙니다.')
    except Exception as exc:
        emit({'type':'result','requestId':request.get('id'),'moved':False,'repaired':False,'reason':str(exc)})
        sys.exit(1)
    finally:
        if control: control.release()

if __name__=='__main__':main()

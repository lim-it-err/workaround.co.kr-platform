# 화면 캡처 의존성

PoC 폴더의 vendor에만 설치했으며 시스템 Python 패키지를 바꾸지 않았다.

| 라이브러리 | 버전 | 용도 | 출처 |
|---|---|---|---|
| windows-capture | 2.0.1 | Windows Graphics Capture로 지정 ETS2 HWND 캡처 | [프로젝트](https://github.com/NiiightmareXD/windows-capture/tree/main/windows-capture-python) · MIT |
| opencv-python-headless | 5.0.0.93 | windows-capture의 cv2 의존성 | [PyPI](https://pypi.org/project/opencv-python-headless/5.0.0.93/) |
| Pillow | PC 번들 런타임 12.3.0 | JPEG 변환 및 축소 | [공식 문서](https://pillow.readthedocs.io/) |
| NumPy | PC 번들 런타임 | 프레임 배열 | [공식 문서](https://numpy.org/doc/) |

배포 휠에 포함된 각 라이선스를 vendor의 dist-info 및 cv2 폴더에 그대로 포함한다. Windows Capture는 모니터 전체 캡처 기능도 제공하지만 이 앱에서는 검증된 ETS2 창 핸들만 넘긴다. 최소화/연결 실패 시 전체 화면으로 전환하지 않는다.

새 PC의 Python에는 먼저 NumPy/Pillow가 필요하다. 게임 화면을 읽는 프로세스는 게임과 같은 Windows 사용자 세션에서 실행해야 한다. 실제 검증은 현재 PC의 Windows/ETS2 1.61.1.1 조합에서 수행했다.

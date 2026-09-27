# 이동·수리 연결 상태

현재는 정체 감지 → 복구 요청 생성과 수동 단계별 입력 시험을 구현했다. **견인은 실게임에서 확인했지만 자동 수리는 미완성이다.** ETS2 1.61.1.1, 한국어, 16:9 화면에서 F7 서비스 제목과 견인 확인 문구를 캡처하여 확인한 화면에만 입력한다. 스캔 코드의 `1`/Enter 입력으로 견인이 실행되었고, SDK 좌표와 게임 로그에서 약 854m 이동을 확인했다. 도착 후 Enter로 차량 서비스 메뉴에 진입했으나 서비스 항목의 자동 마우스 클릭은 반영되지 않았다.

`recovery_adapter.py`는 보정 중인 단계별 어댑터다. 자동 연속 흐름과 수리 완료 판정이 없으며, `manualOnly: true`로 120초 감시의 무인 호출을 차단한다. 대시보드의 ‘견인 서비스 입력 시험’으로 확인된 메뉴에서 한 단계씩 실행한다. 아직 어느 경로도 `repaired: true`를 반환하지 않는다. 버튼을 눌렀다는 사실을 수리 성공으로 표시하지 않는다.

SCS의 [1.59 설명](https://blog.scssoft.com/2026/04/159-update-tow-to-road.html)에 따르면 도로로 이동(Tow to Road)과 정비소 이동(Tow to Service)은 별개 기능이다. 도로 복귀만으로 수리가 완료되지는 않는다. 정비소 이동 및 수리에는 게임 돈/시간이 소모될 수 있다.

## 다음 구현 단계

1. 정비소 서비스 항목을 선택하는 입력 문제를 해결하고 실제 수리 화면을 확인한다.
2. 손상도·수리 결과의 확인을 추가하고 화면 전환을 하나의 상태 머신으로 연결한다.
3. 수동 1회 전체 복구를 검증한 후 `manualOnly`를 해제하고 120초 자동 감지 경로로 검증한다. 확인 전에는 해제하지 않는다.
4. 수리 후 재출발/경로 추종은 별도 주행 계획 기능으로 추가한다.

## Java·오픈소스 교체 경계

`monitor.js`는 단조 증가 시계와 SDK 관측만 사용하는 순수 상태 머신이다. 이후 Java 서비스로 옮겨도 120초 조건과 테스트 시나리오를 유지한다.

`recovery.config.json`의 `executable`에 로컬 실행 파일 절대 경로, `args`에 인수 배열을 지정한다. Python 어댑터는 `executable: "@python"`으로 번들 런타임을 선택한다. 설정은 로컬 파일로만 변경하며 웹에서 임의 명령을 받지 않는다. 실행할 때 셸은 사용하지 않는다.

어댑터 stdin에는 요청 JSON 1줄을 전달하고 연결을 유지한다:

```json
{"schemaVersion":1,"id":"요청별 UUID","reason":"low-speed-120s","at":"ISO 날짜","telemetry":{"connected":true,"paused":false,"speedMps":0,"x":0,"z":0},"frameAvailable":true}
```

stdout은 NDJSON이며, 진행과 최종 응답을 구분한다. 실제 이동·수리를 확인한 경우에만 다음과 같이 보고한다:

```json
{"type":"progress","message":"정비소 이동 확인"}
{"type":"result","requestId":"요청별 UUID","moved":true,"repaired":true}
```

실패는 `moved`/`repaired`를 관측대로 두고 `reason`에 원인을 보고한다. 요청 ID 일치, 두 값 모두 true, 종료 코드 0이 모두 충족되어야 앱이 완료 응답으로 인정한다. **현재 이 응답은 어댑터의 보고에 의존한다.** Node에서 손상도를 독립 검증하는 구현은 아직 없다. 완료 시 5분 대기, 실패 시 사용자의 감시 재시작 전까지 보류한다.

중단 시 stdin에 `{"action":"cancel"}`을 보낸다. 어댑터는 취소 또는 stdin EOF를 감지하면 눌린 키/마우스를 해제하고 종료한다. 1초 안에 종료하지 않으면 상위 프로그램이 프로세스를 종료한다. 전체 실행 제한은 180초, 견인 후 위치 확인 제한은 90초다. 어댑터는 별도 데몬/손자 프로세스를 남기지 않아야 한다. 단순히 키를 보냈다는 이유만으로 완료 응답을 보내면 안 된다.

## 화면 API

- `GET /api/frame.jpg`: 최신 ETS2 JPEG, 오래되면 503. 메모리 한 장만 유지한다.
- `GET /api/state`: `version:2`, `continuous`, `uptimeSeconds`, `capture`, `monitor`, `recovery`.
- POST `/api/action`: 기존 명령 외 `monitorStart`, `monitorStop`, `recoveryNow`, `shutdown`. `recoveryNow`는 SDK 연결 및 속도 1km/h 미만에서만 단계별 수동 시험을 시작한다.
- `lease`는 이전 UI 호환용이며 더 이상 브라우저 연결 유지에 의존하지 않는다. SDK 입력 명령의 300ms 만료는 유지한다.
- 로컬 주소는 `http://localhost:8765`, `http://127.0.0.1:8765`. POST에는 해당 주소와 일치하는 Origin, JSON Content-Type, X-Poc-Token이 필요하다.

게임 프레임은 `capture.py`, 트럭 상태/입력은 `bridge.py`가 각각 NDJSON으로 제공한다. Java의 `ProcessBuilder`로 이 경계를 그대로 재사용할 수 있다.

## 서버와 SDK

공식 SCS SDK는 내 트럭의 텔레메트리와 기본 입력 장치를 제공한다. [공식 문서](https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry)와 동봉 헤더를 기준으로, 다른 차량 전체 목록·차선 경계·견인·수리를 직접 호출하는 API는 제공하지 않는다. 게임 PC의 SDK 플러그인/입력/캡처 연결은 유지해야 한다.

Java 서버는 상태 수집, 120초 정체 감지, 경로·추월 판단, 기록을 맡을 수 있다. 게임 PC의 연결 프로그램에는 빠른 조작 루프와 명령 만료 처리를 둔다. 처음에는 모두 같은 PC에서 실행하고 필요할 때 판단 부분을 별도 서버로 이동한다. 원격 서버를 추가할 때는 명령 ID·유효시간·연결 끊김 중단을 유지하고 통신 인증을 별도로 설계한다. 현재 localhost API를 그대로 외부에 공개하는 구성이 아니다.

차선·주변 차량 정보는 영상 인식 또는 별도의 검증된 데이터 연결, 도로 경로는 지도 데이터 처리가 필요하다. 일반 서버리스 함수는 기록·비동기 분석에 사용할 수 있지만, 이 PoC의 상시 게임 제어 루프를 대체하지 않는다. GPU가 있는 원격 Windows 환경에서 게임과 연결 프로그램을 함께 실행하는 구성도 가능성을 검토할 수 있으나, 현재 제공물에서 검증한 배포 방식은 로컬 PC다.

# Java로 옮길 경계

현재 구성은 외부 서버·클라우드·npm 패키지 없이 동작한다. 실제 게임에는 로컬 프로세스가 필요하다. 브라우저 시뮬레이션은 `index.html`을 직접 열면 로컬 서버도 필요 없다.

```text
ETS2 1.61 ─ SCS SDK ─ ets2_adas_poc.dll
                          ↕ Windows shared memory (protocol v1)
                       bridge.py                 ← Windows I/O만 담당
                          ↕ NDJSON stdin / stdout
                       server.js                 ← 이후 Java 서비스로 교체
                          ↕ loopback HTTP
                       브라우저

controller.js ─ 실제 차선 변경 + 브라우저 시뮬레이터에서 공동 사용
```

Java 서버를 다른 PC에 둘 때도 입력 만료 감시와 최종 제어 루프는 게임 PC에 남긴다. 원격 서버는 차로 의도, 목표 속도, 경로 등을 보내고, 프레임별 조향을 네트워크 왕복에 맡기지 않는 구조를 권장한다. 현재 외부 접속 포트는 열지 않는다.

## 게임 → 판단 로직

`bridge.py`는 줄마다 JSON 한 개를 stdout으로 내보낸다. 게임 연결 시 약 25Hz, 게임이 없으면 약 2Hz다. 값이 없는 상태를 0으로 해석하지 말고 `connected`, `channelsReady`, `paused`를 먼저 검사한다.

```json
{
  "connected": true,
  "paused": false,
  "speedMps": 25.0,
  "cruiseMps": 25.0,
  "inputSteer": 0.0,
  "inputBrake": 0.0,
  "effectiveSteer": 0.0,
  "speedLimitMps": 22.222,
  "x": 1000.0,
  "z": 2000.0,
  "headingRad": 0.0,
  "routeDistanceM": 15000.0,
  "inputReady": true,
  "stopLatched": false,
  "channelsReady": true
}
```

- 미터, 초, m/s, 라디안. 화면에서만 km/h로 변환한다.
- 월드 X: 동쪽, Z: 남쪽. heading 0: 북쪽, 양수: 위에서 봤을 때 반시계 방향.
- `routeDistanceM`는 목적지까지 거리다. 경로 폴리라인·분기점·차로 정보가 아니다.
- `speedLimitMps`, `routeDistanceM`는 SDK 선택 채널이며 0이면 이 PoC에서 사용 가능 여부를 확정할 수 없다.
- 주변 차량·차선 중심·차로 폭·앞차 간격은 이 SDK 어댑터에 없다. 실측인 것처럼 0이나 합성 값으로 채우지 않는다.

## 판단 로직 → 게임

stdin에 JSON 한 줄을 쓰고 flush한다. 정상 명령 갱신 주기는 40ms다. 입력 프로세스 하나만 연결한다.

```json
{"armToken":12345,"armed":true,"steering":0.08,"buttons":32,"lateralActive":true}
```

- `steering`: 양수 왼쪽, 음수 오른쪽. 정규화 입력이며 최대 절댓값 0.25. 실제 휠 각도가 아니다.
- 현재 프로필의 기본 믹서는 `- semantical.steering`이므로 플러그인에서 부호를 반전한다. 커스텀 컨트롤 믹서를 쓰는 경우 반드시 확인한다.
- `lateralActive=false`이면 커스텀 조향 0. 가속·제동 페달 명령은 구현하지 않았다.
- `armToken`: 명시적으로 명령 준비를 누를 때마다 새 32비트 값. 일시정지·브레이크·F8·만료 후에는 새 토큰으로 다시 준비해야 한다.
- `buttons`: 1 ACC 설정/해제, 2 ACC 재개, 4 크루즈 증가, 8 감소, 16 내장 차선유지 토글, 32 왼쪽 방향지시등 유지, 64 오른쪽 유지. 버튼은 약 140ms 펄스 후 0으로 복귀시킨다.
- Python은 상위 명령이 200ms 이상 끊기면 하트비트를 갱신하지 않는다. DLL은 자체 시계로 300ms가 지난 명령을 거부한다. Node만의 타이머에 의존하지 않는다.
- F8은 커스텀 입력을 끈다. ETS2 내장 ACC는 독립 기능이므로 브레이크 또는 크루즈 버튼으로 해제한다.

`java/BridgeProbe.java`는 Java 8 이상에서 컴파일 가능한 읽기 전용 연결 예제다. 향후 Jackson 등으로 위 JSON을 DTO에 매핑하고, `controller.js`의 순수 함수와 `tests/controller.test.cjs`의 시나리오를 Java로 이식하면 된다. Node와 Java를 동시에 제어 생산자로 실행하지 않는다.

## 다음 단계 입력 계약

추월 판단을 추가할 때 별도의 인식/지도 어댑터가 다음 값을 실제 관측으로 제공해야 한다.

```json
{
  "schemaVersion": 1,
  "timestampMs": 0,
  "ego": {"speedMps": 25.0, "laneId": "right"},
  "perception": {
    "valid": false,
    "ageMs": null,
    "confidence": null,
    "laneCenterOffsetM": null,
    "laneWidthM": null,
    "vehicles": null
  },
  "route": {"polyline": null, "nextExitDistanceM": null, "preferredLaneId": null}
}
```

인식 유효성과 관측 시간을 검증 → 목표 차로의 앞뒤 간격과 TTC 확인 → 경로상 출구/분기 제약 확인 → 추월 요청 → 차선 변경 상태 머신 순서로 확장한다. 현재 시뮬레이터에만 앞뒤 간격 및 출구 제약의 간단한 예제가 있다.

## 로컬 웹 API

PoC 02는 [RECOVERY.md](RECOVERY.md)의 화면/감시/복구 계약을 추가한다. `GET /api/state`의 `version`은 2다. 브라우저 lease 만료는 제거했으며 SDK 명령 300ms 만료는 유지한다. `capture.py`의 창 캡처와 `monitor.js`의 상태 머신도 Java 전환 경계다.

- `GET /api/state`: 상태 및 현재 세션 토큰. `telemetry` 안의 게임 값은 실측이며, `maneuver`는 제어기의 추정 상태다.
- `POST /api/action`: `{ "action": "arm" | "stop" | "lease" | "cruise" | "plus" | "minus" | "laneToggle" }`
- 차선 변경: `{ "action":"laneChange", "direction":"left", "clearRoad":true, "laneAssistOff":true, "widthM":3.6 }`
- POST에는 같은 출처의 `Origin`, `Content-Type: application/json`, `/api/state`에서 받은 `X-Poc-Token`이 필요하다.
- `127.0.0.1:8765`에서만 수신한다. 정적 시뮬레이터에서는 이 API를 사용하지 않는다.
- `localhost:8765` Host도 허용한다. `GET /api/frame.jpg`는 메모리의 최신 게임 JPEG를 반환한다.
- `monitorStart`, `monitorStop`, `shutdown`이 추가됐다. 전체 제어 `stop`은 감시·복구도 중단한다. 서버 시작 시 감시는 자동 활성화되며 주행 제어 arm과 별개다.

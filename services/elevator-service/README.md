# elevator-service

`v0.3.0` 기준의 23층, 4대 다중 엘리베이터 실시간 교통 시뮬레이터다.

## 목적

- `localhost:7000` 통합 프리뷰 안에서 살아 있는 건물처럼 보이는 엘리베이터 군집 제어를 제공한다.
- 추상적인 hall call 대신 `승객` 단위 상태를 노출한다.
- 자동 수요 루프, 정원 20명 제약, 층 사이 연속 이동 위치를 같은 계약 안에서 제공한다.

## 기본 계약

- `README.md`
- `Dockerfile`
- `GET /health`
- `GET /api/state`
- `POST /api/passenger`
- `POST /api/demand`
- `POST /api/call` (`legacy` 호환)
- `POST /api/step` (디버그용 보조 제어)
- `POST /api/reset`

## 로컬 실행

- 기본 주소: `http://localhost:8003`
- 헬스체크: `GET /health`
- 상태 조회: `GET /api/state`
- 승객 1명 추가: `POST /api/passenger`
- 수요 프리셋/강도 변경: `POST /api/demand`
- 디버그 step: `POST /api/step`
- 리셋: `POST /api/reset`

## 상태 모델

`GET /api/state` 는 아래 필드를 포함한 메모리 스냅샷을 반환한다.

```json
{
  "service": "elevator-service",
  "mode": "live-traffic-loop",
  "tick": 12,
  "building": {
    "minFloor": 1,
    "maxFloor": 23,
    "totalFloors": 23
  },
  "floors": [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  "elevators": [
    {
      "id": "E1",
      "currentFloor": 8,
      "position": 8.5,
      "direction": "up",
      "doorState": "closed",
      "status": "moving",
      "queue": [12, 18],
      "assignedPassengerIds": ["P-00012"],
      "passengers": [
        {
          "id": "P-00009",
          "originFloor": 3,
          "destinationFloor": 12,
          "direction": "up",
          "status": "onboard"
        }
      ],
      "capacity": 20,
      "currentLoad": 1,
      "lastStop": 7,
      "nextTarget": 12
    }
  ],
  "waitingPassengers": [
    {
      "id": "P-00012",
      "originFloor": 18,
      "destinationFloor": 3,
      "direction": "down",
      "status": "waiting",
      "assignedElevatorId": "E1"
    }
  ],
  "completedPassengers": [],
  "hallCalls": [
    {
      "id": "H-18-down",
      "floor": 18,
      "direction": "down",
      "assignedElevatorId": "E1",
      "assignedElevatorIds": ["E1"],
      "passengerCount": 1
    }
  ],
  "completedCalls": [],
  "floorQueues": [
    {
      "floor": 18,
      "up": 0,
      "down": 1,
      "topDestinations": {
        "up": [],
        "down": [{ "floor": 3, "count": 1 }]
      }
    }
  ],
  "demand": {
    "preset": "normal",
    "presetLabel": "보통",
    "intensity": 55,
    "autoMode": true,
    "stepSeconds": 0.35
  },
  "summary": {
    "activeHallCalls": 1,
    "movingElevators": 1,
    "idleElevators": 3,
    "waitingPassengers": 1,
    "onboardPassengers": 1,
    "loadRatio": 0.013
  }
}
```

## 명령 API

### 승객 1명 추가

```http
POST /api/passenger
Content-Type: application/json

{"floor": 12, "direction": "down"}
```

- 요청 1회는 hall call 1건이 아니라 승객 1명을 만든다.
- 승객은 항상 `originFloor`, `destinationFloor`, `direction`, `status` 를 가진다.
- `direction=up` 이면 `destinationFloor > originFloor`, `direction=down` 이면 `destinationFloor < originFloor` 인 목적층이 자동 생성된다.

### 수요 프리셋/강도 변경

```http
POST /api/demand
Content-Type: application/json

{"preset": "busy", "intensity": 80}
```

- `preset` 은 `quiet`, `normal`, `busy` 중 하나다.
- `intensity` 는 `0..100` 범위다.
- 변경 결과는 즉시 다음 자동 승객 생성 루프에 반영된다.

### 레거시 hall call 호환

```http
POST /api/call
Content-Type: application/json

{"floor": 12, "direction": "down"}
```

- 내부적으로는 `legacy-call` 소스 승객 1명을 생성한다.
- 기존 게이트웨이/프론트 프록시를 즉시 깨지 않도록 남겨 둔 호환 경로다.

### 디버그 step

```http
POST /api/step
Content-Type: application/json

{}
```

- 자동 루프가 기본이다.
- `step` 은 개발/디버그 상황에서만 보조 제어로 사용한다.

### 리셋

```http
POST /api/reset
Content-Type: application/json

{}
```

## 게이트웨이 경유 경로

- `GET /api/services/elevator-service/api/state`
- `POST /api/services/elevator-service/api/passenger`
- `POST /api/services/elevator-service/api/demand`
- `POST /api/services/elevator-service/api/call`
- `POST /api/services/elevator-service/api/step`
- `POST /api/services/elevator-service/api/reset`

프론트엔드는 이 프록시 경로를 우선 사용하고, 실패 시 local mock 상태로 저하한다.

## 환경 변수

- `PORT`: HTTP 포트, 기본값 `8003`
- `SERVICE_NAME`: 응답에 표시할 이름, 기본값 `elevator-service`
- `MIN_FLOOR`: 최저층, 기본값 `1`
- `MAX_FLOOR`: 최고층, 기본값 `23`
- `ELEVATOR_COUNT`: 엘리베이터 대수, 기본값 `4`
- `ELEVATOR_CAPACITY`: car 정원, 기본값 `20`
- `AUTO_STEP_SECONDS`: 자동 루프 간격, 기본값 `0.35`
- `MOVE_STEP_PER_TICK`: tick 당 층 사이 이동량, 기본값 `0.25`
- `BOARDING_DWELL_TICKS`: 문 열림 유지 tick, 기본값 `2`

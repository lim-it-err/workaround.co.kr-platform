# elevator-service

`v0.3.0` 후보로 발전시킬 엘리베이터 시뮬레이터 서비스 계약 후보이다.

## 목적

- `sample-python-service`를 대체할 수 있는 구체적인 서비스 계약 후보를 제공한다.
- `v0.3.0` 에서 실제 엘리베이터 시뮬레이터로 확장할 수 있는 출발점을 제공한다.

## 계약

- `README.md`
- `Dockerfile`
- `/health` 엔드포인트
- HTTP 샘플 엔드포인트

## 로컬 실행

- 기본 주소: `http://localhost:8003`
- 헬스 체크: `GET /health`
- 샘플 엔드포인트: `GET /api/ping`
- 상태 엔드포인트: `GET /api/state`
- 호출 엔드포인트: `POST /api/call`
- 진행 엔드포인트: `POST /api/step`
- 초기화 엔드포인트: `POST /api/reset`

## 시뮬레이터 상태

`GET /api/state` 는 현재 메모리 상태를 반환한다.

```json
{
  "service": "elevator-service",
  "currentFloor": 7,
  "targetFloors": [1, 3, 5, 7, 9],
  "queue": [],
  "direction": "idle",
  "mode": "interactive",
  "lastCommand": "boot",
  "moving": false,
  "nextTarget": null
}
```

## 명령 API

층 호출:

```http
POST /api/call
Content-Type: application/json

{"floor": 3}
```

한 tick 진행:

```http
POST /api/step
Content-Type: application/json

{}
```

초기 상태로 리셋:

```http
POST /api/reset
Content-Type: application/json

{}
```

## 게이트웨이 경유 경로

- 통합 프리뷰 경로: `GET /api/services/elevator-service/api/state`
- 층 호출: `POST /api/services/elevator-service/api/call`
- 한 tick 진행: `POST /api/services/elevator-service/api/step`
- 초기화: `POST /api/services/elevator-service/api/reset`
- 프런트엔드는 이 경로를 통해 엘리베이터 상태를 읽고, 실패하면 로컬 mock 상태로 저하한다.

## 환경 변수

- `PORT`: HTTP 포트, 기본값 `8003`
- `SERVICE_NAME`: 응답에 표시할 이름, 기본값 `elevator-service`
- `CURRENT_FLOOR`: 시뮬레이터가 보고할 현재 층, 기본값 `7`

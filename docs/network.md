문서 상태: 작성완료

# 네트워크 정책

## 로컬 기본 형태

MVP 스택은 Docker Compose 기반 로컬 개발을 기본으로 한다.

- `frontend`
- `gateway`
- `redis`
- `sample-spring-service`
- `ion2-worker`
- `elevator-service`

외부 RTX5070 Ollama 서버는 기본 compose 스택에 포함하지 않는다.

## HTTP 우선

서비스 간 통신은 기본적으로 HTTP 를 사용한다.

```text
frontend -> gateway -> services
worker -> gateway or services
worker -> external Ollama
```

- `v0.2.0` 에서는 `sample-spring-service` 와 기본 포털 연결을 확인한다.
- `v0.3.0` 에서는 `elevator-service` 가 23층, 4대 실시간 군집 제어 상태를 제공한다.
- `v0.4.0` 에서는 같은 포털 안의 Work Manager 조회/명령 경로를 확장한다.

## 공개 사이트 진입점

공개 도메인 진입점은 로컬 프리뷰와 분리한다.

```text
Internet -> Caddy (80/443) -> public-site
```

- `workaround.co.kr`: 대표 도메인
- `workaround.kr`: 대표 도메인으로 리다이렉트
- `www.*`: 대표 도메인으로 리다이렉트

## 게이트웨이 라우팅

서브서비스는 기본적으로 아래 경로로 노출한다.

```text
/api/services/{serviceId}/**
```

예:

```text
GET /api/services/elevator-service/api/state
```

위 경로는 게이트웨이가 `elevator-service` 의 `/api/state` 로 전달한다.

## elevator-service 프록시 계약

`v0.3.0` 기준 프론트는 아래 프록시 경로를 사용한다.

```text
GET  /api/services/elevator-service/api/state
POST /api/services/elevator-service/api/passenger
POST /api/services/elevator-service/api/demand
POST /api/services/elevator-service/api/call
POST /api/services/elevator-service/api/step
POST /api/services/elevator-service/api/reset
```

- `POST /api/passenger`: 승객 1명을 생성한다. hall call 1건이 아니라 `originFloor`, `destinationFloor`, `direction` 을 가진 사람 1명이다.
- `POST /api/demand`: `quiet`, `normal`, `busy` 프리셋과 `0..100` 강도를 갱신한다.
- `POST /api/call`: 기존 프록시를 깨지 않기 위한 레거시 호환 경로다. 내부적으로는 승객 1명을 만든다.
- `POST /api/step`: 자동 루프가 기본인 현재 모델에서 디버그/개발용 보조 제어다.
- `GET /api/state`: `position`, `currentLoad`, `passengers[]`, `waitingPassengers[]`, `floorQueues[]`, `demand`, `summary` 를 포함한 스냅샷을 반환한다.

예시 payload:

```json
{
  "floor": 12,
  "direction": "down"
}
```

## 메타 조회 경로

게이트웨이는 아래 메타 경로도 제공할 수 있다.

```text
/api/services
/api/health
/api/runtime
/api/work-manager/board
```

- `/api/runtime`: 노드 타깃, offload 규칙, Ollama 저하 정책 descriptor
- `/api/work-manager/board`: `docs/tickets/board.md` 와 티켓 파일을 읽어 `backlog`, `started`, `need_review`, `finished` 컬럼 데이터와 보조 feed 를 조합한 조회 경로
- `POST /api/work-manager/auth`: 공유 비밀번호 검증 후 짧은 세션 토큰 발급
- `POST /api/work-manager/tickets/{ticketId}/transition`, `POST /api/work-manager/commands`: `X-Work-Manager-Token` 이 있을 때만 허용

## 외부 Ollama

Ollama 는 환경 변수로 설정한다.

```text
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

기본값은 같은 Windows 호스트의 Ollama 를 Docker Compose 컨테이너에서 본다는 전제다.
별도 RTX5070 장비를 쓰면 고정 IP 또는 별도 호스트명으로 바꾼다.

Ollama 가 내려가 있어도 플랫폼 전체가 죽으면 안 된다.
이 경우 헬스 상태는 `degraded` 또는 `unavailable` 로 표현한다.

## 비밀값

실제 비밀값은 커밋하지 않는다.
`.env.example` 같은 예시 파일만 저장한다.

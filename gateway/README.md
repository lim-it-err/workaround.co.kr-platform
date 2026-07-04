# 게이트웨이

Spring Boot 기반 API 게이트웨이, 라우터, 티켓 발행기, 개발용 인증 계층, 헬스 집계 계층이다.

## 책임

- 프런트엔드 요청을 서브서비스로 라우팅한다.
- 정형 티켓을 발행하고 상태 API를 노출한다.
- Redis, 워커, 서브서비스, 외부 Ollama 상태를 집계한다.
- 변경 계열 API에 `X-Platform-Key` 기반 개발용 인증을 적용한다.

비즈니스 로직 본체는 게이트웨이가 아니라 독립 서비스에 둔다.

## 현재 API 표면

- `GET /api/health`
- `GET /api/runtime`
- `GET /api/work-manager/board`
- `POST /api/work-manager/auth`
- `POST /api/work-manager/tickets/{ticketId}/transition`
- `POST /api/work-manager/commands`
- `GET /api/services`
- `GET /api/services/{serviceId}/**`
- `POST /api/services/{serviceId}/**`
- `GET /api/tickets`
- `GET /api/tickets/{ticketId}`
- `POST /api/tickets`
- `POST /api/tickets/{ticketId}/claim`
- `POST /api/tickets/{ticketId}/complete`
- `POST /api/tickets/{ticketId}/fail`
- `POST /api/tickets/{ticketId}/waiting-llm`

## 로컬 포트

- 게이트웨이 기본 포트는 `8080` 이다.
- 프런트엔드는 로컬 개발 중 `/api` 트래픽을 이 포트로 프록시한다.
- `http://localhost:7000` 은 게이트웨이 단독 포트가 아니라 `v0.2.0` 통합 결과물 진입점이다.
- `GET /api/services/{serviceId}/**` 는 HTTP 기반 서브서비스의 하위 경로로 GET 요청을 전달한다.
- 예: `GET /api/services/elevator-service/api/state` 는 `elevator-service` 의 `/api/state` 로 전달된다.
- `POST /api/services/{serviceId}/**` 는 JSON 명령 요청을 HTTP 기반 서브서비스의 하위 경로로 전달한다.
- 예: `POST /api/services/elevator-service/api/step` 은 `elevator-service` 의 `/api/step` 으로 전달된다.

## 참고

- 현재 `v0.1.0` 스캐폴드는 첫 워커 루프 검토를 위해 최소한의 인메모리 티켓 저장소를 사용한다.
- `waiting-llm` 경로는 워커가 Ollama unavailable / degraded 상태를 감지했을 때 LLM 의존 티켓을 즉시 실패시키지 않고 다시 볼 수 있는 상태로 남기기 위한 최소 계약이다.
- `GET /api/runtime` 는 `ion2` / `rtx5070` 노드 타깃, offload 규칙, Ollama 상태 표현, 티켓 생성 예시를 한 번에 보여주는 런타임 descriptor 다.
- `GET /api/work-manager/board` 는 `docs/tickets/board.md` 와 해당 티켓 본문을 읽어 Work Manager 컬럼 보드, 티켓 상세 요약, activity feed seed 를 돌려주는 조회 API 다.
- `POST /api/work-manager/auth` 는 공유 비밀번호를 서버측 SHA-256 해시와 비교해 짧은 Work Manager 세션 토큰을 발급한다.
- `POST /api/work-manager/tickets/{ticketId}/transition` 는 보호된 Work Manager 티켓 이동을 처리하고, `backlog -> started`, `started -> need_review`, `need_review -> finished` 전이만 허용한다.
- `POST /api/work-manager/commands` 는 preset action + note 를 worker/orchestrator 경로용 플랫폼 티켓으로 브리지하고 최근 command history 를 남긴다.
- 컨테이너 빌드 경로는 `gateway/Dockerfile` 에 있다.
- Compose 로컬 실행에서는 샘플 서비스 주소로 `localhost` 대신 컨테이너 호스트명을 사용한다.

## Work Manager 보호 설정

- 조회 전용 Work Manager 보드와 activity feed 는 공개다.
- 티켓 이동과 preset command 실행은 `X-Work-Manager-Token` 이 있어야 한다.
- 기본 공유 비밀번호의 평문은 코드에 두지 않고, `WORK_MANAGER_PASSWORD_SHA256` 환경 변수 기본값으로 SHA-256 해시만 둔다.
- 세션 TTL 과 실패 잠금은 아래 환경 변수로 조절한다.
  - `WORK_MANAGER_SESSION_TTL_MINUTES`
  - `WORK_MANAGER_MAX_FAILED_ATTEMPTS`
  - `WORK_MANAGER_LOCK_MINUTES`

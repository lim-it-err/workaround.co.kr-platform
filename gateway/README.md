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
- `GET /api/services`
- `GET /api/services/{serviceId}/**`
- `POST /api/services/{serviceId}/**`
- `GET /api/tickets`
- `GET /api/tickets/{ticketId}`
- `POST /api/tickets`
- `POST /api/tickets/{ticketId}/claim`
- `POST /api/tickets/{ticketId}/complete`
- `POST /api/tickets/{ticketId}/fail`

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
- 컨테이너 빌드 경로는 `gateway/Dockerfile` 에 있다.
- Compose 로컬 실행에서는 샘플 서비스 주소로 `localhost` 대신 컨테이너 호스트명을 사용한다.

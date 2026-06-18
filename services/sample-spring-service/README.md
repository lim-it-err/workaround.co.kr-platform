# 샘플 Spring 서비스

독립 Docker 실행을 전제로 둔 Spring Boot 샘플 서비스다.

## 목적

- 서브서비스에서도 Java/Spring 을 사용할 수 있음을 보여준다.
- 게이트웨이는 라우팅과 티켓 조정에 집중하고, 서비스는 자체 기능을 독립적으로 유지한다는 기준을 보여준다.

## `v0.1.0` 계약

- `Dockerfile` 을 제공한다.
- `/health` 를 노출한다.
- 샘플 엔드포인트를 문서화한다.
- 게이트웨이 없이도 단독 실행 가능해야 한다.

## 로컬 런타임

- 기본 주소: `http://localhost:8002`
- 헬스 체크: `GET /health`
- 샘플 엔드포인트: `GET /api/ping`
- 에코 엔드포인트: `GET /api/echo?message=hello`

직접 포트 `8002` 는 로컬 테스트용이며, 사용자 관점의 통합 결과물은 `v0.2.0` 에서 `http://localhost:7000` 으로 정리한다.

## 환경 변수

- `SERVER_PORT`: HTTP 포트, 기본값 `8002`

# 샘플 Python 서비스

독립 Docker 실행을 전제로 둔 Python HTTP 샘플 서비스다.

## 목적

- 서비스가 Java/Spring 이외의 런타임도 사용할 수 있음을 보여준다.
- 게이트웨이와 분리된 로컬 테스트 경로를 제공한다.

## `v0.1.0` 계약

- `Dockerfile` 을 제공한다.
- `/health` 를 노출한다.
- 샘플 엔드포인트를 문서화한다.
- 게이트웨이 없이도 단독 실행 가능해야 한다.

## 로컬 런타임

- 기본 주소: `http://localhost:8001`
- 헬스 체크: `GET /health`
- 샘플 엔드포인트: `GET /api/ping`
- 에코 엔드포인트: `GET /api/echo?message=hello`

직접 포트 `8001` 은 로컬 테스트용이며, 사용자 관점의 통합 결과물은 `v0.2.0` 에서 `http://localhost:7000` 으로 정리한다.

## 환경 변수

- `PORT`: HTTP 포트, 기본값 `8001`
- `SERVICE_NAME`: 헬스 응답용 표시 이름, 기본값 `sample-python-service`

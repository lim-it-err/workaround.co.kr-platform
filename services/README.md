# 서비스

독립 서브서비스를 두는 디렉터리다. 각 서비스는 언어와 런타임을 자율적으로 선택할 수 있다.

## 필수 계약

모든 서비스는 아래 항목을 포함해야 한다.

- `README.md`
- `Dockerfile`
- `/health` 엔드포인트
- HTTP 엔드포인트 문서
- 환경 변수 문서

## 운영 원칙

- 서비스는 게이트웨이 없이도 개별 빌드와 실행이 가능해야 한다.
- 서비스 간 통신은 기본적으로 HTTP 를 사용한다.
- 서비스는 Ollama에 직접 의존하지 않고 워커 또는 게이트웨이 정책 경로를 사용한다.

## 현재 서비스 메모

- `elevator-service`: `v0.3.0` 시뮬레이터용 서비스 후보
- `sample-spring-service`: 플랫폼 계약 예시 서비스
- `sample-python-service`: 레거시/보조 예시 서비스
- `public-site`: `workaround.co.kr` 공개 소개 페이지용 정적 서비스

`public-site` 는 내부 통합 프리뷰용 `frontend/` 와 역할을 분리해 운영한다.

서비스를 추가하거나 변경하기 전에 `docs/service-policy.md` 를 먼저 읽는다.

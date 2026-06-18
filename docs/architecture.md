# 아키텍처

## 플랫폼 의도

이 저장소는 여러 개의 작은 서비스를 붙여가며 운영할 수 있는 개인용 서비스 플랫폼 모노레포다. 라우팅, 티켓, 워커 실행, LLM 가용성 정책이 한눈에 보이도록 유지하는 것이 목표다.

## 메인 흐름

```text
사용자 -> Vue 프런트엔드 -> Spring Gateway -> 각 서브서비스
Codex -> Spring Gateway Ticket API -> Redis Streams -> 워커
워커 -> 필요 시 외부 RTX5070 Ollama 호출
```

## 컴포넌트

### frontend

`frontend/` 는 Vue 기반 최종 사용자 UI다. 서비스 목록, 시스템 상태, 티켓 상태, 서비스 진입점을 보여준다.
`v0.4.0` 부터는 별도 admin 앱을 두지 않고 같은 포털 안에 `Work Manager` 운영 패널을 함께 둔다.

### design

`design/` 은 디자이너가 관리하는 UI/UX 기준선 문서 위치다. 현재 화면 진단, 시각 규칙, 사용자 질문, 오케스트레이터 review 로그를 이 폴더에서 관리한다.

- 오케스트레이터는 UI/UX 구현 티켓을 만들기 전에 관련 `design/` 문서를 먼저 읽는다.
- 진행 중인 협업은 `design/orchestrator_review/` 아래 append 문서로 남긴다.
- 합의가 끝난 review 문서는 `design/review_done/` 으로 이동한다.

### gateway

`gateway/` 는 Spring Boot 기반 게이트웨이다. 책임은 아래에 한정한다.

- 서브서비스로 향하는 API 라우팅
- 개발용 인증
- 티켓 생성 및 상태 API
- 서비스, Redis, 워커, Ollama 상태 집계
- `docs/tickets/board.md` 를 읽는 Work Manager 조회 API

게이트웨이는 기능별 비즈니스 로직의 본체가 되면 안 된다.

게이트웨이는 런타임 계약을 설명하는 얇은 descriptor 도 노출할 수 있다.

- `GET /api/health`: 현재 컴포넌트 헬스와 집계 상태
- `GET /api/runtime`: 노드 타깃, offload 규칙, Ollama degraded 정책, 티켓 생성 예시
- `GET /api/work-manager/board`: 티켓 보드, 티켓 본문 요약, activity feed seed 를 읽는 운영용 조회 경로

### services

`services/` 는 독립 서브서비스 모음이다. Python, Spring, Node, Go, Java 등 어떤 런타임이든 사용할 수 있다. 각 서비스는 자기 구현, `Dockerfile`, `README.md` 를 직접 가진다.

`v0.2.0` 프리뷰에서는 서비스 계약 후보를 정리하되, 엘리베이터 시뮬레이터 본 구현은 다음 minor 후보로 분리한다.
공개 도메인 소개 페이지도 필요하면 별도 서비스로 두고, 내부 프리뷰용 `frontend/` 와 섞지 않는다.

### workers

`workers/` 는 Redis Streams 티켓을 구독하고 실행하는 워커 모음이다. 티켓 유형에 따라 서브서비스나 외부 시스템을 호출할 수 있다.

현재 기준 책임 경계는 아래처럼 둔다.

| 주체 | 책임 |
| --- | --- |
| 오케스트레이터 | 티켓 생성, 문서/보드 관리, PR handoff 판단 |
| 게이트웨이 | 서비스 라우팅, 티켓 상태 API, 런타임 descriptor, 헬스 집계 |
| 워커 | 티켓 실행, 노드 타깃 판단, Ollama degraded 처리, `waiting_llm` 전이 |
| 외부 RTX5070 Ollama | 추론만 수행, 저장소 쓰기/병합 제어 없음 |

### llm

`llm/ollama/` 는 외부 RTX5070 Ollama 구성과 정책을 문서화한다. MVP에서는 기본 compose 스택 안에서 Ollama를 직접 띄우지 않고 외부 URL에 연결하는 방식을 기본으로 한다.

### infra

`infra/` 는 Docker Compose, Redis, Nginx, 배포 보조 설정 같은 로컬 인프라 구성을 담는다.
공개 도메인용 reverse proxy 와 배포 번들도 이 계층에서 관리한다.

## MVP 경계

첫 MVP는 아래 범위를 목표로 한다.

- Vue 프런트엔드 셸
- Spring Gateway
- Redis Streams
- 워커 1개
- 샘플 Spring 서비스
- Ollama 헬스 상태 노출

예시 서비스는 특정 언어를 강제하지 않는다. 다만 최종 실행 계약은 Docker 기반으로 유지한다.
엘리베이터 시뮬레이터는 `v0.2.0` 이후 다음 minor 후보인 `v0.3.0` 으로 둔다.

그 이후의 실제 기능성 서비스는 독립 서브서비스로 추가한다.

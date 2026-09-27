# 워커

워커는 정형 티켓을 구독하거나 조회해 작업을 실행한다.

## 기본 큐 기준

저장소 정책상 MVP 기본 큐는 Redis Streams 이다.

```text
stream: platform:tickets
consumer group: platform-workers
```

초기 스캐폴드 단계에서는 일부 워커가 게이트웨이 티켓 API를 폴링하며 같은 흐름을 검토할 수 있다.

## 필수 워크플로

모든 워커는 아래를 따라야 한다.

- 작업 전 관련 문서를 읽는다.
- 작업 전 관련 히스토리를 읽는다.
- 구현과 테스트를 마친 뒤 브랜치와 작업 보고서를 `need_review` 단계로 넘긴다.
- 완료한 작업을 날짜별 히스토리에 기록한다.

## 역할 경계

- 워커는 구현과 테스트, 핸드오프까지 담당한다.
- GitHub PR 생성과 최종 리뷰 흐름은 오케스트레이터가 담당한다.
- 워커가 만든 문서는 검토용 산출물이며 최종 정리는 오케스트레이터가 맡는다.

## 현재 구성

- `workers/ion2-worker/`: gateway polling 과 Redis Streams 런타임, mock enqueue, 가짜 Redis smoke 를 함께 지원하는 기본 실행 워커
- `workers/orchestrator-heartbeat/`: `need_review`, `started` 릴리스 게이트 막힘, `infra`/`v0.3.0` 이하 backlog 후보를 10분 주기로 요약 보고하는 로컬 heartbeat 스크립트
  - 기본 진입점: `powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/run-heartbeat.ps1`

워커 동작을 바꾸기 전에는 `docs/ticket-policy.md`, `docs/tickets/worker.md`, `docs/history/README.md`, 최신 관련 히스토리 파일을 먼저 읽는다.

문서 상태: 작성완료

# 착수 대기열 (Ready)

`docs/tickets/ready/` 는 오케스트레이터가 "지금 착수해도 된다" 고 승인한 티켓을 모으는 착수 대기열이다.

`backlog` 가 전 버전의 모든 티켓을 담는 창고라면, `ready` 는 그중 지금 개발 라인에서 바로 집어도 되는 것만 골라 둔 좁은 대기열이다. heartbeat 워커(예: Codex `codex-ready-worker-watch` automation)는 이 폴더에서만 티켓을 집는다.

## 승격 규칙 (backlog -> ready)

오케스트레이터는 아래를 모두 확인한 뒤에만 티켓을 `backlog` 에서 `ready` 로 옮긴다.

- `문서 상태: 작성완료`
- `진행 판정: 진행 가능` (또는 열린 버전 라인의 `vX.Y.Z 진행 시 가능`)
- `선행 조건` 이 모두 충족됨
- `대상 버전` 이 현재 개발 상한(`docs/roadmap.md`, `docs/version-policy.md`) 안에 있음
- 같은 파일을 동시에 건드리는 다른 `started`/`ready` 티켓과 충돌하지 않음

## 워커가 ready 에서 집는 규칙

- 한 번에 티켓 하나만 집는다. 우선순위 `P1` 을 먼저 집는다.
- 집는 즉시 티켓을 `started` 로 옮기고 `board.md` 와 히스토리를 갱신한다.
- 티켓의 `작업 내용`, `질문/결정 기록`, `선행 조건` 을 먼저 읽고 그 범위 안에서만 작업한다.
- 착수 절차와 handoff 규칙은 `docs/tickets/worker.md` 를 따른다.
- heartbeat 자동화 운영 규칙은 `docs/discord-claude-codex-bridge.md` 의 `codex-ready-worker-watch` 를 따른다.

## 검토 실패 시

오케스트레이터가 `need_review` 티켓을 반려하면 티켓은 `backlog` 로 돌아간다. 재작업 메모가 반영되고 승격 규칙을 다시 만족하면 오케스트레이터가 다시 `ready` 로 올린다.

## 현재 ready 티켓

- (비어 있음) 오케스트레이터가 승격하면 여기에 나열한다.

문서 상태: 작성완료

# 티켓 정책

## 목적

티켓은 Codex, Spring Gateway, Redis Streams, 워커 사이를 이어주는 조정 단위다.

Codex는 프로젝트 매니저처럼 명확한 정형 티켓을 만들고, 워커는 그 티켓을 받아 실행한다.

## 큐 백엔드

MVP 티켓 전달은 Redis Streams를 기본으로 한다.

기본 이름:

```text
stream: platform:tickets
consumer group: platform-workers
```

## 티켓 형태

정형 잡 티켓은 기본적으로 아래 정보를 포함한다.

```json
{
  "id": "ticket-id",
  "type": "job.type",
  "payload": {},
  "status": "queued",
  "priority": 5,
  "requestedBy": "codex",
  "createdAt": "2026-06-12T00:00:00Z",
  "updatedAt": "2026-06-12T00:00:00Z",
  "attempts": 0,
  "maxAttempts": 3,
  "result": null,
  "error": null
}
```

## 런타임 상태 값

MVP 런타임 상태는 아래 값을 지원한다.

- `queued`
- `running`
- `completed`
- `failed`
- `retrying`
- `waiting_llm`
- `cancelled`

## 저장소 티켓 수명주기

저장소 작업 티켓은 `docs/tickets/` 아래에서 아래 상태를 사용한다.

- `inbox` (외부 인입 초안, 수명주기 이전 단계)
- `backlog`
- `ready`
- `started`
- `need_review`
- `finished`

`inbox` 는 Discord/Claude 등 외부 도구가 만든 티켓 초안을 받는 이전 단계이며 worker는 여기서 직접 착수하지 않는다. 자세한 흐름은 `docs/discord-claude-codex-bridge.md` 와 `docs/tickets/inbox/README.md` 를 따른다.

`backlog` 는 전 버전의 모든 티켓을 담는 창고이고, `ready` 는 오케스트레이터가 착수 승인한 티켓만 모으는 착수 대기열이다. worker(heartbeat 포함)는 `ready` 에서만 티켓을 집는다. 자세한 승격/착수 규칙은 `docs/tickets/ready/README.md` 를 따른다.

`v0.4.0` Work Manager UI 의 `Backlog / Ready / Started / Need Review / Finished` 5레인은 이제 이 파일 폴더 5단계와 1:1로 대응한다. Work Manager UI 에서 사용자가 `Backlog -> Ready` 로 드래그해 승격을 제안하면 오케스트레이터가 파일 이동으로 확정한다.

## 문서 잠금 규칙

여러 작업자가 같은 문서를 동시에 쓰다 서로의 미완성 문서를 가져다 쓰지 않도록, `docs/` 와 `design/` 아래 문서는 아래 잠금 규칙을 따른다.

- 문서 수정을 시작할 때는 먼저 해당 문서에 `문서 상태: 수정중` 을 표시한다.
- 수정이 끝나고 다른 작업자가 읽어도 되는 상태가 되면 `문서 상태: 작성완료` 로 바꾼다.
- 티켓 문서는 `## 메타데이터` 안에 `- 문서 상태: ...` 필드를 둔다.
- 구조 문서, 히스토리 문서, 디자인 문서는 문서 상단에 `문서 상태: ...` 줄을 두거나 기존 메타데이터 위치에 같은 값을 둔다.
- `docs/`, `design/`, 루트 `README.md`, `AGENTS.md` 같은 운영 문서는 기본 저장 인코딩을 `UTF-8 with BOM` 으로 통일한다.
- PowerShell 로 문서를 읽고 쓸 때는 `Get-Content -Encoding UTF8`, `Set-Content -Encoding UTF8` 처럼 인코딩을 명시한다.
- Python, Node, PowerShell 스크립트가 문서를 다시 저장할 때는 시스템 기본 인코딩이나 ANSI 계열로 떨어지지 않게 명시적으로 UTF-8 을 사용한다.
- 운영 문서를 수정한 뒤에는 `powershell -NoProfile -ExecutionPolicy Bypass -File tools/check-docs-encoding.ps1` 로 BOM/UTF-8 기준을 다시 점검한다.
- `문서 상태: 수정중` 인 문서는 초안 또는 잠금 상태로 보고, 다른 작업자는 그 문서를 기준 문서나 착수 근거로 쓰지 않는다.
- worker, orchestrator, designer 는 다른 작업자가 `문서 상태: 수정중` 으로 잠가 둔 문서를 가져와 후속 작업의 기준 문서처럼 쓰지 않는다.

상태 규칙:

- 오케스트레이터는 티켓을 `backlog` 에 만든다. 미래 버전 티켓도 미리 만들어 둔다.
- 오케스트레이터는 착수 조건(`문서 상태: 작성완료`, `진행 판정: 진행 가능`, 선행 조건 충족, 개발 상한 범위)을 확인하고 티켓을 `backlog -> ready` 로 승격한다.
- 워커는 `ready` 에서 티켓을 집어 작업을 시작할 때 반드시 티켓을 `started` 로 옮긴다.
- 워커는 구현과 테스트를 마치면 티켓을 `need_review` 로 옮기고 브랜치, 테스트 결과, 작업 보고서를 남긴다.
- 오케스트레이터는 `need_review` 티켓을 검토하고 테스트한다.
- 검토가 통과되면 오케스트레이터가 티켓을 `finished` 로 옮긴다.
- 검토가 실패하면 오케스트레이터가 티켓을 `backlog` 로 되돌리고 재작업 메모를 남긴다. 재작업이 정리되면 다시 `ready` 로 승격한다.
- GitHub PR 생성은 오케스트레이터 책임이다.
- 최종 merge는 사용자만 수행한다.

오케스트레이터 자동화가 활성화되어 있으면 `need_review` 상태의 티켓을 주기적으로 확인하고, 진행 중 `started` 릴리스 게이트의 미완료 체크리스트도 함께 점검한 뒤 위 검토 흐름에 맞춰 PR 생성 또는 재작업 반환을 수행한다.

현재 저장소에는 `workers/orchestrator-heartbeat/heartbeat.py` 기준의 로컬 heartbeat 구현이 포함되어 있다. 기본 모드는 `need_review`, `started`, `board`, `roadmap`, 로컬 Git 상태, `java`/`mvn`/`docker` 도구 가용성, `blockingIssues` 요약, `nextCommands` 실행 힌트, 최신 히스토리를 읽고 JSON 리포트를 남기는 수준이다. 또한 `workers/orchestrator-heartbeat/manage-heartbeat-task.ps1` 로 Windows 작업 스케줄러 등록/해제/상태확인 진입점을 제공하지만, 실제 OS 스케줄러 등록이나 영구 서비스 설치는 사용자 승인 전 기본 포함하지 않는다.

Work Manager 운영 경로는 별도의 저장소 티켓 수명주기를 직접 건드릴 수 있으므로 조회와 실행성 액션을 분리한다.

- `GET /api/work-manager/board` 는 공개 조회 경로로 둘 수 있다.
- `POST /api/work-manager/auth` 는 공유 비밀번호를 server-side SHA-256 해시와 비교해 짧은 세션 토큰을 발급한다.
- `POST /api/work-manager/tickets/{ticketId}/transition` 의 목표 전이 매트릭스는 `backlog -> ready`, `ready -> started`, `started -> need_review`, `need_review -> finished` 순방향과 검토 반려용 `need_review -> backlog` 다. (게이트웨이 코드의 현재 전이 매트릭스를 이 정책에 맞추는 작업은 Work Manager 수정 티켓에서 닫는다.)
- `POST /api/work-manager/commands` 는 freeform 대신 preset action + note 조합만 받아 worker/orchestrator 브리지 티켓을 만든다.
- 실행성 Work Manager 액션은 `X-Work-Manager-Token` 이 있어야 하고, 조회 전용 보드와 activity feed 는 토큰 없이 볼 수 있다.

## Notes

티켓 간에 짧게 전달할 말이 있으면 각 티켓 하단에 `## Notes` 섹션을 둔다.

- Notes는 다음 작업자나 다음 티켓에게 전달할 짧은 메모다.
- 범위 변경 제안, 의존성, 릴리스 주의사항, 후속 티켓 연결을 적는다.
- 길게 설명하지 말고 다음 작업자가 바로 읽을 수 있게 짧게 쓴다.

## PR 준비 메모

오케스트레이터가 `need_review` 티켓을 검토할 때 PR 을 바로 만들 수 없거나 아직 draft 상태로만 둘 수 있다면 `## PR 준비 메모` 를 둔다.

- PR 제목 초안, PR 본문 초안, 검증 체크리스트를 적는다.
- 미검증 항목과 그 이유를 숨기지 않는다.
- 릴리스 포함 여부와 `VERSION` 승격 여부를 명확히 적는다.
- 버전이 붙는 PR 은 대상 버전(`v0.4.0`, `v0.5.0`, `infra`, `chore`)을 제목 또는 본문 첫머리에 반드시 드러낸다.
- 저장소 기본 PR 형식은 `.github/pull_request_template.md` 를 따르고, PR 제목은 `[v0.4.0]`, `[infra]`, `[chore]` 같은 prefix 를 기본값으로 쓴다.
- PR 본문은 template 의 `Target Version`, `Feature Theme`, one-version-one-feature 체크리스트를 유지한다.
- 로컬 검증은 `tools/check-pr-version-metadata.ps1`, CI 검증은 `.github/workflows/pr-version-guard.yml` 을 기준으로 본다.
- `v0.2.0` 배포 승인 전에는 릴리스 완료처럼 보이는 문구를 쓰지 않는다.
- 실제 PR 을 열었으면 PR 링크와 상태를 티켓, 보드, 히스토리에 남긴다.

## 작업 내용과 질문 기록

저장소 작업 티켓에는 `## 작업 내용` 을 두고 worker가 바로 수행할 구체 작업을 적는다.

- 작업 내용은 "무엇을 바꿀지" 와 "어디를 볼지" 를 포함한다.
- 구현 방식이 열려 있으면 가능한 선택지를 적고, 기본 선택을 하나 제안한다.
- worker가 질문 없이 시작할 수 있도록 이미 결정된 내용은 티켓에 남긴다.
- 아직 결정되지 않은 내용은 `## 질문/결정 기록` 에 열린 질문으로 남긴다.
- 오케스트레이터와 사용자는 worker에게 넘기기 전에 가능한 한 많은 질의응답을 이 섹션에 반영한다.
- 워커가 제한적인 모델로 독립 실행될 수 있으므로, 추론이 필요한 판단은 오케스트레이터가 가능한 한 티켓에 미리 적는다.

## 선행 조건

저장소 작업 티켓에는 필요하면 `## 선행 조건` 을 둔다.

- 선행 조건은 먼저 끝나야 하는 티켓, 릴리스, 결정, 외부 준비 상태를 적는다.
- 선행 조건이 없으면 `없음` 이라고 적는다.
- 선행 조건이 충족되지 않았으면 worker는 티켓을 시작하지 않는다.
- 선행 조건이 애매하면 worker는 Notes에 질문을 남기고 작업을 멈춘다.
- 오케스트레이터는 선행 조건이 풀렸을 때 티켓과 보드를 갱신한다.

## 의존성

저장소 작업 티켓에는 필요하면 `## 의존성` 을 둘 수 있다.

- `의존성` 은 Work Manager 메타데이터 편집 UI 같은 운영 화면에서 직접 읽고 수정하는 자유 텍스트 필드다.
- 보통 티켓 ID 목록, 선행 작업 묶음, 짧은 연결 메모를 적는다.
- 아직 `의존성` 섹션이 없는 기존 티켓은 UI 에서 `선행 조건` 값을 fallback 으로 보여줄 수 있다.
- `의존성` 이 생겨도 worker 시작 게이트는 여전히 `선행 조건` 과 `진행 판정` 을 우선 해석한다.

## 진행 판정

저장소 작업 티켓에는 메타데이터에 `진행 판정` 을 둔다. 이 값은 worker가 “지금 이 티켓을 집어도 되는가”를 추론하지 않도록 오케스트레이터가 명시하는 시작 게이트다.

- `진행 가능`: worker가 선행 조건을 확인한 뒤 시작할 수 있다.
- `진행 불가`: worker가 시작하지 않는다. 해제 조건은 `선행 조건`, `질문/결정 기록`, `Notes` 에 적는다.
- `vX.Y.Z 진행 시 가능`: 해당 버전 작업 라인이 열렸을 때만 시작할 수 있다. 예를 들어 `v0.2.2 진행 시 가능` 은 `v0.2.2` 안정화 라인을 오케스트레이터가 열기 전에는 시작하지 않는다.

판정 규칙:

- `진행 판정` 은 `대상 버전` 을 대체하지 않는다. `대상 버전` 은 릴리스 귀속이고, `진행 판정` 은 시작 가능 여부다.
- `진행 판정`, `대상 버전`, `선행 조건` 이 충돌하면 더 보수적인 조건을 따른다.
- `infra` 와 `chore` 는 버전 상한과 무관하게 `진행 가능` 으로 둘 수 있지만, 외부 서버 접근, 인증, 배포 승인 같은 선행 조건은 계속 지킨다.
- `need_review` 티켓의 `진행 판정` 은 worker 신규 착수 허용이 아니라 오케스트레이터 검토 가능 여부로 읽는다.

추가 착수 규칙:

- worker 는 티켓을 집기 전에 `문서 상태` 가 `작성완료` 인지 먼저 확인한다.
- `문서 상태` 가 `수정중` 이거나 비어 있으면, 티켓 내용이 아직 잠겨 있거나 덜 정리된 것으로 보고 시작하지 않는다.
- 오케스트레이터는 티켓을 worker 가 집기 전에 `문서 상태: 작성완료` 까지 올려 둔다.
- 이미 다른 작업자가 같은 티켓을 `수정중` 으로 잡고 있으면, 현재 작업자는 그 티켓을 그대로 가져와 이어서 시작하지 않는다.

## 워커 동작 규칙

- 워커는 Redis Streams consumer group을 통해 티켓을 구독한다.
- 현재 `workers/ion2-worker/` 는 `redis-streams` 모드와 기존 `gateway-polling` 스캐폴드 모드를 함께 지원한다. 기본 큐 기준은 여전히 Redis Streams 이며, polling 모드는 게이트웨이 인메모리 티켓 저장소를 검토하기 위한 과도기 경로로 둔다.
- 워커는 상태를 안전하게 갱신하거나 작업을 성공적으로 끝낸 뒤에만 ack 한다.
- 실패한 티켓은 `attempts` 를 증가시킨다.
- `maxAttempts` 이하이면 `retrying` 으로 보낼 수 있다.
- `maxAttempts` 를 넘기면 `failed` 로 보낸다.
- Ollama가 unavailable일 때 LLM 작업은 바로 실패시키지 말고 `waiting_llm` 로 둘 수 있어야 한다.
- `waiting_llm` 티켓은 `result.retryNotBefore` 시각이 지나기 전까지 다시 집지 않는다.
- 현재 worker 의 LLM 작업 판별 신호는 `type=job.llm.*`, `payload.requiresLlm=true`, `payload.inferenceProvider=ollama`, `payload.targetRuntime=ollama` 다.
- 워커는 의미 있는 작업 전 관련 문서와 히스토리를 반드시 읽어야 한다.
- 워커는 작업이 끝난 뒤 히스토리를 반드시 기록해야 한다.
- 워커는 `문서 상태: 수정중` 인 티켓이나 문서를 읽더라도 그것을 최종 착수 기준으로 사용하지 않는다.

## 게이트웨이 API 계약

MVP 게이트웨이는 최소한 아래 엔드포인트를 포함한다.

```text
POST /api/tickets
GET /api/tickets
GET /api/tickets/{ticketId}
```

개발 단계의 변경성 티켓 API는 `X-Platform-Key` 를 요구한다.

문서 상태: 작성완료

# 오케스트레이터 역할

## 목적

오케스트레이터는 작업을 조정한다. 오케스트레이터의 핵심 책임은 코드 구현 자체보다 티켓 품질, 문서 품질, 검토 흐름, 검증 흐름을 관리하는 것이다.

Codex가 잠시 인프라 구현 작업을 직접 하더라도, 해당 작업이 끝나면 다시 오케스트레이터 역할로 돌아온다.

UI/UX 작업에서는 디자이너 역할과 명확히 분리해 움직인다. 오케스트레이터는 개발 티켓과 구현 흐름을 관리하고, 디자이너는 `design/` 아래 문서에서 화면 문제 진단과 개선 기준을 만든다.
기능 페이지 범위에서는 `docs/feature-definition.md` 를 제품 기능 기준선으로 함께 관리한다.

## 책임

- 작업 전 문서와 히스토리를 읽는다.
- 운영 문서(`docs/`, `design/`, `README.md`, `AGENTS.md`)의 저장 인코딩을 `UTF-8 with BOM` 으로 유지한다.
- PowerShell, Python, Node 로 문서를 읽고 쓸 때는 인코딩을 명시하고, 기본 ANSI 인코딩에 기대지 않는다.
- UI/UX 구현 티켓을 만들기 전 `design/README.md`, 관련 디자인 규칙 문서, 최신 `design/orchestrator_review/*` 를 읽는다.
- 기능 페이지 티켓을 만들거나 검토할 때 `docs/feature-definition.md` 를 먼저 읽고, 티켓의 `작업 내용`, `질문/결정 기록`, `완료 기준` 에 그 경계를 반영한다.
- 티켓을 만들고, 다듬고, 우선순위와 버전을 관리한다.
- `backlog` 에는 미래 버전을 포함한 모든 티켓을 미리 만들어 둔다.
- 착수 조건(`문서 상태: 작성완료`, `진행 판정: 진행 가능`, 선행 조건 충족, 개발 상한 범위)이 맞는 티켓을 `backlog` 에서 `ready` 로 승격해 worker(heartbeat 포함)가 집을 수 있게 한다.
- 티켓과 운영 문서를 수정하기 시작할 때 먼저 `문서 상태: 수정중` 으로 잠그고, handoff 가능한 시점에 `문서 상태: 작성완료` 로 바꾼다.
- worker 에게 넘길 티켓은 `문서 상태: 작성완료` 로 마감되기 전까지 착수 가능한 티켓처럼 취급하지 않는다.
- 티켓마다 worker가 바로 수행할 `작업 내용` 을 구체화한다.
- 티켓마다 worker가 시작해도 되는지 `진행 판정` 을 명시한다.
- 티켓마다 필요한 `선행 조건` 을 명시한다.
- 무리인 것, 현재 바로 할 수 없는 것, 다시 검토가 필요한 것, 사용자 결정이 필요한 것은 즉시 사용자에게 알리고 티켓/문서에 남긴다.
- 사용자와의 질의응답을 `질문/결정 기록` 으로 남겨 worker의 추가 질문을 줄인다.
- 워커가 제한적인 모델일 수 있다는 전제를 두고, 추론이 필요한 부분을 티켓에 미리 풀어 쓴다.
- `docs/tickets/board.md` 를 티켓 상태와 맞춘다.
- 구조, 프로세스, 역할 문서를 최신 상태로 유지한다.
- `docs/tickets/started/` 를 보고 워커가 착수했는지 확인한다.
- `docs/tickets/need_review/` 를 보고 워커 handoff가 끝났는지 확인한다.
- 워커 결과가 애매하거나 문서와 코드가 어긋나면 `need_review` 티켓에서 멈추고 질문/결정 기록으로 남긴다.
- 관련 브랜치 상태를 확인한다.
- 워커 결과를 검토하고 테스트 근거를 본다.
- 문서가 어수선하면 최종 구조를 정리한다.
- 디자이너가 남긴 UI/UX 기준을 구현 티켓의 `작업 내용`, `질문/결정 기록`, `완료 기준` 에 반영한다.
- 기능 정의서와 어긋나는 더미/시안/코드가 보이면, 먼저 `docs/feature-definition.md` 기준으로 어긋난 지점을 기록하고 acceptance 를 다시 맞춘다.
- 다른 작업자가 `수정중` 으로 잠가 둔 티켓이나 디자인 문서는 가져와 임의로 이어 쓰지 않고, 필요하면 review 문서나 Notes 로 충돌 상황을 남긴다.
- 검토 통과 시 티켓을 `finished` 로 옮긴다.
- 검토 통과 후 PR을 생성하거나 갱신한다.
- 검토 실패 시 티켓을 `backlog` 로 돌리고 재작업 메모를 남긴다.
- 오케스트레이터 작업도 히스토리에 기록한다.

## 비책임 범위

- 주된 역할로 애플리케이션 코드를 구현하지 않는다.
- 사용자를 대신해 최종 merge 하지 않는다.
- 문서와 히스토리 갱신을 건너뛰지 않는다.
- 디자이너 합의 없이 UI/UX 방향을 임의로 뒤집지 않는다.

## 디자이너 협업 규칙

- 진행 중인 디자인 논의는 `design/orchestrator_review/` 아래 append 형식 문서로만 누적한다.
- review 문서에는 날짜, 작성자(`designer` 또는 `orchestrator`), 요약, 요청 사항, 결정 여부를 남긴다.
- 검토가 끝난 문서는 `design/review_done/` 으로 이동하고, 최종 결정은 관련 티켓/문서에도 다시 반영한다.
- 오케스트레이터는 디자인 문서를 구현 요구사항으로 번역할 때, 시각 목표와 개발 제약을 함께 적어 worker 가 추론하지 않도록 돕는다.

## 리뷰 흐름

1. 티켓과 워커 보고서를 읽는다.
2. `started` 흐름을 거쳤는지 확인한다.
3. `need_review` handoff가 완료되었는지 확인한다.
4. 브랜치명과 변경 범위를 확인한다.
5. 테스트 또는 테스트 근거를 검토한다.
6. API 동작, 문서, acceptance criteria를 확인한다.
7. 필요하면 문서를 정리한다.
8. 리뷰 메모를 남긴다.
9. 통과 시 `finished` 로 옮긴다.
10. 통과한 브랜치에 대해 PR을 생성하거나 갱신한다.

## PR 준비 기준

`need_review` 티켓은 아직 PR 을 만들 수 없는 상태여도, 오케스트레이터가 PR 로 옮길 수 있는 정보를 최대한 미리 정리한다.

- PR 제목은 티켓 ID, 대상 버전 또는 트랙, 핵심 변경을 포함한다.
- PR 본문 초안에는 요약, 변경 범위, 검증 결과, 미검증 항목, 릴리스 포함 여부를 적는다.
- 저장소 기본 템플릿은 `.github/pull_request_template.md` 이며, PR 제목은 `[v0.4.0]`, `[infra]`, `[chore]` 같은 대상 버전 prefix 로 시작한다.
- PR 본문은 `Target Version`, `Feature Theme`, one-version-one-feature 체크리스트를 채운 상태를 기본으로 본다.
- 오케스트레이터는 PR 초안을 만들기 전에 `tools/check-pr-version-metadata.ps1` 기준을 먼저 통과시키고, 원격에서는 `.github/workflows/pr-version-guard.yml` 이 같은 규칙을 다시 확인한다.
- 검증이 부족하면 PR 을 ready 로 열지 않고 draft 후보로 둔다.
- 로컬 `git` 이 없거나 브랜치 push 가 불가능하면, 티켓의 `PR 준비 메모` 에 제목과 본문 초안을 남긴다.
- Java/Maven, 브라우저, Docker 처럼 환경 문제로 빠진 검증은 숨기지 않고 체크박스에 남긴다.
- `v0.2.0` 배포 승인 전에는 `VERSION` 승격, 릴리스 태그, GitHub Release 생성을 PR 본문에 완료 항목으로 쓰지 않는다.
- PR 을 실제로 열었거나 갱신했으면 `docs/tickets/board.md`, 해당 티켓, `docs/history/YYYY-MM-DD.md` 에 링크와 상태를 남긴다.

## 자동화 감시

오케스트레이터는 자동화를 통해 `docs/tickets/need_review/` 와 `docs/tickets/started/` 를 주기적으로 확인할 수 있다.

현재 저장소에는 `workers/orchestrator-heartbeat/heartbeat.py` 기준의 로컬 실행 가능한 감시 구현이 있다. 기본 명령은 아래와 같다.

```powershell
python workers/orchestrator-heartbeat/heartbeat.py
```

이 구현은 `docs/tickets/need_review/`, `docs/tickets/started/`, `docs/tickets/board.md`, `docs/roadmap.md`, 로컬 Git 상태, `java`/`mvn`/`docker` 도구 가용성, `blockingIssues` 요약, `nextCommands` 실행 힌트, 최신 히스토리를 읽고 JSON 리포트를 남긴다. `started` 티켓 안의 `- [ ]` 체크리스트는 릴리스 게이트 막힘으로 따로 요약한다. 기본 루프 외에 `workers/orchestrator-heartbeat/manage-heartbeat-task.ps1` 로 Windows 작업 스케줄러 등록/해제/상태확인 진입점도 제공한다. 다만 실제 OS 스케줄러 등록, 영구 서비스 설치, 자동 PR 생성은 사용자 승인 전에는 수행하지 않는다.

- 현재 상태 정리:
  - 저장소 안의 10분 루프 스크립트는 구현되어 있다.
  - Windows 작업 스케줄러 등록용 PowerShell 진입점은 구현되어 있다.
  - 실제로 등록된 작업 스케줄러, 서비스, 부팅 시 자동 시작은 사용자 승인 전에는 기본 포함하지 않는다.
  - GitHub Actions 의 schedule 만으로는 로컬 작업 트리와 로컬 도구 상태를 그대로 볼 수 없으므로 완전한 대체가 아니다.

- `need_review` 티켓이 있으면 티켓, 워커 보고서, 브랜치, 테스트 근거, 문서 갱신 여부를 검토한다.
- `started` 티켓에 미완료 체크리스트가 있으면 `need_review` 유무와 별개로 릴리스 게이트 막힘으로 먼저 본다.
- 검토가 통과되면 티켓을 `finished` 로 옮기고 `docs/tickets/board.md` 와 히스토리를 갱신한 뒤 PR을 생성하거나 갱신한다.
- 검토가 실패하면 티켓을 `backlog` 로 되돌리고 재작업 Notes와 검토 메모를 남긴다.
- `need_review` 티켓이 없으면 불필요한 파일 변경 없이 현재 상태만 정리한다.
- 최종 merge는 계속 사용자가 담당한다.

## 필수 티켓 필드

오케스트레이터가 관리하는 티켓은 아래 필드를 갖는 것을 기본으로 한다.

- ticket id
- title
- priority
- target version
- current state
- document status
- progress decision
- owner type
- work items
- scope
- acceptance criteria
- dependencies / prerequisites
- question / decision log
- branch naming rule
- worker report requirement
- review notes
- notes

## 티켓 작성 가드레일

워커에게 넘기는 티켓은 실행 지시서처럼 작성한다.

- 작업 파일이나 디렉터리를 가능한 한 구체적으로 적는다.
- 순서가 중요한 작업은 번호를 붙여 적는다.
- 시작 전에 끝나야 하는 티켓이나 결정이 있으면 `선행 조건` 에 적는다.
- worker가 판단하지 않도록 `진행 판정` 을 `진행 가능`, `진행 불가`, `vX.Y.Z 진행 시 가능` 중 하나로 적는다.
- 열려 있는 선택지는 기본 선택을 함께 적는다.
- 금지할 행동이 있으면 명시한다.
- 삭제, 배포, 릴리스, 외부 시스템 변경은 사용자 승인 조건을 적는다.
- 질문이 남아 있으면 `질문/결정 기록` 에 열린 질문으로 남긴다.

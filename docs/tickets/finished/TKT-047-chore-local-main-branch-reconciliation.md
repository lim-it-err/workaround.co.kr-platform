문서 상태: 작성완료

# TKT-047

## 메타데이터

- 제목: 로컬 `main` 브랜치 뒤처짐과 dirty worktree 정렬
- 우선순위: P1
- 대상 버전: `chore`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-047-local-main-reconcile`

## 목표

현재 로컬 `main` 이 `origin/main` 대비 크게 뒤처져 있고 작업 트리도 다수 변경이 섞여 있는 상태를 다시 진단해, 어떤 변경이 실제 작업물이고 어떤 변경이 임시/혼선 상태인지 분리한다. 이후 PR 재구성과 릴리스 판단이 가능한 기준선을 만든다.

## 작업 내용

- 로컬 Git 실행 경로를 다시 확인한다. `git` 이 PATH 에 없으면 `C:\Program Files\Git\cmd\git.exe` 같은 전체 경로 기준으로 진단한다.
- 현재 브랜치, 추적 브랜치, `ahead/behind`, dirty 파일 목록을 다시 기록한다.
- worktree 안의 변경을 아래 범주로 분리한다.
  - 실제 보존해야 하는 코드 변경
  - 문서/티켓 변경
  - 임시 빌드 산출물 또는 정리 가능한 노이즈
- 사용자가 닫을 예정인 기존 PR `#2` 와 연결된 브랜치/커밋 기준도 함께 다시 적는다.
- 필요하면 새 임시 worktree 또는 code-only 정리 경로를 제안해, 이후 버전별 PR 을 다시 나눌 수 있게 한다.
- 결과를 `docs/history/` 와 필요 시 관련 티켓의 `검토 메모`, `PR 준비 메모` 에 반영한다.

## 범위

- 포함: 로컬 Git 상태 재진단, 브랜치 뒤처짐 원인 기록, dirty 범위 분류, 안전한 정렬 경로 제안
- 제외: 임의 삭제, 강제 reset, 사용자 승인 없는 rebase/force push, 실제 GitHub merge

## 완료 기준

- 현재 로컬 `main` 의 `ahead/behind` 와 dirty 상태가 다시 기록되어 있다.
- 어떤 변경을 유지해야 하는지와 어떤 변경이 정리 대상인지 구분 메모가 남아 있다.
- 기존 PR 종료 이후 어떤 방식으로 새 PR 들을 만들지 안전 경로가 정리되어 있다.
- 사용자 승인 없이 destructive Git 명령을 쓰지 않았음이 기록되어 있다.

## 선행 조건

- 없음

## 질문/결정 기록

- 결정: 로컬 `main...origin/main [behind 30]` 상태는 정상 기준선으로 보기 어렵다.
- 결정: 기존 변경을 함부로 되돌리지 않고, 먼저 분류와 안전 경로 제안부터 한다.
- 열린 질문: 로컬 `main` 을 정리한 뒤 버전별 PR 을 몇 개 레일로 다시 나눌지 사용자의 최종 선택이 필요할 수 있다.

## 선행 읽기

- `README.md`
- `docs/ticket-policy.md`
- `docs/tickets/board.md`
- `docs/history/2026-06-14.md`
- `docs/history/2026-06-15.md`
- `docs/tickets/started/TKT-018-v0.2.0-release-candidate-gate.md`

## 작업자 산출물

- 재확인한 Git 상태 요약
- dirty 변경 분류 표
- 안전한 정렬/PR 재구성 경로 요약
- 검증 결과

## 검토 메모

- 2026-06-15 worker 재확인 기준 Git 실행 경로는 `C:\Program Files\Git\cmd\git.exe` 다.
- 현재 로컬 기준선은 `main...origin/main [behind 30]` 이며, 임시 PR 브랜치 `codex/tkt-011-tkt-020-elevator-preview` 와 비교하면 `main...codex/tkt-011-tkt-020-elevator-preview [behind 32]` 상태다.
- `tools/summarize-git-worktree.ps1` 를 추가해 현재 dirty worktree 를 아래처럼 범주화할 수 있게 했다.
  - tracked changes: `33`
  - deleted tracked: `7`
  - untracked remote gap: `11`
  - untracked new: `135`
  - generated noise: `16`
- 가장 중요한 판정은 “로컬에서 `??` 로 보이는 파일 중 일부가 실제로는 `origin/main` 에 이미 존재한다” 는 점이다. 즉 지금 worktree 는 단순 잡파일 상태가 아니라, 오래된 로컬 `main` 과 새 로컬 작업물이 겹쳐 보이는 상태다.
- `origin/main` 에 이미 존재하는 untracked sample:
  - `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java`
  - `services/sample-python-service/Dockerfile`
  - `services/sample-spring-service/pom.xml`
  - `workers/ion2-worker/Dockerfile`
- 생성 노이즈 sample:
  - `services/elevator-service/__pycache__/app.cpython-312.pyc`
  - `services/public-site/__pycache__/app.cpython-312.pyc`
  - `tmp/homepage.gif`
  - `tmp/homepage-pc.png`
- 따라서 현재 단계의 권장 경로는 아래와 같다.
  1. 현재 dirty tree 에서 바로 reset/rebase 하지 말고 보존용 브랜치 또는 snapshot worktree 를 먼저 만든다.
  2. 이후 PR/릴리스 작업은 현재 `main` 대신 `origin/main` 또는 `codex/tkt-011-tkt-020-elevator-preview` 를 기준으로 새 clean worktree 에서 재구성한다.
  3. `tmp/`, `__pycache__/`, `.pyc`, 캡처 GIF/PNG 는 정리 후보지만, snapshot 없이 먼저 삭제하지 않는다.
  4. “로컬 untracked = junk” 으로 가정하지 말고, 먼저 `origin/main` 추적 여부를 확인한다.

## 권장 검증 명령

```powershell
& 'C:\Program Files\Git\cmd\git.exe' status --short --branch
& 'C:\Program Files\Git\cmd\git.exe' branch -vv
& 'C:\Program Files\Git\cmd\git.exe' rev-list --left-right --count main...origin/main
powershell -ExecutionPolicy Bypass -File .\tools\summarize-git-worktree.ps1
```

## Notes

- 이 티켓은 "당장 깨끗하게 만들기"보다 "무엇이 왜 섞였는지 분해하고 안전한 복구/재구성 경로를 만드는 것"이 우선이다.
- 사용자 승인 없이 `git reset --hard`, 강제 rebase, force push, 대량 삭제는 수행하지 않았다.
- 오케스트레이터 판정: 이 티켓의 범위는 정리 실행이 아니라 상태 분해와 안전 경로 제안이며, 현재 Git 기준선과 권장 복구 절차가 충분히 남아 있으므로 완료 기준을 충족한 것으로 본다.


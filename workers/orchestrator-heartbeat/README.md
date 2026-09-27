# 오케스트레이터 heartbeat

`docs/tickets/need_review/`, `docs/tickets/started/`, `docs/tickets/board.md`, `docs/roadmap.md`, 최신 히스토리를 읽어 오케스트레이터 검토 대상과 진행 중 릴리스 게이트 막힘을 주기적으로 보고하는 로컬 heartbeat 스크립트다.

## 목적

- `need_review` 티켓 존재 여부를 10분 주기로 확인한다.
- `started` 상태의 `infra` 및 `v0.3.0` 이하 티켓에서 미완료 체크리스트를 찾아 릴리스 게이트 막힘을 드러낸다.
- `infra` 및 `v0.3.0` 이하 backlog 후보를 함께 요약한다.
- 문서 파일을 자동 수정하지 않고 JSON 리포트만 stdout 또는 선택 로그 파일로 남긴다.

## 실행

한 번만 확인:

```powershell
powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/run-heartbeat.ps1 -Once
```

10분 주기 기본 루프:

```powershell
powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/run-heartbeat.ps1
```

짧은 간격 테스트와 로그 파일:

```powershell
powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/run-heartbeat.ps1 -IntervalSeconds 60 -LogPath tmp/orchestrator-heartbeat.ndjson
```

직접 Python 실행:

```powershell
python workers/orchestrator-heartbeat/heartbeat.py --once
```

스케줄러 등록 상태 확인:

```powershell
powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/manage-heartbeat-task.ps1 -Action status
```

10분 작업 스케줄러 등록:

```powershell
powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/manage-heartbeat-task.ps1 -Action register
```

작업 스케줄러 해제:

```powershell
powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/manage-heartbeat-task.ps1 -Action unregister
```

## 출력 계약

- `timestamp`
- `board`
- `roadmap`
- `gitStatus`
- `toolchainStatus`
- `latestHistory`
- `needReviewTickets`
- `activeBacklogUpToV030`
- `startedTickets`
- `startedGateBlockers`
- `blockingIssues`
- `nextCommands`
- `reviewReady`
- `nextAction`

## 운영 메모

- `run-heartbeat.ps1` 는 Codex 번들 Python, LibreOffice Python, PATH 의 `python` 순서로 실행 파일을 찾아 heartbeat 를 시작한다.
- `manage-heartbeat-task.ps1` 는 Windows `schtasks.exe` 기준으로 10분마다 `run-heartbeat.ps1 -Once` 를 다시 호출하는 등록/해제/상태확인 진입점이다.
- 등록 시 Windows Task Scheduler 의 `/TR` 길이 제한을 피하기 위해, 짧은 launcher 파일 `workers/orchestrator-heartbeat/task-run-heartbeat.cmd` 를 자동 생성하고 스케줄러는 이 파일을 호출한다.
- 작업 스케줄러는 긴 무한 루프를 백그라운드로 묶는 대신, 10분마다 단발 heartbeat 를 실행하는 구조를 기본으로 둔다.
- 기본 로그 파일은 `tmp/orchestrator-heartbeat.ndjson` 이며, 등록 명령에서 `-LogPath` 로 바꿀 수 있다.
- 기본 구현은 저장소 안에서 직접 실행하는 루프다.
- `startedGateBlockers` 는 `started` 티켓 본문에 남아 있는 `- [ ]` 체크리스트를 그대로 요약한 결과다.
- `gitStatus` 는 로컬 저장소의 현재 브랜치, 추적 브랜치, ahead/behind, dirty 여부, 변경 수 요약을 함께 보여 준다.
- `toolchainStatus` 는 `java`, `mvn`, `docker` 실행 파일 가용성과 버전/오류를 함께 보여 준다.
- `blockingIssues` 는 `startedGateBlockers`, `toolchainStatus`, `gitStatus` 를 바탕으로 바로 읽을 수 있는 막힘 요약 배열이다.
- `nextCommands` 는 현재 막힘을 다시 확인하거나 다음 검증으로 이어갈 때 바로 복사해 쓸 수 있는 PowerShell 명령 목록이다.
- `nextAction` 은 `started` 릴리스 게이트 막힘이 있으면 그것을 우선 보고하고, 없을 때 `need_review` 또는 backlog 후보를 안내한다.
- `nextAction` 은 `gateway` compile / Docker build blocker 를 만났을 때 로컬 도구 부재 여부도 함께 덧붙인다.
- OS 스케줄러 등록, 영구 서비스 설치, 부팅 시 자동 시작은 기본 포함하지 않는다.
- 영구 등록이 필요하면 사용자 승인 뒤 `manage-heartbeat-task.ps1 -Action register` 로 연결한다.
- GitHub Actions schedule 은 원격 저장소 상태만 볼 수 있으므로, 로컬 dirty worktree, 로컬 설치 도구, 로컬 docs 변경을 읽는 heartbeat 의 완전한 대체가 아니다.
- 중지는 heartbeat 를 띄운 같은 콘솔에서 `Ctrl+C` 로 수행한다.

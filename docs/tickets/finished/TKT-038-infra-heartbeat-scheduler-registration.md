# TKT-038

## 메타데이터

- 제목: 오케스트레이터 heartbeat 작업 스케줄러 등록
- 우선순위: P1
- 대상 버전: `infra`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-038-heartbeat-scheduler-registration`

## 목표

`TKT-027` 이 만든 heartbeat 스크립트를 실제 10분 주기 등록 자동화로 연결할 수 있게 정리한다. GitHub Actions schedule 이 로컬 작업 트리와 로컬 도구 상태를 그대로 대체하지 못한다는 점도 함께 명확히 남긴다.

## 작업 내용

- 현재 heartbeat 스크립트의 실행 위치와 운영 대상을 정리한다.
  - 로컬 개발 PC
  - 항상 켜져 있는 Windows 서버/호스트
  - 그 외 장기 실행 가능한 머신
- Windows Task Scheduler 기준 등록/해제/상태확인 PowerShell 진입점을 추가한다.
- 등록은 10분마다 단발 heartbeat(`run-heartbeat.ps1 -Once`) 를 다시 호출하는 방식으로 설계한다.
- 등록 여부를 확인하는 절차와 기본 로그 경로를 문서화한다.
- GitHub Actions schedule 이 왜 완전한 대체가 아닌지 문서에 명시한다.
- 실제 등록을 수행했으면 어느 머신에 어떤 이름으로 등록했는지 히스토리에 남기고, 수행하지 못했으면 미등록 이유를 남긴다.

## 범위

- 포함: 작업 스케줄러 등록 절차, 등록/해제/상태확인 스크립트, 운영 문서, 미등록 상태 기록
- 제외: 자동 PR 생성, 자동 문서 수정, GitHub cloud schedule 만으로 로컬 heartbeat 를 대체하는 설계

## 완료 기준

- heartbeat 를 실제 10분 주기 작업 스케줄러로 연결할 수 있는 등록 절차가 있다.
- 등록 여부를 확인하는 방법이 문서화되어 있다.
- GitHub Actions schedule 의 한계와 로컬 스케줄러의 필요성이 문서에 적혀 있다.
- 등록이 아직 안 되었으면 "미등록" 상태와 이유가 명확히 남아 있다.

## 선행 조건

- `TKT-027` 로컬 heartbeat 스크립트가 있어야 한다.
- 사용자 승인 없이 임의의 OS 스케줄러 등록을 강행하지 않는다.

## 질문/결정 기록

- 결정: 저장소에는 로컬 heartbeat 스크립트가 이미 있고, 이번 티켓은 그 위에 작업 스케줄러 진입점을 얹는 인프라 정리다.
- 결정: 작업 스케줄러는 무한 루프 프로세스를 등록하는 대신 10분마다 `run-heartbeat.ps1 -Once` 를 호출한다.
- 결정: 기본 작업 이름은 `workaround-platform-orchestrator-heartbeat` 로 둔다.
- 결정: 기본 로그 파일은 `tmp/orchestrator-heartbeat.ndjson` 로 둔다.
- 결정: GitHub Actions schedule 만으로는 로컬 dirty worktree, 로컬 설치 도구, 로컬 docs 변경을 그대로 볼 수 없으므로 완전한 대체가 아니다.
- 열린 질문: 실제 등록 대상 머신을 개발 PC 로 볼지, 장기 실행 호스트로 볼지는 사용자 승인 시점에 다시 맞춘다.

## 선행 읽기

- `docs/tickets/finished/TKT-027-infra-orchestrator-heartbeat-automation.md`
- `workers/orchestrator-heartbeat/README.md`
- `docs/tickets/orchestrator.md`
- `docs/history/2026-06-14-infra.md`

## 작업자 산출물

- 등록/해제 스크립트 또는 절차
- 등록 상태 확인 방법
- 실제 등록 여부
- 남은 승인 또는 환경 제약

## 검토 메모

- `workers/orchestrator-heartbeat/manage-heartbeat-task.ps1` 를 추가해 `register`, `unregister`, `status` 액션을 제공했다.
- 등록 명령은 Windows `schtasks.exe` 기준으로 10분마다 `run-heartbeat.ps1 -Once` 를 다시 실행하도록 구성한다.
- 상태조회 실패 시에도 "미등록" 과 "권한 차단" 을 구분해 반환하도록 정리했다.
- `workers/orchestrator-heartbeat/README.md`, `docs/tickets/orchestrator.md`, `docs/ticket-policy.md` 를 함께 갱신해 등록 절차와 GitHub Actions schedule 의 한계를 같은 기준으로 맞췄다.
- 현재 검증 결과:
  - `powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/manage-heartbeat-task.ps1 -Action register`
  - `powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/manage-heartbeat-task.ps1 -Action status`
  - `schtasks /Run /TN workaround-platform-orchestrator-heartbeat`
  - `schtasks /Query /TN workaround-platform-orchestrator-heartbeat /FO LIST /V`
  - `powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/run-heartbeat.ps1 -Once -LogPath tmp/orchestrator-heartbeat.ndjson`
  - 첫 등록 시도는 Windows Task Scheduler `/TR` 길이 제한 261자에 걸려 실패했고, 이후 `task-run-heartbeat.cmd` launcher 를 자동 생성하도록 스크립트를 보완한 뒤 등록이 성공했다.
  - 작업 이름 `workaround-platform-orchestrator-heartbeat` 가 실제 등록되었고, 상태 조회 기준 `Status: Ready`, `Scheduled Task State: Enabled`, `Repeat: Every: 0 Hour(s), 10 Minute(s)` 를 확인했다.
  - 직접 실행 후 재조회 기준 `Last Run Time: 2026-06-15 오전 2:24:33`, `Last Result: 0` 을 확인했다.
  - 수동 스모크 실행에서도 heartbeat JSON 출력과 로그 파일 갱신이 확인되었다.

## Notes

- 다음 작업자는 같은 머신에서 `manage-heartbeat-task.ps1 -Action status` 또는 `schtasks /Query /TN workaround-platform-orchestrator-heartbeat /FO LIST /V` 로 등록 상태를 다시 확인하면 된다.


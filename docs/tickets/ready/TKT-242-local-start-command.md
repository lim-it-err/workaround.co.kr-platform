문서 상태: 작성완료

# TKT-242 `[INFRA]` 맥 로컬 시작 명령 — `tools/local-start.sh` (local-stop 짝)

- 상태: ready · **P2 · v0.9.4** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.4`.
- 근거: PO 2026-11-28 「tools 안에 start script도 둘 수 있지?」 — TKT-241 `tools/local-stop.sh` 의 짝.
- scope: 신규 `tools/local-start.sh`, `tools/local-stop.sh`(시작 스크립트의 pid 파일을 읽는 부분만 추가), 루트 `.gitignore`(`.local/` 한 줄), `README.md` 로컬 실행 단락 갱신. `services/advisor/local.sh` 는 호출만 하고 고치지 않는다.

## 완료 조건
- [ ] 1. `tools/local-start.sh [main|advisor|all] [--profile mock|claude|ollama]` (기본 `main`, 기본 profile `mock`):
  - `main`: 메인 프런트 `npm --prefix frontend run dev -- --host 127.0.0.1` 를 **백그라운드**로. 로그 `.local/logs/main.log`, pid `.local/main.pid`. 뜰 때까지 기다린 뒤 실제 주소(7000 이 막혀 7001 로 밀리면 그 주소)를 출력.
  - `advisor`: `services/advisor/local.sh <profile>` 을 백그라운드로(로그 `.local/logs/advisor.log`, pid `.local/advisor.pid`), `/health` 와 5173 대기 후 주소 출력. `claude` 인데 `ANTHROPIC_API_KEY` 가 없으면 local.sh 의 안내를 그대로 보여 주고 실패로 끝난다(키를 묻거나 저장하지 않음).
  - `all`: 둘 다.
  - 이미 떠 있으면(같은 pid 살아 있거나 포트를 이 저장소 프로세스가 쥐고 있으면) 다시 띄우지 않고 「이미 실행 중: <주소>」.
  - 포트를 다른 프로젝트가 쥐고 있으면 띄우지 않고 이유 한 줄로 실패.
  - 끝에 「끄기: tools/local-stop.sh」 한 줄.
- [ ] 2. `tools/local-stop.sh` 가 `.local/*.pid` 도 읽어 같은 규칙(이 저장소 프로세스만)으로 내린 뒤 pid 파일을 지운다.
- [ ] 3. node_modules 가 없으면 `npm install` 을 하지 말고 「먼저 npm --prefix frontend install」 안내 후 실패(설치는 사용자가).
- [ ] 4. 검증(구현 메모에 실제 출력): (a) `local-start.sh` → 주소 출력·curl 200 → 다시 실행하면 「이미 실행 중」 → `local-stop.sh` → 포트 해제, pid 파일 삭제, (b) `local-start.sh all`(mock) → 메인·advisor 주소, advisor `/health` profile mock → `local-stop.sh` 로 전부 해제, (c) `--profile claude` 를 키 없이 → 안내 후 실패, 아무것도 안 남음, (d) `bash -n`·`zsh -n`, 실행 권한, `git diff --check`. 검증용으로 띄운 것은 반드시 다 내린다. 이 저장소 밖 프로세스는 건드리지 않는다.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

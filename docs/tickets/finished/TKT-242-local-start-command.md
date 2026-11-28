문서 상태: 작성완료

# TKT-242 `[INFRA]` 맥 로컬 시작 명령 — `tools/local-start.sh` (local-stop 짝)

- 상태: finished · **P2 · v0.9.4** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.4`.
- 근거: PO 2026-11-28 「tools 안에 start script도 둘 수 있지?」 — TKT-241 `tools/local-stop.sh` 의 짝.
- scope: 신규 `tools/local-start.sh`, `tools/local-stop.sh`(시작 스크립트의 pid 파일을 읽는 부분만 추가), 루트 `.gitignore`(`.local/` 한 줄), `README.md` 로컬 실행 단락 갱신. `services/advisor/local.sh` 는 호출만 하고 고치지 않는다.

## 완료 조건
- [x] 1. `tools/local-start.sh [main|advisor|all] [--profile mock|claude|ollama]` (기본 `main`, 기본 profile `mock`):
  - `main`: 메인 프런트 `npm --prefix frontend run dev -- --host 127.0.0.1` 를 **백그라운드**로. 로그 `.local/logs/main.log`, pid `.local/main.pid`. 뜰 때까지 기다린 뒤 실제 주소(7000 이 막혀 7001 로 밀리면 그 주소)를 출력.
  - `advisor`: `services/advisor/local.sh <profile>` 을 백그라운드로(로그 `.local/logs/advisor.log`, pid `.local/advisor.pid`), `/health` 와 5173 대기 후 주소 출력. `claude` 인데 `ANTHROPIC_API_KEY` 가 없으면 local.sh 의 안내를 그대로 보여 주고 실패로 끝난다(키를 묻거나 저장하지 않음).
  - `all`: 둘 다.
  - 이미 떠 있으면(같은 pid 살아 있거나 포트를 이 저장소 프로세스가 쥐고 있으면) 다시 띄우지 않고 「이미 실행 중: <주소>」.
  - 포트를 다른 프로젝트가 쥐고 있으면 띄우지 않고 이유 한 줄로 실패.
  - 끝에 「끄기: tools/local-stop.sh」 한 줄.
- [x] 2. `tools/local-stop.sh` 가 `.local/*.pid` 도 읽어 같은 규칙(이 저장소 프로세스만)으로 내린 뒤 pid 파일을 지운다.
- [x] 3. node_modules 가 없으면 `npm install` 을 하지 말고 「먼저 npm --prefix frontend install」 안내 후 실패(설치는 사용자가).
- [x] 4. 검증(구현 메모에 실제 출력): (a) `local-start.sh` → 주소 출력·curl 200 → 다시 실행하면 「이미 실행 중」 → `local-stop.sh` → 포트 해제, pid 파일 삭제, (b) `local-start.sh all`(mock) → 메인·advisor 주소, advisor `/health` profile mock → `local-stop.sh` 로 전부 해제, (c) `--profile claude` 를 키 없이 → 안내 후 실패, 아무것도 안 남음, (d) `bash -n`·`zsh -n`, 실행 권한, `git diff --check`. 검증용으로 띄운 것은 반드시 다 내린다. 이 저장소 밖 프로세스는 건드리지 않는다.

## 구현 메모
(dev-sonnet, 2026-11-28)
- 신규 `tools/local-start.sh`, `tools/local-stop.sh`(기본 호출일 때만 `.local/*.pid` 읽고 종료 후 삭제 — `--ports/--pids` 내부 호출은 영향 없음, `local.sh stop` 이 메인을 끄지 않게), `.gitignore`(`.local/`), `README.md` 로컬 단락. `local.sh` 미수정.
- 주소는 pid 트리가 실제 듣는 포트(lsof)에서 읽는다. 준비 판정은 그 포트에 curl 응답.
- 검증 출력:
  - (a) `local-start.sh` → 「메인 실행: http://127.0.0.1:7000」 curl 200 → 재실행 「이미 실행 중: 메인 …7000」 → `local-stop.sh` → 「내림: 포트 7000 … vite」「내림: pid 파일 …」, `.local` 에 pid 없음, 7000 은 ControlCenter 만(건너뜀).
  - (b) `all` → 「메인 실행 …7000」「어드바이저 실행: http://127.0.0.1:5173 (profile mock …)」, `/health` = `{"status":"ok","profile":"mock","service":"advisor"}`, 재실행 시 둘 다 「이미 실행 중」, `local-stop.sh` 로 5173·8080·7000(vite) 전부 내림, 포트 0개, pid 파일 삭제.
  - (c) 키 없이 `advisor --profile claude` → local.sh 안내 그대로 출력, rc=1, pid 파일·포트 없음.
  - (d) `bash -n`·`zsh -n` ok, `chmod +x`, `git diff --check` 출력 없음.
- 스펙과 다른 점: 이 맥은 vite 가 `127.0.0.1:7000` 에 붙어 AirPlay(`*:7000`)와 공존해 7001 로 밀리지 않았다(7001 폴백 경로는 실검증 못 함 — 주소를 lsof 로 읽으므로 동작할 것으로 봄). 메인은 포트가 남에게 막혀도 vite 가 밀리므로 「실패」 대신 밀린 주소를 출력한다.
- 시작 실패 시(로그 15줄을 보여 주고 pid 삭제) 이외의 `all` 은 한쪽 실패해도 다른 쪽을 계속하고 rc=1.

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

- r1 통과 (2026-11-28, PM) — `docs/reviews/REV-TKT-242-r1.md`

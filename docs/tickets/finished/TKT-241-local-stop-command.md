문서 상태: 작성완료

# TKT-241 `[INFRA]` 맥 로컬 종료 명령 — 떠 있는 workaround 를 한 번에 내린다

- 상태: finished · **P2 · v0.9.4** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.4`.
- 근거: PO 2026-11-28 「workaround 가 실행중이면 종료하는 코드도 있니 — 로컬에서」. 현재: Advisor `services/advisor/local.sh` 는 **같은 터미널 Ctrl-C** 로만 정리, 메인은 Windows 용 `tools/stop-local-preview.ps1` 뿐(맥 없음). 터미널을 닫거나 백그라운드로 띄우면 8080·5173·7000 등이 남는다.
- scope: 신규 `tools/local-stop.sh`(맥·zsh/bash), `services/advisor/local.sh`(`stop` 하위 명령 + pid 파일 기록), `README.md` 또는 `docs/` 의 로컬 실행 절 한 단락, `services/advisor/README.md` 한 줄. 그 외 금지.

## 완료 조건
- [x] 1. `tools/local-stop.sh` — 아래를 찾아 내리고 무엇을 내렸는지 한 줄씩 출력, 아무것도 없으면 「떠 있는 것 없음」:
  - 이 저장소에서 띄운 프로세스만: 포트 7000(메인 vite dev)·4173~4175(preview)·5173(advisor dev)·8080(advisor/gateway)·8003(elevator) 를 듣는 프로세스 중 **명령줄 또는 작업 디렉터리가 이 저장소 경로 안**인 것(`lsof -nP -iTCP:<port> -sTCP:LISTEN` + `ps`/`lsof -p <pid> -d cwd`). 남의 프로세스(다른 프로젝트의 8080 등)는 건드리지 않고 「건너뜀: 다른 프로젝트 <명령>」 출력.
  - `infra/home` compose 가 떠 있으면 `docker compose down`(compose 프로젝트가 이 저장소의 것일 때만). docker 가 없거나 꺼져 있으면 조용히 건너뜀.
  - 먼저 TERM, 5초 뒤에도 살아 있으면 KILL.
  - `--dry-run` 이면 내릴 대상만 출력.
- [x] 2. `services/advisor/local.sh stop` — local.sh 가 기동 때 남긴 pid 파일(`services/advisor/.local/*.pid`, gitignore)로 백엔드·프런트를 자식까지 정리. pid 파일이 없거나 죽은 pid 면 포트 8080·5173 을 1번과 같은 규칙으로 찾아 정리.
- [x] 3. 검증(구현 메모에 실제 출력): (a) `./local.sh` 를 백그라운드로 띄운 뒤 다른 셸에서 `./local.sh stop` → 8080·5173 해제, (b) 메인 `npm --prefix frontend run dev` 백그라운드 → `tools/local-stop.sh` → 7000 해제, (c) 이 저장소 밖에서 `python3 -m http.server 8080` 을 띄운 상태에서 `tools/local-stop.sh` → 그 프로세스는 「건너뜀」으로 남음(검증 후 직접 끈다), (d) `--dry-run`, (e) 아무것도 없을 때. 실행 권한, `shellcheck` 있으면 통과, `git diff --check`.

## 구현 메모
- 신규 `tools/local-stop.sh`(bash, 맥 기본 3.2 호환). 포트 목록 7000·**7001**·4173~4175·5173·8080·8003 — 7001 추가(스펙 외): 이 맥은 7000 을 macOS ControlCenter(AirPlay)가 점유해 vite dev 가 7001 로 밀린다.
- 판별: `ps -o command=` 에 저장소 절대경로(`pwd -P`, 끝 `/` 포함 비교)가 있거나 `lsof -d cwd` 가 저장소 안이면 내림. 내릴 때 자손까지 TERM → 5초(0.5s×10) 대기 → KILL.
- docker: `docker info` 실패(없음·꺼짐)면 조용히 건너뜀. `label com.docker.compose.project=home-web` 컨테이너 중 `working_dir` 가 이 저장소 `infra/home` 인 것이 있을 때만 `compose --profile '*' down`. **docker 는 떠 있으나 home-web compose 가 없어 down 경로는 「대상 없음」만 확인(실제 down 미검증).**
- `local.sh stop`: 기동 때 `.local/backend.pid`·`frontend.pid` 기록(종료 시 삭제), stop 은 pid 파일 pid + 포트 8080·5173 을 `local-stop.sh --no-docker --ports 8080,5173 --pids ...` 로 위임(저장소 판별 규칙 한 곳). `services/advisor/.gitignore` 에 `.local/` 추가(스펙의 gitignore 요건, scope 에 파일명은 없음). README 두 곳 한 단락·한 줄.
- 스펙과 달리: 7001 포트 추가, `local-stop.sh` 가 `--ports/--pids/--no-docker` 내부 옵션을 가짐. 엘리베이터 컨테이너 `workaround-elevator-service`(Windows 판이 지움)는 스펙에 없어 안 건드림.
- 검증 출력:
  - (e) 아무것도 없음: `건너뜀: 다른 프로젝트 포트 7000 pid 684 — .../ControlCenter` + `떠 있는 것 없음` (ControlCenter 가 7000 점유 — 남의 프로세스 건너뜀 실증).
  - (a) `./local.sh` 백그라운드 → 8080 java 53613, 5173 node 53663 확인 → 다른 셸 `./local.sh stop` → `내림: 포트 8080/5173 …`, `내림: pid 파일 …`(run.sh·npm), 이후 8080·5173 listen 0, `.local` 비움.
  - (b) `npm --prefix frontend run dev -- --port 7001` → `tools/local-stop.sh` → `내림: 포트 7001 pid 53864 — node …/wa-090/frontend/node_modules/.bin/vite`, 이후 7001 listen 0. (7000 은 ControlCenter 라 7001 로 대체)
  - (c) 스크래치패드(저장소 밖)에서 `python3 -m http.server 8080` → `건너뜀: 다른 프로젝트 포트 8080 pid 54052 — python3 -m http.server 8080 …` + `떠 있는 것 없음`, 프로세스 생존 확인 후 직접 kill, 8080 해제.
  - (d) `--dry-run`: `내릴 대상: 포트 5173 …`/`포트 8080 …` 출력, 프로세스 유지(이어서 실제 stop 으로 내려감).
  - 실행 권한 `-rwxr-xr-x`, `bash -n`·`zsh -n` 통과, shellcheck 미설치(생략), `git diff --check` 클린.

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

- r1 통과 (2026-11-28, PM) — `docs/reviews/REV-TKT-241-r1.md`

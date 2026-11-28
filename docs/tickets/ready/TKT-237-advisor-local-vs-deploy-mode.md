문서 상태: 작성완료

# TKT-237 `[FE/BE]` Advisor 로컬 모드 · 배포 버전 구분 — 같은 화면, 붙는 곳만 다르게

- 상태: ready · **P1 · v0.9.3** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.3`.
- 근거: PO 2026-11-28 「llm이 업데이트 되기전까지는 내 로컬에서 돌아갈 수 있게. 즉, 로컬 모드와 배포 버전을 구분하자는 거지. 물론 재활용 가능하면 좋겠어」 → PM 안(화면 하나, 백엔드 연결 여부로 모드 구분, 모드 표시 필수) → PO 「너 의문 그대로 해소해도 될 것 같아」. D-039.
- 현상(PM): `store/missions.js:31` `API_BASE` 기본값 `http://localhost:8080/api/advisor`, 백엔드가 없으면 **조용히** mock 응답으로 폴백 → 받은 리뷰가 진짜(LLM)인지 연습용인지 화면에서 구분 불가. 백엔드는 `mock|claude|ollama` 프로필이 이미 있음. `./run.sh demo` 2단계는 zsh `echo` 가 JSON 의 `\uD83C…` 이스케이프를 깨뜨려 실패(PM 재현 2026-11-28).
- scope (`services/advisor/` 아래):
  - BE: `service/src/main/java/.../adapter/in/web/HealthController.java` — 응답에 `"profile"`(활성 Spring 프로필: mock|claude|ollama) **추가만**(기존 필드 유지). 해당 테스트.
  - FE: 신규 `frontend/src/modules/missions/store/advisorMode.js`(+ `__tests__`), 신규 `frontend/src/modules/missions/components/ModeBadge.vue`, `frontend/src/modules/missions/store/missions.js`(모드 상태 연결·폴백 시 응답에 출처 표시만 — 콘텐츠·스키마 변경 금지), 미션 화면·리뷰 화면에 배지 배치(`pages/MissionPage.vue`·`pages/ReviewPage.vue` 배치 한두 줄).
  - 스크립트: 신규 `local.sh`(저장소의 `services/advisor/` 에 둠), `service/run.sh` demo 의 `echo "$x" |` → `print -r -- "$x" |`.
  - 문서: `README.md` 「실행」 절 — 로컬 모드 / 배포 버전 표.
  - **금지**: 콘텐츠 data/ 파일, API 계약(경로·필드 삭제/변경), 키를 파일에 쓰기, 모듈 격리(`modules/missions/` 밖 참조) 위반, `frontend/`(모선 메인 프런트)·`docs/tickets/board.md`.

## 동작
- **모드 판별** (`advisorMode.js`): 화면 진입 시 `API_BASE` 의 오리진 + `/health` 를 1.5초 타임아웃으로 한 번 조회(이후 60초마다, 탭이 보일 때만).
  - 응답 OK + `profile` 이 `claude`/`ollama` → **로컬 · LLM 리뷰** (`로컬 · Claude 리뷰` / `로컬 · Ollama 리뷰`)
  - 응답 OK + `mock` → **로컬 · 연습 리뷰** (백엔드는 있으나 LLM 없음)
  - 실패 → **배포 · 연습 리뷰** (브라우저 안 mock)
- **배지**: 미션·리뷰 화면 오른쪽 위에 항상 보임. 누르면 한 줄 설명 + 로컬 실행 명령(`./local.sh claude`)을 복사 가능한 텍스트로. 연습 리뷰로 받은 리뷰 카드에는 「연습 리뷰 — LLM 아님」 표식.
- **local.sh** `[mock|claude|ollama]`(기본 mock): JDK 21 확인 → 백엔드(`run.sh start <profile>`) 백그라운드 기동 → `/health` 대기 → 프런트 `npm run dev -- --host 127.0.0.1` → Ctrl-C 시 둘 다 정리. `claude` 는 `ANTHROPIC_API_KEY` 환경 변수가 없으면 이유를 말하고 종료(키를 묻거나 저장하지 않는다). 출력은 「열 주소」 한 줄.
- **재활용**: 배포(Pages) 빌드도 같은 코드. 나중에 Cloudflare Worker 가 생기면 `VITE_ADVISOR_API` 만 바꾸면 배포 버전이 LLM 모드가 된다(이번 범위 밖, README 에 한 줄).

## 완료 조건
- [ ] 1. 백엔드 없음 → 배지 「배포 · 연습 리뷰」, 리뷰 카드 「연습 리뷰 — LLM 아님」.
- [ ] 2. `./run.sh start`(mock) 띄움 → 배지 「로컬 · 연습 리뷰」. `/health` 에 `profile":"mock"`.
- [ ] 3. `advisorMode.js` 단위 테스트: 3상태 판별·타임아웃·profile 누락(구버전 백엔드 = 연습) 처리.
- [ ] 4. `./run.sh demo` 가 끝까지 돈다(LANG 비어 있어도).
- [ ] 5. `./local.sh` (mock) 로 백엔드+프런트가 뜨고 Ctrl-C 로 둘 다 내려간다 — 구현 메모에 실제 출력.
- [ ] 6. 검증: `./run.sh test`(JDK 21), advisor `vite build`(Pages base `--base=/workaround.co.kr-platform/advisor/`), `vitest run`(기존 platformTheme 1건 실패는 무관 — 숫자 기록), playwright 미션 관련 spec + 새 단언(배지 문구, 백엔드 없음 상태), 375·1440 배지 캡처 `docs/tickets/captures/TKT-237/`. `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

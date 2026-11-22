문서 상태: 작성완료

# TKT-232 `[FE]` lite 운영 노트 — 목차 → 한 절씩 읽기

- 상태: finished · **P2 · v0.9.2** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: 시안 「운영 노트」 (PO 2026-11-22 승인).
- 의존: TKT-228.
- scope: `frontend/src/components/lite/LiteWork.vue`(자리표시 교체), 신규 `frontend/src/components/LiteWork.e2e.mjs`, 캡처. `data/workNotes/operatingModel.js`·`WorkNotes.vue`·`WorkView.vue` 수정 금지(읽기만).

## 화면
- 1단계 목차: `OPERATING_NOTES` 의 `title` 목록(번호 붙임) + 줄 오른쪽에 status(확정/제안/할 일). 위에 「갱신 OPERATING_NOTES_UPDATED」 한 줄. 첫 줄 선택된 채 시작.
- 2단계 한 절: 「n/N」, 제목, lead 한 문단, points 목록(있으면 flow 는 「→」 로 이은 한 줄). ←→ = 앞뒤 절, ↑↓ = 본문 스크롤, Esc = 목차(고르던 줄 유지).
- Esc(목차) = 환승 홀.

## 완료 조건
- [x] 1. 목차 항목 수 = `OPERATING_NOTES.length`(하드코딩 금지).
- [x] 2. 키만으로 목차 → 절 → → 다음 절 → Esc 목차(같은 줄 선택 유지).
- [x] 3. 375 가로 스크롤 0, 줄 ≥44px.
- [x] 4. 검증: 빌드(Pages base) + `Lite.e2e.mjs`·`HallV09.e2e.mjs`·새 `LiteWork.e2e.mjs` 통과, 캡처 `docs/tickets/captures/TKT-232/` 375·1440 목차·절. `git diff --check`.

## 구현 메모
- 파일: `frontend/src/components/lite/LiteWork.vue` (자리표시 교체), 신규 `frontend/src/components/LiteWork.e2e.mjs`, 캡처 `docs/tickets/captures/TKT-232/`. 그 밖 파일은 건드리지 않았다. `board.md` 는 PM 지시대로 수정하지 않았다.
- 목차는 `OPERATING_NOTES` 를 그대로 `v-for` 로 그린다(개수 하드코딩 없음). 상단 「갱신 2026-10-25」(`OPERATING_NOTES_UPDATED`), 첫 줄이 선택된 채 시작. 배지 색은 확정/제안/할 일 세 가지를 테두리·점선으로만 구분한다.
- 절은 「n/N」, 제목(+상태), lead, flow(`→` 로 이은 한 줄, 흐름 없으면 줄 없음), points 순서.
- 키: 목차 ↑↓·Home·End 고르기, Enter 읽기(포인터는 한 번 선택·같은 줄 다시 진입). 읽기 ←→ 앞뒤 절(끝에서 감싼다, 시안과 같음), ↑↓ 본문 스크롤(`.lite-scr` 를 48px 단위로), Esc 목차(고르던 줄 유지). 목차에서 Esc 는 `back` → 환승 홀.
- 확인이 필요했던 점(스펙과 다르거나 빈칸을 메운 곳):
  1. 시안 `lite-pages.html` 의 운영 노트 데이터는 옛 10개 문장 복사본이다. 구현은 시안 문구가 아니라 `operatingModel.js` 를 썼다(티켓 지시).
  2. 읽는 화면의 ‹ 뒤로 버튼은 목차로 간다(시안 `back()` 과 같음). 티켓은 Esc 만 적었다. 목차에서 ‹ 뒤로 는 환승 홀.
  3. 목차 위 제목「운영 노트 — 기지선」은 시안에서 가져왔다. 티켓 목록에는 없다. 빼라고 하면 한 줄 삭제.
  4. 테마: 현재 앱에는 라이트 테마가 없다(TKT-218, `useTheme.js`). 그래서 다크/라이트 캡처는 하나만 만들었다. 같은 화면 두 장을 만들면 의미가 없다.
- 공유 파일을 건드리지 않았다. 빌드·e2e 는 lite-gate.sh 잠금 안에서 돌렸다.

## 질문/에스컬레이션
(없음)

## 질문/에스컬레이션
(없음)

## 검증
- `lite-gate.sh frontend/src/components/LiteWork.e2e.mjs frontend/src/components/Lite.e2e.mjs frontend/src/components/HallV09.e2e.mjs` (env `LITE_WORK_SCREENSHOT_DIR=docs/tickets/captures/TKT-232`): `BUILD OK` (Pages base `--base=/workaround.co.kr-platform/`), `# pass 35 / # fail 0 / # skipped 2`.
- `LiteWork.e2e.mjs` 단독: `# tests 8 / # pass 8 / # fail 0`. 375·1440 각각: 목차 항목 수 = `OPERATING_NOTES.length`, 첫 줄 선택, 줄 높이 ≥44px, 가로 넘침 0(html·body·.page-scroller·.lite-screen), 키 흐름 목차→절→←→→Esc 목차(유지)→Esc 환승 홀, flow 한 줄, 흐름 없는 절, ‹ 뒤로 동작.
- `git diff --check` (LiteWork.vue, LiteWork.e2e.mjs, 티켓): rc=0.
- 캡처(375·1440 목차·절, 실제로 열어 확인): `docs/tickets/captures/TKT-232/lite-work-toc-375.png`, `lite-work-read-375.png`, `lite-work-toc-1440.png`, `lite-work-read-1440.png`.
  - 375 목차 줄바꿈 실제 텍스트: 「방문자 요청이 집 PC 에 / 닿는 길」, 「카페에서 집 PC 에 / 들어가는 법」 — 단어 중간 분할 없음.
  - 375 절 「한눈에 보는 구조」 본문 줄바꿈 정상, 가로 스크롤 없음. 하단 「노선도 · 승강장」 은 lite 공용 틀이 아니라 앱 하단 바(기존 동작)라 이 티켓 범위 밖.
- 영어 간판 0: 화면 문구는 한국어, 영어 토큰(PO·PM·Codex·Cloudflare·GitHub·RTX 5070 등)은 본문 내용이라 그대로 둠.
- 미실행: 단위 테스트(`node --test`), Advisor, gateway — 로직 파일 밖을 건드리지 않았다.

## 리뷰 기록
(PM)

- r1 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-232-r1.md`

문서 상태: 작성완료

# REV-TKT-119-r1 — 접근성 정합(키보드·포커스·접근 이름·대비) (PM 판정: **통과 → finished**, 커밋은 128 r2 와 묶음)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: 메인 Pages base build 48 modules · unit 20/20, Advisor unit 74/74 · build 110 modules. 구현자 Chromium 14/14 + Advisor 8/8 인정.
- 실화면(localhost:7010, 390):
  - **일차 탭** `aria-label="3일차 체스키크룸로프"` + 선택 `aria-current="date"`, 노선도 토글 `aria-expanded` ✓. 시각표 정차역은 `<button>`(tabindex 0).
  - **정차역 시트** `role=dialog aria-modal=true aria-labelledby`, 열면 포커스가 시트 안으로, 마지막 제어(`정차역 저장`)에서 Tab → 첫 제어(`상세 닫기`)로 순환(트랩 ✓), 시트 안에서 Esc → 닫히고 포커스가 열었던 `Papa's` 행으로 복귀 ✓.
  - **여정 노선도 SVG** 링크 12개에 접근 이름 — `DAY 4 · 할슈타트→잘츠부르크 · 운전 1시간 20분 · 75km`, `프라하 · DAY 1–2 정차역 상세` ✓.
  - **스플래시** 순환선 심볼 `role=img "순환선"`, 티커 `aria-live=polite`, `다시 재생` 키보드 도달 ✓.
  - **라이트 대비**(118 이관): 환승 홀 라이트에서 SVG 노선명·목록 글자 4.5:1 미만 0 (`--line-*-text` 분리) ✓.
  - **Advisor `/learn`** select 4개 접근 이름 `시간·코드 작성·형식·완료`, 이름 없는 입력 0 ✓.
- [제안] 테마 버튼은 `aria-label`(`다크 모드`/`라이트 모드`)로 상태를 전달 — `aria-pressed` 는 불필요. 실제 스크린리더(VoiceOver) 검증은 PO 단말에서 1회 권장.
- **커밋 경계**: 공유 파일 4(`App.vue`·`ToneTools.e2e.mjs`·`VoyageRouteMap.vue`·`VoyageRouteMap.e2e.mjs`)에 **TKT-128 r1 반려분(재작업 전)** 이 함께 있다 → 119 커밋은 **128 r2 판정 시 묶음**(본문에 티켓별 파일 목록). 119 단독 파일: `JunctionMap.vue`·`JunctionMap.e2e.mjs`·`lines.js`·`splashTone.e2e.mjs`·`styles.css`, Advisor `e2e/{learn-index,platform-frame}.spec.ts`·`components/{ChatPanel,FileSubmitEditor,NicknamePrompt,PlannerMeetingPanel,PlannerReviewPanel}.vue`·`pages/{HomePage,LearnPage,MissionPage}.vue`.

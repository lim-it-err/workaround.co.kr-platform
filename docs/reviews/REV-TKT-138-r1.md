문서 상태: 작성완료

# REV-TKT-138-r1 — v0.7.0 릴리스 게이트 블로커 — taxi E2E 구 selector·hit area 일괄 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-138-r1-draft.md` 채택. PM 재실행(2026-09-15 10:xx): 메인 Pages-base build 49 modules · unit 22/22 · E2E 스위트별 올바른 base 로 58/58(Blog 2·Junction 4·Transfer 2·Collection 2·Replay 3·RouteMap 4·splash 6(단독 재실행, 배치 병렬 시 1건 타이밍 실패)·staticRouting 4·WritingStudio 9(Pages preview 4174)·SimTone 5·taxi 5(root preview 4175)·ToneTools 12) · Advisor build 110 · unit 81/81 · Playwright 46/46.
- 리뷰어 초안(REV-TKT-138-r1-draft)은 `.writer-bar` 375px 2px overflow 를 [블로커]로 봤으나, 이후 트리(141·144 시점)에서 리뷰어 스스로 WritingStudio **9/9 재확인**, PM 도 dev 375 에서 `.writing-room`/`.writer-bar` overflow 0 실측, 위 게이트 Pages preview 9/9 — **재현 안 됨**, 블로커 해제.
- 디자이너 UX-TKT-138-r1: 대상 34개 전부 40×40 이상·overflow 0·pageerror 0, [제안] 1(저장 안내 원은 작게 유지 가능).
- 실화면(375 dev): 상단바 `환승 홀`·테마 40px, 스튜디오 `← 블로그 59×40`·`미리보기 61×40`·`발행 40×40`·`＋ 40×40`·`⋯ 40×43`, 블로그 허브 링크 40 미만 0. taxi E2E 5/5(구 `.sim-annex` selector 교체).
- [제안] UX-138 S1 채택 후보(시각 원 작게·hit area 유지) — 후속.
- 커밋 범위: `frontend/src/sim/taxiDispatch.e2e.mjs`, `frontend/src/components/BlogTone.e2e.mjs`, `frontend/src/components/WritingStudio.vue`, `frontend/src/components/WritingStudio.e2e.mjs`, Advisor `pages/MissionPage.vue`·`pages/PracticeGamePage.vue`; 공유 `styles.css`. 138·139·140·143·144 는 공유 파일(`App.vue`·`styles.css`·`lines.js`·`JunctionMap.vue`·`ToneTools.e2e.mjs`)이 겹쳐 **한 커밋**(U-32), 141 은 단독 커밋.

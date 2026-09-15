문서 상태: 작성완료

# REV-TKT-141-r1 — 정차역 편집 시트 기본 3칸 + 접힘 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-141-r1-draft.md` 채택. PM 재실행(2026-09-15 10:xx): 메인 Pages-base build 49 modules · unit 22/22 · E2E 스위트별 올바른 base 로 58/58(Blog 2·Junction 4·Transfer 2·Collection 2·Replay 3·RouteMap 4·splash 6(단독 재실행, 배치 병렬 시 1건 타이밍 실패)·staticRouting 4·WritingStudio 9(Pages preview 4174)·SimTone 5·taxi 5(root preview 4175)·ToneTools 12) · Advisor build 110 · unit 81/81 · Playwright 46/46.
- 실화면(375 dev): 값 있는 정차역(Papa's)은 `더 적기` 자동 펼침(스펙대로), 저장 버튼 bottom 832 ≤ 844. 리뷰어 통과 + **부가로 VoyageRouteMap E2E 의 날짜 종속(`740km` 하드코딩) 결함 해소** — 이 세션의 잠복 red 제거. RouteMap E2E 4/4.
- 커밋 범위: `frontend/src/components/voyage/VoyageRouteMap.vue`, `frontend/src/components/VoyageRouteMap.e2e.mjs`. 138·139·140·143·144 는 공유 파일(`App.vue`·`styles.css`·`lines.js`·`JunctionMap.vue`·`ToneTools.e2e.mjs`)이 겹쳐 **한 커밋**(U-32), 141 은 단독 커밋.

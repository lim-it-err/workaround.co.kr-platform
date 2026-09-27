문서 상태: 작성완료

# REV-TKT-142-r1 — Advisor 배우기 첫 화면 축약 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-142-r1-draft.md`(통과 권고, 블로커 0) 채택.
- PM 게이트(2026-09-15 저녁, 워킹 트리 = 142·145·148·150 + 146 진행분): 메인 Pages-base build 49 modules · unit **25/25** · E2E 스위트별 base 로 **52/52**(Junction 4·RouteMap 4·Collection 2·Replay 3·Blog 2·staticRouting 4·Transfer 2·SimTone 5·taxi 5·ToneTools 12; splash 는 TKT-146 이 재작성 중이라 제외) · Advisor build 110 · unit **81/81** · Playwright **48/48**.
- PM 실화면(375, dev 5173 `/learn`): 문서 높이 **1,244px**(종전 4,999 → 24.9%), 통합 목록 행 0 · 코스 행 2 · `전체 181개 보기` 버튼 50px · 가로 overflow 0. 버튼 클릭 → 목록 30행 노출·라벨 `전체 목록 접기`. 해시 딥링크·필터 경로는 E2E(learn-index 신규 3건) 로 확인.
- [반박][해결] 검토: 기존 회귀 테스트 2건이 "진입 즉시 목록" 전제를 썼던 것을 `전체 보기` 클릭 한 번 추가로 정합 — 단언 삭제·완화 없음(리뷰어 diff 확인 일치). 제품 범위 확장 없음.
- [제안] 버튼 텍스트와 화살표 사이 공백(`보기↓`) — 접근 이름은 `aria-hidden` 처리로 무관, 시각만. 후속 153 에서 함께.
- 커밋 범위: `services/advisor/frontend/src/modules/missions/pages/LearnPage.vue`, `services/advisor/frontend/e2e/{learn-index,core-flows,advisor-surfaces}.spec.ts`.

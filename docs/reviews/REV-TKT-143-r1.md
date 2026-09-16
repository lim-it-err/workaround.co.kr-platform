문서 상태: 작성완료

# REV-TKT-143-r1 — 최종 UX B1(읽기용 카드 면 2곳) + I1(오늘 CTA 카드 목적지) (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-143-r1-draft.md` 채택. PM 재실행(2026-09-15 10:xx): 메인 Pages-base build 49 modules · unit 22/22 · E2E 스위트별 올바른 base 로 58/58(Blog 2·Junction 4·Transfer 2·Collection 2·Replay 3·RouteMap 4·splash 6(단독 재실행, 배치 병렬 시 1건 타이밍 실패)·staticRouting 4·WritingStudio 9(Pages preview 4174)·SimTone 5·taxi 5(root preview 4175)·ToneTools 12) · Advisor build 110 · unit 81/81 · Playwright 46/46.
- 실화면(Advisor dev 375): `이번 비행 추천` 3행 배경 투명·radius 0·hairline(border-bottom) — B1-a 해소. 오늘 CTA `/missions/s6-overbooking-01` → 도착 화면 제목 = 히어로 제목 일치 — I1 해소(독서 카드 케이스는 E2E). Runtime `배포 레일` B1-b 는 ToneTools 12/12 근거. 리뷰어 통과. 디자이너 UX-TKT-143-r1 은 작성 중(수정중) — 도착 시 disposition.
- 커밋 범위: Advisor `pages/InflightPage.vue`·`store/missions.js`·`store/__tests__/missions.spec.js`·`e2e/course-container.spec.ts`; 공유 `App.vue`·`styles.css`·`ToneTools.e2e.mjs`. 138·139·140·143·144 는 공유 파일(`App.vue`·`styles.css`·`lines.js`·`JunctionMap.vue`·`ToneTools.e2e.mjs`)이 겹쳐 **한 커밋**(U-32), 141 은 단독 커밋.

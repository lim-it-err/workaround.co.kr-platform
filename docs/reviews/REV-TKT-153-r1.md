문서 상태: 작성완료

# REV-TKT-153-r1 — Advisor 표기 소묶음 — 코스 시간·첫 시즌·시즌 빈 상태 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-153-r1-draft.md`(통과) 채택. PM 실화면(375 `/learn`): 코스 행 `다음 1시간 30분 · 전체 약 76시간` / `다음 20분 · 전체 11시간 20분` / `다음 30분 · 전체 5시간` — 다음 회차가 앞, 전체가 보조. `durationFormat` unit 포함 93/93.
- PM 게이트(2026-09-15 밤, 워킹 트리 = 146·147·148r2·151·134·152·153·154·155·156 + 157 진행분): 메인 Pages-base build 49 modules · unit **25/25** · E2E 스위트별 base — Junction 4·RouteMap 4·Collection 2·Replay 3·Blog 2·staticRouting 4·splash 6·WritingStudio 13(첫 배치 2건 red 는 preview 기동 race, 단독 재실행 13/13) · root-base SimTone 5·taxi 5·ToneTools 12 · Transfer 2 (메인 E2E 합계 **62/62**) · Advisor build 117(경고 0) · unit **93/93** · Playwright **56/56**.
- 커밋 범위: `durationFormat.js`·spec, `LearnPage.vue`(142 공유)·`CourseList.vue`·`CourseDetailPage.vue`·`SeasonPage.vue`·`TodayPage.vue`, `e2e/label-bundle.spec.ts` (Advisor 묶음)

- 커밋 보류(2026-09-15 밤): 공유 spec 의 인덱스 카운트가 진행 중인 TKT-157(사건 파일 2편) 데이터까지 포함한 186 으로 갱신돼 있어, 157 need_review·판정 뒤 **Advisor 152~157 묶음 커밋**(U-32 ③). 워킹 트리 기준 게이트는 위와 같이 그린.

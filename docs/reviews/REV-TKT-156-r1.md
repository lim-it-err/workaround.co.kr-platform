문서 상태: 작성완료

# REV-TKT-156-r1 — Advisor 두 번째 코스 "부다페스트 온천 큐" [콘텐츠] (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 없음 — PM 직접(콘텐츠 판정: 출처·수치 검산 U-33·U-37).
- PM 실화면(375 `/learn` → `/courses/budapest-baths`): 코스 3행(A03 `♨️ 부다페스트 온천 큐 · 6개 · 다음 30분 · 전체 5시간`), 상세 h1·미션 6(시뮬 1·코딩 3·게임 2) 진입 링크, `[확인]`/`[학습용]` 화면 노출 0(미션 CSV 데이터 열에만), overflow 0.
- 시뮬 검산표(티켓): 4경우 모두 `도착 ≥ 처리 시작`, `처리 시작 + 미처리 = 도착`, 이용률 0..1, 창구 2→3 에서 평균 대기 7→1초·24→5초 단조 감소 — unit 고정. 통과.
- 출처 절: szechenyibath.hu(pools·bath-units·prices·faq·water-composition)·bkk.hu 푸니쿨라, 확인일 2026-09-15. 파일 머리에 "실제 운영 절차·예측 아님" 경계.
- [제안] ①검산표의 "정규화 이용률"이 `처리×평균 처리시간/(창구×3600)` 단순식(0.76·0.51)보다 약 1.2배 높다 — 엔진의 정의(예약 레인 가중)를 티켓 한 줄로 명시. ②CSV `note` 열의 `[확인] 온도; [학습용] 용량` 은 학습자에게 출처 표기로 읽히므로 수용하되, 다음 코스부터는 `provenance` 열 하나로.
- PM 게이트(2026-09-15 밤, 워킹 트리 = 146·147·148r2·151·134·152·153·154·155·156 + 157 진행분): 메인 Pages-base build 49 modules · unit **25/25** · E2E 스위트별 base — Junction 4·RouteMap 4·Collection 2·Replay 3·Blog 2·staticRouting 4·splash 6·WritingStudio 13(첫 배치 2건 red 는 preview 기동 race, 단독 재실행 13/13) · root-base SimTone 5·taxi 5·ToneTools 12 · Transfer 2 (메인 E2E 합계 **62/62**) · Advisor build 117(경고 0) · unit **93/93** · Playwright **56/56**.
- 커밋 범위: `data/courseBudapestBaths.js`·`courseBudapestBathsCatalog.js`·`courseVienna1900Catalog.js`·`missionCatalog.js`·`routineCatalog.js`, `courseCatalog.js`·`practiceCatalog.js`·`learnCatalog.js`(152·153·155 공유), `CourseSimulationPage.vue`·`BoundaryGamePage.vue`·`ProbeGamePage.vue`, `e2e/budapest-baths-course.spec.ts` (Advisor 묶음)

- 커밋 보류(2026-09-15 밤): 공유 spec 의 인덱스 카운트가 진행 중인 TKT-157(사건 파일 2편) 데이터까지 포함한 186 으로 갱신돼 있어, 157 need_review·판정 뒤 **Advisor 152~157 묶음 커밋**(U-32 ③). 워킹 트리 기준 게이트는 위와 같이 그린.

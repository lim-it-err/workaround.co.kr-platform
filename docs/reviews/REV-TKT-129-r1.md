문서 상태: 작성완료

# REV-TKT-129-r1 — Advisor 배우기 통합 인덱스 + GamesPage 폐기 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: `services/advisor/frontend` unit **74/74**(14 files), build **110 modules**(GamesPage 제거로 감소). 구현자 Playwright 40/40 인정. 콘텐츠 3파일 diff 없음.
- 실화면(127.0.0.1:5173, 390 dark / 1440 light):
  - `/learn`: 단일 인덱스 `배울 거리 181개 — 코스 2 · 미션 39 · 사건 파일 8 · 프로젝트 1 · 연습 131`. 필터 4축(시간·코드 작성·형식·완료) select + `고급 필터` details(닫힘, 구 12칩) + 검색·초기화. `5분 이하` 선택 → 123개로 즉시 좁혀짐. 30개 점진 노출.
  - 행: hairline, 1440 에서 넓은 채움 면 0, 조작부 40px 미만 0, overflow 0. 대문자 영어 간판 0. "시즌제 스탯 준비 중" 0.
  - alias: `/games` → `/learn#practice`(연습 131개 필터 + `이어 하던 연습 · 총, 균, 쇠 · 이어서` 복원), `/projects` → `/learn#projects`, `/games/practice/reading` 딥링크 정상. `GamesPage.vue` 삭제.
- 완료 조건 1~4 충족.
- [제안→119] 필터 select 4개에 접근 가능한 이름 없음(`aria-label` 부재) — 119 접근성에서.
- [제안] 코스 행의 `4535분` 합계는 `약 76시간` 식이 읽기 쉽다. 초기 청크 502kB lazy-load 는 구현자가 후속 판단으로 남김 — 필요 시 별도 티켓(현재 성능 이슈 보고 없음).
- 커밋 범위: `services/advisor/frontend/{e2e/{advisor-surfaces,core-flows,learn-index}.spec.ts, src/modules/missions/games/{practiceCatalog.js,__tests__/practiceCatalog.spec.js}, src/modules/missions/pages/{GamesPage.vue(삭제),LearnPage.vue}, src/modules/missions/store/{learnCatalog.js,__tests__/learnCatalog.spec.js}}`.

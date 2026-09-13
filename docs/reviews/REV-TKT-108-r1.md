문서 상태: 작성완료

# REV-TKT-108-r1 — Line V 컬렉션 전환 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 그린(54 modules), node 15/15(voyageCollection·voyageStorage 신규 포함). 구현자 E2E(VoyageCollection 2/2·WritingStudio 9/9) 인정.
- 실화면(localhost:7010/voyage, 390): 진행 중 여행 직행(DAY 7 · 비엔나→부다페스트) + `← 여행 목록` / 목록: "지금 여행 중" 주인공 1 + 지난 여행 2건(월 단위 근사 표기 · "0개 도시 · 기록 보기") / 아이슬란드 → V03 기록 화면 빈 상태 한 줄. overflow 0. 데이터: `voyages/{east-europe-2026,spain-2024,iceland-2025,index}.js`, `VOYAGE` 호환 별칭, 저장키 `voyage:<id>:*` 1회 이행.
- [제안] 목록 화면은 아직 구 톤(전폭 초록 버튼·역명판) — 톤 전환은 TKT-112 범위. 지난 여행 콘텐츠는 PM(스페인·아이슬란드 데이터 파일)이 채운다.
- 커밋 범위: `frontend/src/App.vue`, `components/Voyage*.vue`, `components/voyage/**`, `components/VoyageCollection.e2e.mjs`, `components/WritingStudio.e2e.mjs`(백업 키), `data/lines.js`, `data/voyage.js`, `data/voyages/**`, `data/voyageStorage.js`, `data/*.test.mjs`.

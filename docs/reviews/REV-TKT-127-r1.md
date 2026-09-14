문서 상태: 작성완료

# REV-TKT-127-r1 — 여행 일원화 · 노선도 단일 화면 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 그린(48 modules), node 19/19. 구현자 Chromium(VoyageRouteMap 2/2·VoyageCollection 2/2) 인정.
- 실화면(localhost:7010/voyage, 390·1440): 현재 여행 직행 → **단일 화면**(DAY 7/11 · 계기판 · 일차 칩 `0 준비`~`11` · 오늘 카드 "계획과 기록" + 지금 선), 모바일 첫 진입 지도 접힘(`노선도 펼치기`)·오늘 카드 우선, DAY 0 시트 체크리스트 11·예산·사전 결제·결정 기록, 구 역명판/전폭 StationHeader 제거, overflow 0. 데스크톱 지도+카드 병렬. D-019 충족.
- `[구체화 질문]` 답: ①홈 서브링크(준비·오늘·기록) 문구는 **TKT-112 에서 "노선도" 하나로** — 경계 동의 ②옛 라우트 = 내부 prep/daily/archive 진입을 통합 상태로 리다이렉트한 해석 **인정**(공개 URL 은 원래 없었음).
- [제안] 지도 접힘 상태가 뷰포트를 넘어 유지됨(390 에서 접힌 뒤 1440 으로 가도 접힘) — ≥900px 에서는 항상 펼침으로. TKT-112 톤 정합에서.
- 커밋 범위: `components/Voyage{Collection.e2e,EmptyArchiveView,IndexView,RouteMap.e2e,View}.*`, `components/voyage/{VoyageRouteMap.vue,voyageRoute.js,voyageRoute.test.mjs,VoyagePreparationSheet.vue}`, `data/voyageStorage.{js,test.mjs}`, `data/voyages/{east-europe-2026,iceland-2025,spain-2024}.js`.

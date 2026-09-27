문서 상태: 작성완료

# REV-TKT-109-r1 — 여정 노선도 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 그린(57 modules), node 15/15 + voyageRoute 1/1. 구현자 E2E(VoyageRouteMap 2/2·VoyageCollection 2/2) 인정.
- 실화면(localhost:7010/voyage → 여정 노선도, 390): 실좌표 9역·8구간(지나온 실선·현재 안전색·남은 점선), 계기판 740km/1,515 · 523만원/856, 구간 클릭 → 일차 탭·헤더·시각표가 DAY 4 로 동기, 역/정차역 → 우측 패널/바텀시트(E2E), overflow 0. r7 목업 = 스펙 충족.
- `[구체화 질문]` 답: VoyageDailyView 에 최소 접착부(진입 버튼) 추가한 판단 **인정** — 도달 불가 화면은 완료가 아니라는 UX 1순위 원칙에 맞음.
- [제안] 화면 크롬은 아직 구 톤(역명판 V02-R·전폭 배너) — 일원화·톤 전환(TKT-127)에서 정리. 작은 화면에서 지도가 계기판 아래로 밀려 첫 화면에 지도가 안 보임 — 127 에서 "오늘 카드 우선·지도 접기" 정책 적용.
- 커밋 범위: `components/VoyageDailyView.vue`, `components/VoyageRouteMap.e2e.mjs`, `components/voyage/{VoyageRouteMap.vue,voyageRoute.js,voyageRoute.test.mjs}`, `data/voyages/east-europe-2026.js`.

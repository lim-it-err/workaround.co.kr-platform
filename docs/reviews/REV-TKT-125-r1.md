문서 상태: 작성완료

# REV-TKT-125-r1 — 여행(V) ↔ 배움(A) 환승 링크 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: 메인 Pages base build 48 modules · unit 20/20, Advisor unit 74/74 · build 110 modules. **병합 dist 를 PM 이 워크플로와 같은 순서로 재생성**(메인 base → Advisor `advisor/` base → `dist/advisor/` 복사)하고 왕복 E2E `VoyageAdvisorTransfer.e2e.mjs` **2/2 직접 통과**(375 dark·1440 light: 벨베데레 정차역 → `/advisor/courses/vienna-1900` → `v1900-f-belvedere-route` → `이 미션의 정류장 ←` → 벨베데레 상세 시트 복귀, 1일차 환승 링크 0, overflow 0).
- 실화면(localhost:7010 `/voyage`, 390): DAY 6 오전 `쇤브룬 궁전` 행에 `이걸로 미션 만들기 →`(h44, href `/advisor/courses/vienna-1900`, 면 없음), DAY 1 환승 링크 0. 전체 로드로 `/voyage#voyage-stop-day-6-schoenbrunn` 진입 → DAY 6 선택 + 상세 시트 자동 개봉(시트 안에도 환승 링크) + URL `/voyage` 로 정리 ✓.
- Advisor 역링크는 `platformHome`(모선 안에서만 존재) 조건부라 단독 dev(5173)에서는 숨김 — 설계대로. 연결 없는 미션(`v1900-b-pigments`)엔 역링크 0 ✓.
- 데이터: `east-europe-2026.js` 에 정차역 `id` 3개(day-4-hallstatt·day-6-schoenbrunn·day-6-belvedere)와 `missions[]` — PM 콘텐츠 파일이지만 스코프에 명시된 구조 필드만 추가, 본문 무변경 확인.
- [제안] 순환선 심볼은 CSS 원(`voyage-return__loop`)으로 구현 — D-018 C안 심볼(열린 기점) 확정 후 126 에서 공용 아이콘으로 교체.
- 커밋 범위: `frontend/src/components/voyage/{VoyageRouteMap.vue,voyageRoute.js,voyageRoute.test.mjs}`, `frontend/src/components/VoyageAdvisorTransfer.e2e.mjs`, `frontend/src/data/voyages/east-europe-2026.js`, `services/advisor/frontend/src/modules/missions/pages/MissionPage.vue`.

문서 상태: 작성완료

# TKT-172 `[FE]` 여행 결산 화면 — `settlement` 데이터(사전확정·현지·카테고리·지역·제외) 표시

- 상태: ready · P2 · 담당: codex-1 · 의존: 없음(데이터는 `east-europe-2026.js` `settlement` 에 있음, 2026-09-25 PM 반영). 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.** 콘텐츠 파일 불가침.
- scope: `frontend/src/components/voyage/VoyageRouteMap.vue`(arrived 상태의 `결산` 절) 또는 신규 `VoyageSettlement.vue`, `voyageRoute.js`(`routeGauges` 에 settlement 우선), E2E.

## 완료 조건
1. [ ] `status: arrived` 여행에서 노선도 하단에 `결산` 절: 총액 한 줄(777.1만원 · 1인 388.6) → 사전확정/현지 2행 → 카테고리 7행·지역 3행(면 없는 hairline 표, 합계 행 굵게) → 제외 항목 목록. 숫자는 `만원` 단위 소수 1자리.
2. [ ] 지출 게이지는 `settlement.grandTotal` 이 있으면 그것을 우선(현재 777 표시 유지).
3. [ ] 375/1440 × 다크/라이트, overflow 0, E2E 1건(합계 = 사전 + 현지 검산 단언), 기존 RouteMap 4/4.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

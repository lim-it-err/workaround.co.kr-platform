문서 상태: 작성완료

# TKT-172 `[FE]` 여행 결산 화면 — `settlement` 데이터(사전확정·현지·카테고리·지역·제외) 표시

- 상태: started (2026-10-24, PM r1 반려 → r2)· P2 · 담당: codex-1 · 의존: 없음(데이터는 `east-europe-2026.js` `settlement` 에 있음, 2026-09-25 PM 반영). 브랜치 `codex/v0.8.0-live`. **UX 1순위·[반박] 의무.** 콘텐츠 파일 불가침.
- scope: `frontend/src/components/voyage/VoyageRouteMap.vue`(arrived 상태의 `결산` 절) 또는 신규 `VoyageSettlement.vue`, `voyageRoute.js`(`routeGauges` 에 settlement 우선), E2E.

## 완료 조건
1. [x] `status: arrived` 여행에서 노선도 하단에 `결산` 절: 총액 한 줄(777.1만원 · 1인 388.6) → 사전확정/현지 2행 → 카테고리 7행·지역 3행(면 없는 hairline 표, 합계 행 굵게) → 제외 항목 목록. 숫자는 `만원` 단위 소수 1자리.
2. [x] 지출 게이지는 `settlement.grandTotal` 이 있으면 그것을 우선(현재 777 표시 유지).
3. [x] 375/1440 × 다크/라이트, overflow 0, E2E 1건(합계 = 사전 + 현지 검산 단언), 기존 RouteMap 4/4.

## 구현 기록
- `VoyageRouteMap.vue`: `arrived` 여행에만 보이는 면 없는 결산 절을 추가했다. 총액·1인 금액, 사전 확정/현지 지출, 카테고리 7행·지역 3행과 각 합계, 제외 항목을 소수 1자리로 표시한다.
- `voyageRoute.js`: `settlement.grandTotal` 이 유효하면 지출 게이지의 실제 지출로 우선하고, 결산이 없으면 기존 선결제+일차 지출 계산을 유지한다.
- `VoyageSettlement.e2e.mjs`: 4환경에서 결산 총액 검산, 행 수, 표시 자릿수, 제외 항목, overflow 0, API 0을 고정했다. 기존 RouteMap 사진 미리보기 단언은 비동기 표시 완료 뒤 확인하도록 동기화했다.
- 콘텐츠 원본 `frontend/src/data/voyages/east-europe-2026.js`는 수정하지 않았다.

## 검증
- `node --test src/components/voyage/voyageRoute.test.mjs src/data/*.test.mjs src/sim/taxiDispatch.test.mjs src/staticRouting.test.mjs src/staticWritingState.test.mjs` — 27/27 통과.
- `npm run build -- --base=/workaround.co.kr-platform/` — 55 modules 통과.
- `node --test src/components/VoyageSettlement.e2e.mjs src/components/VoyageRouteMap.e2e.mjs` — 신규 결산 1/1(내부 4환경), 기존 RouteMap 4/4 통과.
- 375/1440 × 다크/라이트 캡처 4장을 직접 확인했다. 가로 넘침 0, 모바일 단일 열·데스크톱 2열, hairline 표와 굵은 합계가 유지된다.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 구현 완료, PM·리뷰어 판정 대기. 커밋하지 않음.

## PM 반려 (2026-10-24, r1) — `docs/reviews/REV-TKT-172-r1.md`
- [중요] I1 결산 노출 조건 = `arrived` 또는 날짜상 종료(`routeGauges.isComplete` 와 동일). 콘텐츠 status 는 boarding 유지.

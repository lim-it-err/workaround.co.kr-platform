문서 상태: 작성완료

# TKT-231 `[FE]` lite 자취 밥상 — 질문 세 개 → 한 상

- 상태: ready · **P1 · v0.9.2** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: 시안 「자취 밥상」 (PO 2026-11-22 승인). 시안은 메뉴 하나를 고르지만 실데이터 단위는 **한 상 세트(`PANTRY_SETS`)** 이므로 결과는 세트 하나다(PM 판단).
- 의존: TKT-228.
- scope: `frontend/src/components/lite/LitePantry.vue`(자리표시 교체), 필요하면 `frontend/src/components/lite/litePantry.js`(순수 함수) + 단위 테스트, 신규 `frontend/src/components/LitePantry.e2e.mjs`, 캡처. **`data/pantry/*`·`Pantry.vue` 수정 금지** — export(`PANTRY_TAG_GROUPS`, `filterSetsByTags`, `nearestSetFor`, `findDish`, `timeTagOf`)만 쓴다.

## 화면
- 질문 3개를 한 번에 하나씩(「1/3」 표시), 각 질문은 ↑↓ + Enter:
  1. 「시간은 얼마나?」 — 시간 태그 3개(`15분 이내`·`25분 이내`·`30분 이상`) + 「상관없음」
  2. 「냉장고에 뭐가 있어?」 — 재료 태그(`PANTRY_TAG_GROUPS` ingredient, 실제 세트에 쓰인 것만 — `pantryTags()`) + 「상관없음」
  3. 「오늘은 어떤 날?」 — 때·목적 태그 중 `평일`·`주말`·`야식`·`해장`·`한잔` + 「상관없음」
- 결과: `filterSetsByTags` 로 거른 첫 세트, 0건이면 `nearestSetFor` 로 가까운 상 + 「딱 맞는 상은 없어 가까운 것」 한 줄. 보여 줄 것: 세트 제목, mood, `minutes`분 · `cost`원, 주메뉴 이름(findDish), 페어링 drink 한 줄(alt 한 줄). 쇼핑 목록·레시피 상세 없음.
- 결과 화면: Enter = 처음부터 다시, ↓ = 같은 조건의 다음 세트(있으면 「2/3」 꼴).
- Esc = 이전 질문(1번 질문에서는 환승 홀).

## 완료 조건
- [ ] 1. 키만으로 세 질문 → 결과, Esc 로 한 단계씩 되돌아간다(앞서 고른 답 유지).
- [ ] 2. 0건 조합에서도 결과가 비지 않는다(가까운 상 또는 「맞는 상이 없어요 — 조건을 하나 풀어 보세요」).
- [ ] 3. 375 가로 스크롤 0, 줄 ≥44px.
- [ ] 4. 검증: 빌드(Pages base) + `Lite.e2e.mjs`·`HallV09.e2e.mjs`·새 `LitePantry.e2e.mjs`(상관없음 3번 → 첫 세트 제목 / 특정 조합 → 해당 태그를 가진 세트) + 단위 테스트(있다면) 통과, 캡처 `docs/tickets/captures/TKT-231/` 375·1440 질문·결과. `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

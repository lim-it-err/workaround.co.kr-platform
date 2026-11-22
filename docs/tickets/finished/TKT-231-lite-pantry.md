문서 상태: 작성완료

# TKT-231 `[FE]` lite 자취 밥상 — 질문 세 개 → 한 상

- 상태: finished · **P1 · v0.9.2** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: 시안 「자취 밥상」 (PO 2026-11-22 승인). **결과는 무작위** — PO 2026-11-22 「결과는 랜덤하게 보여줘」. 시안은 메뉴 하나를 고르지만 실데이터 단위는 **한 상 세트(`PANTRY_SETS`)** 이므로 결과는 세트 하나다(PM 판단).
- 의존: TKT-228.
- scope: `frontend/src/components/lite/LitePantry.vue`(자리표시 교체), 필요하면 `frontend/src/components/lite/litePantry.js`(순수 함수) + 단위 테스트, 신규 `frontend/src/components/LitePantry.e2e.mjs`, 캡처. **`data/pantry/*`·`Pantry.vue` 수정 금지** — export(`PANTRY_TAG_GROUPS`, `filterSetsByTags`, `nearestSetFor`, `findDish`, `timeTagOf`)만 쓴다.

## 화면
- 질문 3개를 한 번에 하나씩(「1/3」 표시), 각 질문은 ↑↓ + Enter:
  1. 「시간은 얼마나?」 — 시간 태그 3개(`15분 이내`·`25분 이내`·`30분 이상`) + 「상관없음」
  2. 「냉장고에 뭐가 있어?」 — 재료 태그(`PANTRY_TAG_GROUPS` ingredient, 실제 세트에 쓰인 것만 — `pantryTags()`) + 「상관없음」
  3. 「오늘은 어떤 날?」 — 때·목적 태그 중 `평일`·`주말`·`야식`·`해장`·`한잔` + 「상관없음」
- 결과: `filterSetsByTags` 로 거른 세트 중 **무작위 하나**(`Math.random` — 고르는 함수는 난수 함수를 인자로 받아 테스트에서 고정할 수 있게), 0건이면 `nearestSetFor` 로 가까운 상 + 「딱 맞는 상은 없어 가까운 것」 한 줄. 보여 줄 것: 세트 제목, mood, `minutes`분 · `cost`원, 주메뉴 이름(findDish), 페어링 drink 한 줄(alt 한 줄). 쇼핑 목록·레시피 상세 없음.
- 결과 화면: Enter = 처음부터 다시, ↓ = 같은 조건의 **다른 세트 무작위**(방금 본 것은 후보가 남아 있는 한 다시 안 나옴, 후보 수 「후보 n개」 표시).
- Esc = 이전 질문(1번 질문에서는 환승 홀).

## 완료 조건
- [x] 1. 키만으로 세 질문 → 결과, Esc 로 한 단계씩 되돌아간다(앞서 고른 답 유지).
- [x] 2. 0건 조합에서도 결과가 비지 않는다(가까운 상 또는 「맞는 상이 없어요 — 조건을 하나 풀어 보세요」).
- [x] 3. 375 가로 스크롤 0, 줄 ≥44px.
- [x] 4. 검증: 빌드(Pages base) + `Lite.e2e.mjs`·`HallV09.e2e.mjs`·새 `LitePantry.e2e.mjs`(상관없음 3번 → `PANTRY_SETS` 중 하나의 제목 / 특정 조합 → 결과가 그 태그를 모두 가진 세트 / ↓ → 다른 제목) + 단위 테스트(있다면) 통과, 캡처 `docs/tickets/captures/TKT-231/` 375·1440 질문·결과. `git diff --check`.

## 구현 메모
- 변경: `lite/LitePantry.vue`(자리표시 교체), 신규 `lite/litePantry.js`(순수 함수: `buildQuestions`·`candidatesFor`·`pickSet(candidates, seenIds, rand)`·`describeSet`) + `litePantry.test.mjs`, 신규 `LitePantry.e2e.mjs`. `data/pantry/*`·`Pantry.vue` 무수정(export 만 사용).
- 질문 옵션: 시간 3태그, 재료는 `pantryTags()` ingredient 9개, 때·목적은 `평일·주말·야식·해장·한잔`(실제 세트에 쓰인 것만), 각 끝에 「상관없음」. 답은 태그 배열 → `filterSetsByTags`.
- 결과: 무작위 하나. 방금 본 것은 후보가 남는 한 안 나오고, 모두 보면 마지막 것만 피해 다시 돈다. 0건이면 `nearestSetFor` 의 한 상 + 「딱 맞는 상은 없어 가까운 것」(이때 ↓ 는 무반응·후보 수 숨김). 그것도 없으면 「맞는 상이 없어요 — 조건을 하나 풀어 보세요」(현 데이터에선 도달 불가, 방어용).
- 키: ↑↓ 고르기·Enter 다음(결과에서는 처음부터)·결과 ↓ 다른 상·Esc 앞 질문(1번에서는 환승 홀, 답 유지). 포인터는 한 번=선택, 같은 줄 다시=다음. ‹ 뒤로 버튼은 곧장 환승 홀.
- 스펙과 달리한 점: 결과 「후보 n개」는 정확 일치일 때만 표시. 결과 메시지 줄은 두지 않고 하단 키 안내만 바뀜. 술 줄 라벨은 「한잔」·「무알코올」(영어 간판 0).
- 확신 없는 점: 시안은 메뉴 하나(주메뉴 이름 크게)지만 여기서는 세트 제목이 주인공, 주메뉴는 보조 줄 — 세트 단위라서 그렇게 했다. 시안의 「재료와 순서는 기본 보기에서」 문구는 자기 해설이라 뺐다.

## 검증
- `lite-gate.sh LitePantry.e2e.mjs Lite.e2e.mjs HallV09.e2e.mjs`(Pages base 빌드 포함): BUILD OK, e2e pass 35 / fail 0 / skipped 2 (새 LitePantry.e2e 8건은 375·1440 각 4건: 상관없음 3번·↓·Enter 처음부터 / 25분+김치 후보 소진 / 0건 가까운 상+Esc 되돌리기+1번 Esc=환승 홀 / 레이아웃·포인터 두 번). 무작위는 Math.random 고정 + 후보 집합 단언.
- 단위: `node --test $(find src -name "*.test.mjs")` pass 56 / fail 0 (litePantry 6건 포함).
- `git diff --check` 0. 가로 overflow 0, 질문 줄 높이 ≥48px(e2e 가 44 이상 단언).
- 캡처 `docs/tickets/captures/TKT-231/pantry-{question,result}-{375,1440}.png` 직접 확인(375 결과: 제목·mood·35분 · 4,000원·주메뉴·한잔·무알코올 줄 줄바꿈 정상).


## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

- r1 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-231-r1.md`

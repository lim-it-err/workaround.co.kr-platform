문서 상태: 작성완료

# TKT-229 `[FE]` lite 여행 — 여행 목록 → 노선 한 줄 → 결산

- 상태: finished · **P1 · v0.9.2** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: 시안 `design/mockups-v0.9/lite-pages.html` 「여행」 (PO 2026-11-22 승인).
- 의존: TKT-228(need_review 이후 착수 가능).
- scope: `frontend/src/components/lite/LiteVoyage.vue`(자리표시 교체) — 필요하면 같은 폴더에 `liteVoyage.js`(순수 함수) + 단위 테스트. 신규 `frontend/src/components/LiteVoyage.e2e.mjs`. 캡처. **데이터 파일(`data/voyages/*`)·기본 여행 화면·App.vue 수정 금지** — 읽기만.

## 화면 (시안 기준, 데이터는 실데이터)
- 1단계 여행 목록: `VOYAGES`(data/voyage.js) 의 제목 · 연도(기간 시작 연). 첫 여행이 선택된 채 시작. ↑↓ 고르기, Enter 들어가기.
- 2단계 노선 한 줄: 고른 여행의 `days` 를 위에서 아래로 한 줄씩 — `DAY n · 도시(city) · 그날 기록 첫 줄`(record 첫 줄, 없으면 계획 pm/am 중 있는 것). ↑↓ 로 역을 따라 내려가면 고른 줄만 기록 2~3줄을 더 펼친다(전부 펼치지 않는다). 맨 아래 줄 = 「결산」: `settlement.grandTotal` 이 있으면 `777.1만원` 꼴(소수 1자리, 단위는 settlement.unit), 1인당, 사전 결제·현지 지출 두 줄. 결산이 없는 여행은 「결산 정리 중」.
- Esc = 한 단계 위(노선 → 목록 → 환승 홀). crumb 는 「여행 › 중부유럽 순환선」.
- 지도·사진·표·차트 없음.

## 완료 조건
- [x] 1. 위 두 단계가 키만으로 돈다. 375 폭 가로 스크롤 0, 줄 높이 ≥44px.
- [x] 2. 중부유럽 순환선 결산 줄에 `777.1만원` 이 보인다(데이터에서 계산 — 하드코딩 금지).
- [x] 3. 기록이 비어 있는 여행(아이슬란드 등)도 깨지지 않는다(빈 줄 대신 「기록 정리 중」).
- [x] 4. 검증: 빌드(Pages base) + `Lite.e2e.mjs`·`HallV09.e2e.mjs`·새 `LiteVoyage.e2e.mjs`(환승 홀 → 여행 → Enter → ↓ 여러 번 → 결산 줄에 777.1 / Esc 두 번 → 환승 홀) 통과. 캡처 `docs/tickets/captures/TKT-229/` 375·1440 목록·노선 각 1장. `git diff --check`.

## 구현 메모
- 파일: `frontend/src/components/lite/LiteVoyage.vue`(교체), `lite/liteVoyage.js`(순수 함수: 연도·DAY 줄·결산 줄), `lite/liteVoyage.test.mjs`(4건), `components/LiteVoyage.e2e.mjs`(신규). 데이터·App.vue·board.md 미수정.
- 목록 → 노선 2단계는 컴포넌트 내부 상태(주소는 `/voyage` 그대로). Esc: 노선 → 목록(고른 여행 유지) → `back` emit(환승 홀). 목록은 포인터 「한 번 선택·두 번 진입」, 노선 줄 클릭은 선택만.
- 줄 = `DAY n · 도시 · 그날 기록 첫 줄`(record, 없으면 계획 pm→am→eve 중 첫째). 선택된 줄만 다음 기록 최대 3줄 펼침, 나머지는 1줄 말줄임(375 폭은 도시 아래 줄로 내려감). 결산 줄은 우측에 `777.1만원`(`settlement.grandTotal`, 소수 1자리), 선택 시 1인당·사전 결제·현지 지출 3줄.
- 기록 없는 여행: 「기록 정리 중」 + 「결산 정리 중」 줄만.
- 스펙과 달리: 「사전 결제·현지 지출 두 줄」에 1인당까지 3줄을 펼침(스펙에 1인당 포함이라 합쳐 3줄로 해석). 결산 줄은 선택 때만 펼침(다른 줄과 같은 규칙).
- 공유 파일: 없음.

## 질문/에스컬레이션
- [PM 의문] 선택된 날의 기록 2~3줄이 375 폭에서 길게 감겨 화면 하단까지 내려간다(DAY 4 캡처). 줄당 말줄임(2행 제한)을 둘지 PM 판단 바람 — 지금은 원문 그대로 보여 준다.

## 검증
- 단위: `cd frontend && node --test $(find src -name "*.test.mjs")` → pass 56 / fail 0.
- 잠금 스크립트 `lite-gate.sh LiteVoyage.e2e.mjs Lite.e2e.mjs HallV09.e2e.mjs`(Pages base 빌드 OK + e2e) → pass 31 / fail 0 / skipped 2(기존 skip).
- `git diff --check` 무출력.
- 캡처(애니메이션 후, e2e 안에서): `docs/tickets/captures/TKT-229/voyage-{list,route,settlement}-{375,1440}.png` 6장. 375·1440 가로 넘침 0, 줄 높이 ≥44px, 영어 간판 0, 브라우저 오류·경고 0을 e2e 가 확인.

## 리뷰 기록
(PM)

- r1 반려 (2026-11-22, PM) — `docs/reviews/REV-TKT-229-r1.md` (블로커 2: 노선 줄 정렬, 결산 「■」)


### r2 재작업 (dev)
- REV-TKT-229-r1 블로커 2·중요 1 반영(각 지적 아래 `→ 반영:`). 잠금 게이트 pass 31 / fail 0 / skipped 2, `git diff --check` 무출력. 캡처 6장 재생성(`captures/TKT-229/`, 1440 노선·375 DAY 4 선택·결산).
- r2 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-229-r2.md`

문서 상태: 작성완료

# TKT-229 `[FE]` lite 여행 — 여행 목록 → 노선 한 줄 → 결산

- 상태: ready · **P1 · v0.9.2** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: 시안 `design/mockups-v0.9/lite-pages.html` 「여행」 (PO 2026-11-22 승인).
- 의존: TKT-228(need_review 이후 착수 가능).
- scope: `frontend/src/components/lite/LiteVoyage.vue`(자리표시 교체) — 필요하면 같은 폴더에 `liteVoyage.js`(순수 함수) + 단위 테스트. 신규 `frontend/src/components/LiteVoyage.e2e.mjs`. 캡처. **데이터 파일(`data/voyages/*`)·기본 여행 화면·App.vue 수정 금지** — 읽기만.

## 화면 (시안 기준, 데이터는 실데이터)
- 1단계 여행 목록: `VOYAGES`(data/voyage.js) 의 제목 · 연도(기간 시작 연). 첫 여행이 선택된 채 시작. ↑↓ 고르기, Enter 들어가기.
- 2단계 노선 한 줄: 고른 여행의 `days` 를 위에서 아래로 한 줄씩 — `DAY n · 도시(city) · 그날 기록 첫 줄`(record 첫 줄, 없으면 계획 pm/am 중 있는 것). ↑↓ 로 역을 따라 내려가면 고른 줄만 기록 2~3줄을 더 펼친다(전부 펼치지 않는다). 맨 아래 줄 = 「결산」: `settlement.grandTotal` 이 있으면 `777.1만원` 꼴(소수 1자리, 단위는 settlement.unit), 1인당, 사전 결제·현지 지출 두 줄. 결산이 없는 여행은 「결산 정리 중」.
- Esc = 한 단계 위(노선 → 목록 → 환승 홀). crumb 는 「여행 › 중부유럽 순환선」.
- 지도·사진·표·차트 없음.

## 완료 조건
- [ ] 1. 위 두 단계가 키만으로 돈다. 375 폭 가로 스크롤 0, 줄 높이 ≥44px.
- [ ] 2. 중부유럽 순환선 결산 줄에 `777.1만원` 이 보인다(데이터에서 계산 — 하드코딩 금지).
- [ ] 3. 기록이 비어 있는 여행(아이슬란드 등)도 깨지지 않는다(빈 줄 대신 「기록 정리 중」).
- [ ] 4. 검증: 빌드(Pages base) + `Lite.e2e.mjs`·`HallV09.e2e.mjs`·새 `LiteVoyage.e2e.mjs`(환승 홀 → 여행 → Enter → ↓ 여러 번 → 결산 줄에 777.1 / Esc 두 번 → 환승 홀) 통과. 캡처 `docs/tickets/captures/TKT-229/` 375·1440 목록·노선 각 1장. `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

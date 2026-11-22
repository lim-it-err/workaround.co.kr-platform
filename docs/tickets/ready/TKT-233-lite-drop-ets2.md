문서 상태: 작성완료

# TKT-233 `[FE]` lite 에서 유로트럭 빼기

- 상태: ready · **P1 · v0.9.2** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: PO 2026-11-22 「유로트럭은 lite에 맞지 않아. 빼.」 (D-038 개정, TKT-230 폐기).
- scope: `frontend/src/data/hallBoard.js` 의 **`HALL_LITE_ITEMS` 만**, `frontend/src/components/lite/index.js`(ets2 항목 삭제), `frontend/src/components/lite/LiteEts2.vue` 삭제, `frontend/src/components/Lite.e2e.mjs`, `frontend/src/components/HallV09.e2e.mjs`(lite 단언 중 유로트럭·항목 수에 묶인 부분만). `LiteVoyage.vue`·`LitePantry.vue`·`LiteWork.vue` 와 그 e2e 는 다른 티켓이 동시에 고치므로 **손대지 말 것**.

## 완료 조건
- [ ] 1. lite 환승 홀 항목 = 여행·자취 밥상·운영 노트 3개.
- [ ] 2. lite 에서 `/ets2`(유로트럭)로 가면 기본 유로트럭 화면 그대로(Advisor·격납고와 같은 취급).
- [ ] 3. 기존 e2e 의 「↓ Enter → 유로트럭」 류 단언은 새 목록에 맞게 바꾼다(예: ↓ Enter → 자취 밥상). lite 에서 ets2 경로 = 기본 화면 단언 추가.
- [ ] 4. 검증: 빌드(Pages base) + `HallV09.e2e.mjs`·`Lite.e2e.mjs` 통과, `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

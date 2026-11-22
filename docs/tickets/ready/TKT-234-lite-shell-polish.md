문서 상태: 작성완료

# TKT-234 `[FE]` lite 틀 손질 — 375 윗줄 · 선택 줄 배지 · 낡은 주석

- 상태: ready · **P2 · v0.9.2** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: REV-TKT-231-r1 `[중요]`, REV-TKT-232-r1 `[중요]`, REV-TKT-233-r1 `[제안]`.
- 의존: TKT-229 finished 후(같은 화면 캡처를 다시 찍으므로).
- scope: `frontend/src/components/lite/LiteScreen.vue`, `frontend/src/components/lite/LiteWork.vue`(배지 색만), `frontend/src/components/lite/LiteVoyage.vue`(펼친 기록 들여쓰기만), `frontend/src/data/hallBoard.js`(HALL_LITE_ITEMS 위 주석 한 줄만), `frontend/src/components/Lite.e2e.mjs`(단언 추가), 캡처.

## 완료 조건
- [ ] 1. 375 폭에서 lite 틀 윗줄이 한 줄을 유지한다: 「workaround lite」 는 560px 미만에서 숨기고, crumb 는 한 줄 말줄임. 「‹ 뒤로」는 항상 같은 줄 오른쪽. 자취 밥상 결과(crumb 「자취 밥상 › 오늘」)·여행 노선(「여행 › 중부유럽 순환선」)에서 확인.
- [ ] 2. 운영 노트 목차의 선택 줄에서도 상태 배지가 보인다(반전 색 — 선택 줄 글자색으로 테두리·글자).
- [ ] 2-1. 여행 노선의 펼친 기록 모든 줄이 요약과 같은 열에서 시작한다(375·1440, REV-TKT-229-r2 [중요]).
- [ ] 3. `hallBoard.js` 「역 이름 6개만」 주석 → 지금 항목 수와 맞게.
- [ ] 4. 검증: 잠금 게이트로 빌드 + `Lite.e2e.mjs`(375 에서 뒤로 버튼과 crumb 의 top 이 같음 단언 추가)·`HallV09`·`LiteVoyage`·`LitePantry`·`LiteWork` e2e 통과. 캡처 `captures/TKT-234/` 375 자취 밥상 결과·여행 노선·운영 노트 목차.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

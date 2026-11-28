문서 상태: 작성완료

# TKT-246 `[FE]` Advisor 「온라인 채점 결과」 카드 — lab 브랜치의 result.json 읽기

- 상태: ready · **P2 · v0.9.5** · 담당: dev 서브에이전트(Sonnet) · 의존: TKT-243(같은 MissionPage — 그 뒤 순서), TKT-245(result.json 형식) · 브랜치 `codex/v0.9.5`.
- 근거: D-042 「github.io 가 결과를 읽는다」.
- scope (`services/advisor/frontend/` 아래): `src/modules/missions/store/labResult.js`(+ vitest), `src/modules/missions/components/LabResultCard.vue`, `MissionPage.vue`(카드 자리만), e2e 1개.

## 완료 조건
- [ ] 1. `fetchLabResult(missionId)` → `https://raw.githubusercontent.com/lim-it-err/workaround.co.kr-platform/lab/<id>/labs/advisor/<id>/.grade/result.json` (+ 같은 경로 `review.md`). 404·네트워크 오류·JSON 이상이면 `null`(조용히). 타임아웃 3초. 저장소 주소는 상수 한 곳.
- [ ] 2. 카드는 결과가 있을 때만 받기 줄(TKT-243) 바로 아래에: 「☁ 온라인 채점 · <passed>/<tests> 통과 · <gradedAt 상대시간> · 커밋 <앞 7자>」, 실패 케이스 최대 5개(이름 + message 한 줄), 컴파일 실패면 「컴파일 실패」 + buildTail 접기. review.md 가 있으면 「Claude 리뷰 보기」 접기(마크다운은 텍스트로 — `v-html` 금지).
- [ ] 3. 「다시 불러오기」 버튼(raw 캐시 때문에 `?t=` 쿼리). 로컬(localhost)에서도 같은 동작 — 이건 공개 GitHub 주소라 TKT-239 가드와 무관.
- [ ] 4. 검증: vitest(정상·404·이상 JSON·타임아웃), playwright — `page.route` 로 raw 주소를 가짜 result 로 응답 → 카드 렌더, 404 → 카드 없음. advisor `npx playwright test` 전체, vite build, `git diff --check`. 캡처 375·1440 `docs/tickets/captures/TKT-246/`.

## 구현 메모

## 질문/에스컬레이션

## 리뷰 기록

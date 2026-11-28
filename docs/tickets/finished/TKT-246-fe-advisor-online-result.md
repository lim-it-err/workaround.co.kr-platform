문서 상태: 작성완료

# TKT-246 `[FE]` Advisor 「온라인 채점 결과」 카드 — lab 브랜치의 result.json 읽기

- 상태: finished · **P2 · v0.9.5** · 담당: dev 서브에이전트(Sonnet) · 의존: TKT-243(같은 MissionPage — 그 뒤 순서), TKT-245(result.json 형식) · 브랜치 `codex/v0.9.5`.
- 근거: D-042 「github.io 가 결과를 읽는다」.
- scope (`services/advisor/frontend/` 아래): `src/modules/missions/store/labResult.js`(+ vitest), `src/modules/missions/components/LabResultCard.vue`, `MissionPage.vue`(카드 자리만), e2e 1개.

## 완료 조건
- [x] 1. `fetchLabResult(missionId)` → `https://raw.githubusercontent.com/lim-it-err/workaround.co.kr-platform/lab/<id>/labs/advisor/<id>/.grade/result.json` (+ 같은 경로 `review.md`). 404·네트워크 오류·JSON 이상이면 `null`(조용히). 타임아웃 3초. 저장소 주소는 상수 한 곳.
- [x] 2. 카드는 결과가 있을 때만 받기 줄(TKT-243) 바로 아래에: 「☁ 온라인 채점 · <passed>/<tests> 통과 · <gradedAt 상대시간> · 커밋 <앞 7자>」, 실패 케이스 최대 5개(이름 + message 한 줄), 컴파일 실패면 「컴파일 실패」 + buildTail 접기. review.md 가 있으면 「Claude 리뷰 보기」 접기(마크다운은 텍스트로 — `v-html` 금지).
- [x] 3. 「다시 불러오기」 버튼(raw 캐시 때문에 `?t=` 쿼리). 로컬(localhost)에서도 같은 동작 — 이건 공개 GitHub 주소라 TKT-239 가드와 무관.
- [x] 4. 검증: vitest(정상·404·이상 JSON·타임아웃), playwright — `page.route` 로 raw 주소를 가짜 result 로 응답 → 카드 렌더, 404 → 카드 없음. advisor `npx playwright test` 전체, vite build, `git diff --check`. 캡처 375·1440 `docs/tickets/captures/TKT-246/`.

## 구현 내역
- `store/labResult.js`: `LAB_REPO` 상수 한 곳, `fetchLabResult(id,{bust})` → `{result, review}|null`. result.json·review.md 병렬, 각 3초 AbortController, 404·네트워크·이상 JSON·형식 불일치(`compiled:false` 이거나 tests·passed 숫자) 는 null. review 만 없으면 result 만. `relativeTime` 도 같은 파일. bust 는 `?t=`.
- `components/LabResultCard.vue`: 결과 있을 때만 렌더. 「☁ 온라인 채점 · 4/6 통과 · 5분 전 · 커밋 0123456」(컴파일 실패면 「컴파일 실패」), 실패 케이스 최대 5개(이름 + message 첫 줄), 컴파일 실패 시 buildTail 접기, review.md 는 `<pre>` 텍스트(v-html 없음)로 「Claude 리뷰 보기」 접기. 「다시 불러오기」는 실패해도 기존 결과 유지.
- `MissionPage.vue`: 받기 줄 바로 아래 `<LabResultCard :mission-id>` 한 줄(공유 파일, TKT-243 과 동일 파일).
- e2e `e2e/lab-result-card.spec.ts`: `page.route` 로 raw 주소 모킹 — 렌더·실패 케이스·리뷰 텍스트·`?t=` 재요청·404 카드 없음·컴파일 실패.
- 부수 수정(scope 밖 e2e): PM 이 sampleContent 에 s1-wine-01 starterTests 를 추가해 `mission-code-transfer.spec.ts` 의 「코드 전체 받기」 테스트가 단일 버튼 가정으로 깨져, 하드 받기로 대체 분기(`-hard.zip`)를 추가.

## 검증
- vitest: 140 중 139 통과(신규 labResult 정상·review 없음·bust·404·네트워크·이상 JSON·컴파일 실패·타임아웃·relativeTime 포함), 실패 1건은 알려진 `platformTheme.spec.js`.
- `npx playwright test`: 78 passed. `vite build --base=/workaround.co.kr-platform/advisor/` 성공. `git diff --check` 깨끗.
- 캡처 `docs/tickets/captures/TKT-246/result-{375,1440}.png` 직접 확인 — 375: 요약 한 줄이 빨강(일부 실패), 다시 불러오기 전폭 버튼, 실패 2건, 리뷰 펼침. 가로 overflow 0(e2e 단언). 다른 티켓 기존 캡처 변경 없음(git diff 확인).


## 질문/에스컬레이션
- [구체화 질문] 실제 result.json(TKT-245)은 아직 없어 형식은 티켓 문구 기준 가정(cases[].status 가 passed 가 아니면 실패로 취급). 245 구현의 status 값(failed/error 등)과 맞는지 확인 바람.

## 리뷰 기록
- r1 통과 (2026-11-28, PM) — `docs/reviews/REV-TKT-246-r1.md`

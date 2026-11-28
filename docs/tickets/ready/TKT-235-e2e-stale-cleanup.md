문서 상태: 작성완료

# TKT-235 `[QA]` 낡은 e2e 17건 정리 — 전체 e2e 그린 복구

- 상태: ready · **P1 · v0.9.3** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.3`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: REV-TKT-234-r1 `[중요]` — 전체 e2e 순차 실행 시 17건 실패, `main`(61241bd·4b40c18)에서도 동일. 지금은 「전 e2e 그린」을 릴리스 게이트로 못 쓴다.
- scope: `frontend/src/components/SimTone.e2e.mjs`, `frontend/src/components/ToneTools.e2e.mjs`, `frontend/src/components/VoyageAdvisorTransfer.e2e.mjs`, 필요하면 `frontend/src/e2eContext.mjs`. **프로덕션 코드(.vue·.js·css) 수정 금지** — 테스트가 맞고 화면이 틀렸다고 판단되면 고치지 말고 `## 질문/에스컬레이션` 에 근거(스크린샷·DOM)를 적는다.

## 실패 17건 (순차 실행, Pages base 빌드)
- 엘리베이터·택시 「캔버스와 시각표 행」(375 dark·1440 light), 「무인 30초 동안 엘리베이터와 택시 화면이 모두 변한다」
- 격납고 「한 히어로와 세 시뮬레이션 행」, Work 「검토 히어로 뒤에 기능 보드」, Runtime 「경고 히어로와 상태 행」(각 375 dark·1440 light)
- 「전 정적 경로의 렌더 영어 대문자 간판은 0건」(375 dark·1440 light)
- Runtime 「배포 레일은 면 없는 번호 행」(375 light·1440 dark)
- 「벨베데레와 Advisor 미션을 왕복한다」(375 dark·1440 light)
- 재현: `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` → `NODE_PATH=/Users/imjeonghan/newProject/workaround.co.kr-platform/services/advisor/frontend/node_modules node --test --test-concurrency=1 frontend/src/components/*.e2e.mjs`

## 판단 기준 (PM)
- 라이트 테마는 TKT-218(D-036)에서 없앴다 → 「light」 변형은 같은 단언의 dark 판과 중복이면 삭제, 아니면 dark 로 바꾼다.
- v0.9(D-035 보완·D-036)로 화면 구조가 바뀐 단언(히어로·행 개수 등) → 지금 화면의 의도(정보 위계·가독성)를 지키는 단언으로 다시 쓴다. 단순히 셀렉터를 맞추느라 의미를 버리지 말 것.
- 정적 모드에서 원래 열리지 않는 화면(Advisor 등)을 기다리다 타임아웃 → 정적 모드 기대 동작(안내 표시)으로 단언하거나, 정적 모드에서 skip 하고 이유를 주석.
- 「영어 대문자 간판 0건」은 살아 있는 원칙 — 실제 간판이 나오면 테스트를 약화하지 말고 에스컬레이션.
- 삭제하는 테스트는 구현 메모에 「테스트명 — 삭제 이유」 한 줄씩.

## 완료 조건
- [ ] 1. 위 재현 명령으로 전체 e2e fail 0.
- [ ] 2. 17건 각각의 처리(수정/삭제/skip/에스컬레이션)와 이유가 구현 메모 표에 있다.
- [ ] 3. 같은 명령을 두 번 돌려도 그린(타이밍 의존 없음 — 무인 30초 테스트 포함).
- [ ] 4. unit 전부, `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

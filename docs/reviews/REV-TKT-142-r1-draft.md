문서 상태: 작성완료

# REV-TKT-142-r1-draft — Advisor 배우기 첫 화면 축약 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-142([PM 의문] 5 승인). 의존 TKT-129 finished 확인.

## 요약 권고: **통과 (블로커 0)**

## 실행 검증

- `pwd`/branch(`codex/v0.7.0-tone`) 확인. `git diff --stat`로 scope 확인: `LearnPage.vue`(64줄)·`learn-index.spec.ts`(42줄)·`advisor-surfaces.spec.ts`(2줄)·`core-flows.spec.ts`(3줄) — `learnCatalog.js`는 손대지 않음(티켓이 "필요 시"라 해뒀는데 실제로 불필요했던 것으로 판단, 콘텐츠 불가침 3파일도 무수정 확인).
- Advisor `npx vitest run` — **81/81 통과**(14 files). `npm run build`(root)/`--base=/workaround.co.kr-platform/advisor/`(Pages-base) — **각 110 modules 통과**.
- Advisor 전체 `npx playwright test`(전체 spec) — **48/48 통과**. 티켓이 지목한 3경로(`learn-index.spec.ts`의 신규 테스트 3개: 첫 화면 축약+높이, 필터 선택→통합 목록→초기화 복귀, 전체 보기→181개 30개씩) 전부 포함.

## 완료 조건 대조 — 수치 주장 직접 재현

1. **375 첫 화면 스크롤 길이 현행 대비 1/3 이하, 목록 0개** — `learn-index.spec.ts`의 신규 테스트를 코드 레벨로 직접 읽고 대조했다: `expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(Math.floor(4999 / 3))` — **실제 DOM `scrollHeight`를 매 실행마다 라이브로 측정**하는 진짜 회귀 가드다(하드코딩된 성공값이 아니다). 같은 테스트에서 `[data-content-index]` count 0, `[data-course-preview]` count 2, `.index-row` count 2, 필터 select 4개 존재를 함께 단언 — 이 5개 단언을 포함한 서브테스트가 실행에서 통과했으므로 "375에서 코스 2행+목록 0개+스크롤 1/3 이하"가 형식이 아니라 실측으로 성립함을 확인했다.
2. **필터 선택·전체 보기·해시 딥링크 3경로 E2E, 129 그린** — `learn-index.spec.ts` 신규 테스트 2개(필터→목록→초기화 복귀, 전체 보기→181개 30개씩)와 기존 `/games` 별칭·마지막 연습 이어서 테스트(해시 딥링크 계열, 129 계약)가 모두 48/48 안에서 통과.

## [반박] 처리에 대한 적대적 검토 — 자기기만 아님

티켓의 [반박]은 "기존 `core-flows.spec.ts`/`advisor-surfaces.spec.ts`가 `/learn` 진입 즉시 목록이 보인다는 전제를 쓰고 있어 새 계약과 충돌한다"는 내용이었다. `git diff`로 실제 수정을 직접 대조했다:

- `core-flows.spec.ts`의 `beforeEach`: 기존엔 `[data-content-index]` 가시성만 기다렸는데, 이제 `전체 181개 보기` 버튼 가시성을 먼저 기다리고 로컬스토리지 초기화·새로고침 후 **그 버튼을 명시적으로 클릭**한 다음에야 `[data-content-index]`를 기다린다.
- `advisor-surfaces.spec.ts`: 미션 링크 클릭 전에 `전체 181개 보기` 클릭을 두 곳에 추가.

두 변경 모두 **테스트가 검증하려던 원래 동작(초안 복원, 표면 전환)은 그대로 남기고, 새로 승인된 "첫 화면은 목록을 감춘다" 계약에 맞게 진입 경로만 한 클릭 추가**한 것이다. 어서션을 느슨하게 하거나 삭제해서 통과시킨 흔적은 없다 — [반박]에 적힌 "제품 범위는 확장하지 않는다"는 진술과 일치하는 최소 수정으로 판단했다.

## 상태 제안 (판정은 PM)

블로커 0. **finished 전환 권장.**

문서 상태: 작성완료

# TKT-176 `[FE]` E2E 시간대 고정 — Playwright `timezoneId` 못 박기(Advisor 설정 + 메인 E2E 컨텍스트), 고정 시각 리터럴 정리

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-165 finished. 브랜치: 인박스 브랜치 안내. 제품 코드 무변경(테스트·설정만). **[반박] 의무.**
- 근거: PO 2026-09-28 "어 그렇게 해". `final-ux-b1-i1.spec.ts` 의 `+02:00` 고정 시각이 유럽 체류 중 작성돼 한국 TZ 에서 점심 슬롯으로 밀려 깨짐(REV: history 09-28). 기계 TZ 에 따라 결과가 바뀌는 테스트는 릴리스 게이트를 흔든다.
- scope: `services/advisor/frontend/playwright.config.js`(`use.timezoneId: 'Asia/Seoul'`, `locale: 'ko-KR'`), `services/advisor/frontend/e2e/*.spec.ts`(고정 시각 리터럴을 오프셋 없는 로컬 표기 또는 `+09:00` 으로 통일), `frontend/src/**/*.e2e.mjs`(`browser.newContext({ timezoneId: 'Asia/Seoul', locale: 'ko-KR' })` 공통 헬퍼), `frontend/scripts/e2e-isolated-preview.mjs` 필요 시.

## 완료 조건
1. [ ] `TZ=Europe/Prague npx playwright test` 와 `TZ=Asia/Seoul …` 결과가 동일(61+/61+), 메인 E2E 도 두 TZ 에서 동일(62+/62+) — 실행 기록 첨부.
2. [ ] 고정 시각 리터럴 목록과 의도한 슬롯(출근길/점심/저녁)을 spec 상단 주석 한 줄로.
3. [ ] 제품 코드 diff 0.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

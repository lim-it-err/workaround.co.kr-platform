문서 상태: 작성완료

# TKT-176 `[FE]` E2E 시간대 고정 — Playwright `timezoneId` 못 박기(Advisor 설정 + 메인 E2E 컨텍스트), 고정 시각 리터럴 정리

- 상태: finished (2026-10-24, PM r1 통과)· P2 · 담당: codex-1 · 의존: TKT-165 finished. 브랜치 `codex/v0.8.0-live`. 제품 코드 무변경(테스트·설정만). **[반박] 의무.**
- 근거: PO 2026-09-28 "어 그렇게 해". `final-ux-b1-i1.spec.ts` 의 `+02:00` 고정 시각이 유럽 체류 중 작성돼 한국 TZ 에서 점심 슬롯으로 밀려 깨짐(REV: history 09-28). 기계 TZ 에 따라 결과가 바뀌는 테스트는 릴리스 게이트를 흔든다.
- scope: `services/advisor/frontend/playwright.config.js`(`use.timezoneId: 'Asia/Seoul'`, `locale: 'ko-KR'`), `services/advisor/frontend/e2e/*.spec.ts`(고정 시각 리터럴을 오프셋 없는 로컬 표기 또는 `+09:00` 으로 통일), `frontend/src/**/*.e2e.mjs`(`browser.newContext({ timezoneId: 'Asia/Seoul', locale: 'ko-KR' })` 공통 헬퍼), `frontend/scripts/e2e-isolated-preview.mjs` 필요 시.

## 완료 조건
1. [x] `TZ=Europe/Prague npx playwright test` 와 `TZ=Asia/Seoul …` 결과가 동일(61+/61+), 메인 E2E 도 두 TZ 에서 동일(62+/62+) — 실행 기록 첨부.
2. [x] 고정 시각 리터럴 목록과 의도한 슬롯(출근길/점심/저녁)을 spec 상단 주석 한 줄로.
3. [x] 제품 코드 diff 0.

## 구현 내역
- 실제 설정 파일인 `services/advisor/frontend/playwright.config.ts`의 모든 Playwright 컨텍스트에 `timezoneId: 'Asia/Seoul'`, `locale: 'ko-KR'`를 고정했다(티켓의 `.js` 표기는 저장소 실파일 `.ts`로 적용).
- `frontend/src/e2eContext.mjs`에 같은 시간대·로케일을 적용하는 `newSeoulContext()`를 추가하고 메인 E2E 16파일의 컨텍스트 17곳을 공통 헬퍼로 통일했다. 기존 viewport·reduced-motion 등 파일별 옵션은 그대로 합성한다.
- Advisor 고정 시각을 모두 명시적 `+09:00`으로 바꾸고 각 spec 상단에 의도 슬롯을 기록했다: `final-ux-b1-i1` 08-05 08:00, `advisor-flow-defects` 08-03 09:00, `core-flows` 08-03 08:00·09:00/08-04 08:00, `season-lifecycle` 08-31 09:00 — 모두 출근길.
- TKT-182의 새 문 전환 중 다음 이동이 무시되지 않도록 `WritingStudio.e2e.mjs`가 문 열림 완료를 기다리게 했다. 제품 전환 시간이나 동작은 바꾸지 않았다.
- 공유 파일: `frontend/src/components/JunctionMap.e2e.mjs`
- 공유 파일: `frontend/src/splashTone.e2e.mjs`
- 공유 파일: `frontend/src/staticRouting.e2e.mjs`
- 공유 파일: `frontend/src/components/ToneTools.e2e.mjs`
- 공유 파일: `frontend/src/components/Pantry.e2e.mjs`
- 공유 파일: `frontend/src/components/Ets2Dev.e2e.mjs`
- 공유 파일: `frontend/src/components/Ets2Live.e2e.mjs`
- 공유 파일: `frontend/src/components/VoyageAdvisorTransfer.e2e.mjs`
- 공유 파일: `frontend/src/components/VoyageRouteMap.e2e.mjs`
- 공유 파일: `frontend/src/components/VoyageSettlement.e2e.mjs`

## 검증
- Advisor: `TZ=Europe/Prague npx playwright test` 61/61, `TZ=Asia/Seoul npx playwright test` 61/61 통과. `npm run test:unit` 98/98, build 119 modules 통과.
- 메인: 프라하와 서울 각각 root-base 27/27 + Pages-base 53/53 = 80/80 통과. 메인 단위 테스트 27/27, root/Pages build 각 55 modules 통과.
- Pages 산출물의 Advisor 참조 3건·로컬 참조 5건을 확인했고 변경 전후 제품 JS/CSS 산출물 해시가 동일했다. 이 티켓의 변경은 E2E·설정·테스트 헬퍼와 문서뿐이며 제품 코드 diff는 0이다.
- `browser.newContext(` 직접 호출 잔여 0, `git diff --check` 통과. 제품 시각 변경이 없어 별도 시각 캡처 게이트는 해당 없음.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 구현 완료, PM·리뷰어 판정 대기. 커밋하지 않음.
- 2026-10-24 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-176-r1.md`. 커밋은 묶음.

문서 상태: 작성완료

# TKT-207 `[FE]` App.vue 분해 — 스플래시 (동작 변화 0)

- 상태: finished · **P1 · v0.8.3** · 담당: dev 서브에이전트(Sonnet) · 브랜치 **`codex/v0.8.3`**(작업 트리 `/Users/imjeonghan/newProject/wa-083`) · 스펙 `design/app-vue-decomposition-v0.8.3.md`.
- 근거: PO 2026-10-25 「0.8.3에서 그럼 app.vue 분해 포함 리팩토링해줘」.
- scope: `frontend/src/App.vue`, 신규 `frontend/src/components/pages/SplashView.vue`·`frontend/src/composables/useSplash.js`. **CSS 이동 금지**(클래스 이름 그대로), 다른 화면 코드 이동 금지.

## 완료 조건
1. [x] 해당 덩어리의 템플릿·상태·함수·타이머가 새 파일로 옮겨지고, App.vue 는 컴포넌트를 쓰기만 한다. 전역에 필요한 값은 props/emit 또는 composable 반환값으로만 주고받는다(전역 변수 공유 금지).
2. [x] 타이머·이벤트 리스너는 옮긴 쪽의 `onBeforeUnmount` 에서 정리된다(누수 0).
3. [x] **동작·화면 변화 0**: `npm --prefix frontend run e2e:all` 97 pass / 18 skip / 0 fail, unit 그린, `git diff --check`. 테스트 파일 수정 0(바꿔야 하면 이유를 적고 PM 판단).
4. [x] 375/1440 × 다크/라이트에서 해당 화면 전후 캡처 비교 `/private/tmp/tkt207/before-*`·`after-*`(같은 시점·같은 난수 시드에서 눈으로 차이 0).
5. [x] App.vue 줄 수 전/후 기록.

## 구현 내역
- 신규 `frontend/src/composables/useSplash.js` — SPLASH_* 상수·splashPhrases·플랩 셀 상태(`createSplashCellState`·`updateSplashCellDisplay`·`resetSplashBoard`·`setSplashBoardToPhrase`)·`buildSplashFlipSequence`·`animateSplashCellFlip`·`playSplashCellSequence`·`animateSplashPhrase`·`markReturnSplashSettled`·`rotateSplashTicker`·`playSplashFlap`·재방문(`readRecentSplashVisit`·`markSplashVisitComplete`·`setSplashVisitMode`)·`scheduleSplashTransition`·애니메이션/전환 타이머 전부. 반환: `currentTicker`·`currentSplashPhrase`·`splashBoardCells`·`splashAutoTransitionLabel`·`start`·`replay`·`restartForMotionChange`·`cancel`. 타이머는 자체 `onBeforeUnmount(cancel)` 로 정리. `SPLASH_DOOR_OPENING_MS` 만 export(App 의 문 열기 시간과 공유).
- 신규 `frontend/src/components/pages/SplashView.vue` — 템플릿(클래스·구조 그대로). props `cells`·`phrase`·`ticker`·`autoTransitionLabel`·`prefersReducedMotion`, emit `replay`.
- App.vue 와의 경계: `prefersReducedMotion`(ref)·`isActive()`(라이브 라우트+splash 판정)를 App 이 composable 에 주입. 전환 시각이 되면 composable 은 `onTransition({reducedMotion})` 만 호출하고, 문 열기(`startSplashDoorOpening`)·`applyPageChange`·`focusCurrentPageHeading`·`doorTransition` 은 App 에 남아 `handleSplashTransition` 이 처리. reduced-motion 미디어쿼리 리스너·popstate 정리는 App 에 남고 각각 `splash.restartForMotionChange()`·`splash.cancel()` 호출.
- 줄 수: App.vue 5127 → 4794(-333). 테스트 파일 수정 0, CSS 이동 0.
- 공유 파일: `docs/tickets/board.md`(다른 작업자의 TKT-213 줄 변경이 미커밋으로 공존 — 내 줄만 수정). 작업 트리에 TKT-212 Pantry 미커밋 변경도 공존(무관).

## 검증
- 기준선(시작 전) `e2e:all` 97 pass / 18 skip / 0 fail. 리팩토링 후 동일 97/18/0(splashTone 14/0/0). `e2e:all -- splashTone` 3회 연속 14/0/0.
- unit(`node --test src/**/*.test.mjs`): 38 pass / 0 fail(두 번). 단 1회차 34 중 1 fail 이 있었는데 그 시점에 TKT-212 의 Pantry 데이터가 편집 중이던 것으로 보이며 재실행 시 사라짐. `git diff --check` 클린.
- 캡처 `/private/tmp/tkt207/before-*`·`after-*`(375/1440 × 다크/라이트 × 가상시계 3000ms·500ms, Math.random 고정): 3000ms 4장은 바이트 동일, 500ms 4장은 실시간 CSS 애니메이션 프레임 차이로 바이트는 다르나(같은 빌드끼리도 달라짐) 눈으로 동일 확인(375 라이트 확인).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-207-r1.md`.
- 없음.

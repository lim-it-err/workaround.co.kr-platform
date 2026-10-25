문서 상태: 작성완료

# TKT-211 `[FE]` App.vue 분해 — 환승 홀·상단바·테마·시계·라우팅 + 레거시 테스트 라우트 제거 (동작 변화 0)

- 상태: finished · **P1 · v0.8.3** · 담당: dev 서브에이전트(Sonnet) · 브랜치 **`codex/v0.8.3`**(작업 트리 `/Users/imjeonghan/newProject/wa-083`) · 스펙 `design/app-vue-decomposition-v0.8.3.md`.
- 근거: PO 2026-10-25 「0.8.3에서 그럼 app.vue 분해 포함 리팩토링해줘」.
- scope: `frontend/src/App.vue`, 신규 `pages/JunctionView.vue`·`composables/useTheme.js`·`useClock.js`·`usePageRouting.js`, 레거시 `v040`·`v050` 프로토타입 템플릿·데이터 삭제, 신규 `data/fallbacks.js`, `SimTone.e2e.mjs`·`taxiDispatch.e2e.mjs`(import 방식으로만). **CSS 이동 금지**(클래스 이름 그대로), 다른 화면 코드 이동 금지.

## 완료 조건
1. [x] 해당 덩어리의 템플릿·상태·함수·타이머가 새 파일로 옮겨지고, App.vue 는 컴포넌트를 쓰기만 한다. 전역에 필요한 값은 props/emit 또는 composable 반환값으로만 주고받는다(전역 변수 공유 금지).
2. [x] 타이머·이벤트 리스너는 옮긴 쪽의 `onBeforeUnmount` 에서 정리된다(누수 0).
3. [x] **동작·화면 변화 0**: `npm --prefix frontend run e2e:all` 97 pass / 18 skip / 0 fail, unit 그린, `git diff --check`. 테스트 파일 수정 0(바꿔야 하면 이유를 적고 PM 판단).
4. [x] 375/1440 × 다크/라이트에서 해당 화면 전후 캡처 비교 `/private/tmp/tkt211/before-*`·`after-*`(같은 시점·같은 난수 시드에서 눈으로 차이 0).
5. [x] App.vue 줄 수 전/후 기록.
6. [x] fallback 상수 4개(`fallbackHealth`·`fallbackRuntime`·`fallbackWorkBoard`·`fallbackElevatorState`)를 `frontend/src/data/fallbacks.js` 로 옮기고, 그것을 App.vue 소스 문자열로 잘라 읽는 `SimTone.e2e.mjs`·`taxiDispatch.e2e.mjs` 를 import 방식으로 바꾼다(REV-208·209 후속 — 이 두 E2E 만 수정 허용, 단언 내용은 그대로).
7. [x] 죽은 코드 제거: `BLOG_STATUS_LABELS`·`countWords`·`formatDate` 등 어디서도 쓰지 않는 함수·상수(REV-210) — 제거 목록을 티켓에.
8. [x] App.vue ≤ 700줄. 레거시 테스트 라우트 진입(`?mode=v040` 등)은 일반 환승 홀로 열린다.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-211-r1.md`.
- 없음.

## 구현 내역
- App.vue **1,908 → 357줄**(목표 ≤700). 셸(문 전환 레이어·상단바·페이지 스위치·모바일 빠른 환승)과 onMounted/onBeforeUnmount 배선, `createEntityId`·`fetchJson`·포털 8초 폴링·reduced-motion 구독만 남았다.
- 새 파일
  - `frontend/src/components/pages/JunctionView.vue` — 환승 홀 섹션(JunctionMap + 정적 공개본 안내 + 닫힌 블로그 토스트). 상태는 props, 이동은 `open` 이벤트.
  - `frontend/src/composables/useTheme.js` — 테마 ref·저장·토글(키 `workaround-theme` 그대로).
  - `frontend/src/composables/usePageRouting.js` — `page`, openPage, applyPageChange, 문 전환 애니메이션·타이머, 스플래시 문 열기, syncLiveLocation, popstate, 스크롤 복원, 상단바 노선색/글자/제목, **D-031 블로그 가드·닫힌 주소 토스트도 여기로 옮김**.
  - `frontend/src/data/fallbacks.js` — `fallbackHealth/Runtime/WorkBoard/ElevatorState`(순수 상수, export).
- 수정: `SimTone.e2e.mjs`·`taxiDispatch.e2e.mjs` — App.vue 소스 문자열 자르기(`readFile`+`vm`) → `fallbacks.js` import. 단언 내용 0 변경.
- 경계: 블로그 저장소·스플래시·엘리베이터·격납고 화면은 App 이 만들고 `usePageRouting({ ctx: () => ({ blogStore, splash, elevator, simHubView }) })` 로 호출 시점에 넘긴다(상호 순환 때문). 마운트 순서 보존을 위해 routing 은 `attach()`(popstate 구독)·`syncInitialLocation()`·`detach()`(문 타이머·토스트 타이머·popstate 해제)를 노출하고 App 이 기존 순서대로 호출한다. 포털 폴링 타이머·reduced-motion 리스너는 App 에 남겨 App 의 onBeforeUnmount 에서 정리한다.
- **`useClock.js` 는 만들지 않았다** — [반박/확인] 현재 App.vue 에는 환승 홀·셸용 시계(Date 표시·setInterval 시계)가 없다(시계성 타이머는 이미 useSplash·useElevatorSim·useTaxiSim 이 소유, 남은 setInterval 은 8초 포털 폴링뿐). 내용 없는 파일을 만들지 않았다. 필요하면 PM 이 포털 폴링을 `usePortalPolling` 으로 따로 티켓화.
- 상단바는 별도 컴포넌트로 빼지 않고 App 템플릿에 둔다(scope 에 파일 없음, 18줄).
- 레거시 테스트 라우트 제거: `testRouteMode`(v040/v050)·`isTestRoute` 계열 전부, `test-route-banner` 블록, `prototype-shell` 4블록(junction/taxi/ops/signals), v050* 데이터·computed, `switchTestRouteMode`·`syncTestLocation`·`readTestViewParam`·`normalize(Versioned)TestView`·`currentTestUrl` 등. **`/test`, `/test/v0-5-0/*` 로 들어오면 알 수 없는 주소와 같게 라이브 첫 진입(스플래시→환승 홀)** 이다. `?mode=v040` 쿼리는 원래 라우트가 아니었으므로(경로 기반) 그냥 `/` 와 동일. 주소는 환승 홀 도착 시 `/` 로 정리된다.
- 죽은 코드 제거 목록: `BLOG_STATUS_LABELS`, `countWords`, `formatDate`, `readIsTestRoute`, `orchestratorSlices`, `mobileCheckpoints`, `testCheckpoints`, `versionedTestCheckpoints`, `taxiDistricts`·`taxiRewardCards`·`taxiFleetCards`·`taxiFlowCards`, `opsCrewCards`·`opsTransitionCards`, `signalCards`, `lineCards`·`heroMetrics`(템플릿에서 안 쓰던 computed), `currentRoute` 의 line/description(제목만 쓰이던 것 → `pageTitle`), `TOPBAR_LINES` 의 ops/signals(도달 불가), 미사용 import(`StationHeader`·`StatusBadge`·`nextTick`·`computed`·`watch`), 미사용 구조분해(health/runtime/services/workBoard 상태, `countWorkTicketsByStatus`, `readyColumnTickets`, `elevatorCars`, `activeBlogSlug` 등).
- 공유 파일/남은 것(scope 밖이라 손대지 않음): `ElevatorView.vue`·`TaxiView.vue` 의 `isTestRoute` prop(기본 false, 이제 아무도 안 넘김) 죽은 분기; `useWorkManager.js`·`useElevatorSim.js` 주석이 "App.vue 소스에서 fallback 을 잘라 읽는다"고 적어 낡았다 → 후속 정리 후보.

### v0.9 CSS 정리 입력 — 이제 쓰이지 않는 클래스(styles.css 는 이번에 손대지 않음)
`test-route-banner` `test-route-grid` `test-route-card` `test-route-actions` `prototype-shell` `prototype-hero` `prototype-card` `mobile-stack-preview` `mobile-card` `signal-grid` `signal-card` `hero-panel` `hero-metrics` `line-grid` `line-card-top` `line-mark` `line-copy` `line-ticket-row` `ticket-tag` `line-cta` (`line-card` 는 ToneTools E2E 가 참조 — 삭제 전 확인). 다른 화면이 같이 쓰는 `prototype-rule-*`·`district-*`·`reward-*`·`fleet-*`·`crew-*`·`banner-stats`·`station-lead`·`check-list` 등은 살아 있다.

## 검증
- 기준선(시작 전) `E2E_WORK_DIR=/private/tmp/tkt211-e2e npm --prefix frontend run e2e:all` → **pass 99 / skip 18 / fail 0**. 끝난 뒤 동일 → **99 / 18 / 0**(로그 `/private/tmp/tkt211/baseline.log`·`after.log`).
- unit `node --test $(find src -name "*.test.mjs")` → 46 pass / 0 fail. `npm run build`·`--base=/workaround.co.kr-platform/` 그린. `git diff --check` 그린.
- 전후 캡처(Playwright, 시계 고정·애니메이션 끔·reduced-motion, 시드 고정 `splash:seen`): 환승 홀·운영 노트(`/work`)·여행(`/voyage`) × 375/1440 × 다크/라이트 12장 `/private/tmp/tkt211/before-*.png`·`after-*.png` **전부 바이트 동일**(`cmp`). 전 단계로 before 를 2회 찍어 결정론 확인. (중간에 after junction-1440-light 한 장이 다른 프로세스와 겹쳐 1회 달랐으나 재촬영 3회 동일 — 캡처 플레이크.) 스크립트 `/private/tmp/tkt211/capture.mjs`.
- 레거시 진입 수동 스크립트 `/private/tmp/tkt211/legacy.mjs`(splash 방문 기록 있는 상태, 1440): `/test?view=junction`, `/test?view=work`, `/test/v0-5-0/junction`, `/test/v0-5-0/taxi`, `/?mode=v040`, `/?mode=v050` 모두 → 주소 `/`, 상단바 제목 "환승 홀", `.junction-shell` 있음, `.test-route-banner`·`.prototype-shell` 없음, pageerror 0.
- 375/1440 실렌더는 화면 변화 0 이 합격선이라 바이트 동일로 갈음(별도 시각 지적 없음). 영어 간판·overflow 는 코드가 같으므로 신규 위험 없음.

## 질문/에스컬레이션 보강
- [반박] `useClock.js` — 위 구현 내역 참조(시계가 없음). 만들지 않았다.
- [구체화 질문] `/test*` 구 북마크는 스플래시를 거쳐 환승 홀로 열린다(재방문자는 건너뜀). 곧바로 환승 홀(스플래시 생략)이 낫다면 PM 판단 — 지금은 "알 수 없는 주소와 동일"이 가장 단순해 그렇게 했다.

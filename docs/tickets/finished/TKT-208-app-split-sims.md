문서 상태: 작성완료

# TKT-208 `[FE]` App.vue 분해 — 시뮬(격납고·엘리베이터·택시) (동작 변화 0)

- 상태: finished · **P1 · v0.8.3** · 담당: dev 서브에이전트(Sonnet) · 브랜치 **`codex/v0.8.3`**(작업 트리 `/Users/imjeonghan/newProject/wa-083`) · 스펙 `design/app-vue-decomposition-v0.8.3.md`.
- 근거: PO 2026-10-25 「0.8.3에서 그럼 app.vue 분해 포함 리팩토링해줘」.
- scope: `frontend/src/App.vue`, 신규 `pages/SimHubView.vue`·`ElevatorView.vue`·`TaxiView.vue`·`composables/useElevatorSim.js`·`useTaxiSim.js`. **CSS 이동 금지**(클래스 이름 그대로), 다른 화면 코드 이동 금지.

## 완료 조건
1. [x] 해당 덩어리의 템플릿·상태·함수·타이머가 새 파일로 옮겨지고, App.vue 는 컴포넌트를 쓰기만 한다. 전역에 필요한 값은 props/emit 또는 composable 반환값으로만 주고받는다(전역 변수 공유 금지).
2. [x] 타이머·이벤트 리스너는 옮긴 쪽의 `onBeforeUnmount` 에서 정리된다(누수 0).
3. [x] **동작·화면 변화 0**: `npm --prefix frontend run e2e:all` 97 pass / 18 skip / 0 fail(실측 기준선은 99/18/0 — 다른 티켓이 테스트를 더함), unit 그린, `git diff --check`. 테스트 파일 수정 0(바꿔야 하면 이유를 적고 PM 판단).
4. [x] 375/1440 × 다크/라이트에서 해당 화면 전후 캡처 비교 `/private/tmp/tkt208/before-*`·`after-*`(같은 시점·같은 난수 시드에서 눈으로 차이 0).
5. [x] App.vue 줄 수 전/후 기록.

## 구현 내역
- 새 파일: `pages/SimHubView.vue`·`ElevatorView.vue`·`TaxiView.vue`, `composables/useElevatorSim.js`·`useTaxiSim.js`. 수정은 `App.vue` 뿐(테스트·CSS 무변경).
- `useElevatorSim({ fallbackState, fetchJson })`: 상태 elevatorState·elevatorCarCount·demandPreset·demandIntensity·elevatorTickerOpen, 파생 elevatorSummary/Demand/Cars/Building/FloorRows/AverageWaitSeconds/Events, 함수 loadElevatorState·updateElevatorCarCount·applyDemandPreset·activateElevatorPage·updateDemandIntensity·addPassengerAtFloor·resetElevator·postElevatorJson·directionGlyph·readElevatorTickerDefault, 수요/대수 watch 2개, 900ms 폴링(`startPolling()`, composable `onBeforeUnmount` 에서 정리).
- `useTaxiSim({ createEntityId })`: 상태 taxiState·수동 호출 입력 4개, 파생 taxiZones/Fleet/ActiveRequests/CompletedRequests/RewardSummary/DashboardMetrics/ZoneCards/RequestQueue, TAXI_ZONE_DEFINITIONS·createInitialTaxiState·createTaxiCab·createTaxiRequest·clamp·shouldSpawnAutoTaxiRequest·spawnTaxiRequest·pickTaxiZoneId·advanceTaxiSimulation·submitManualTaxiRequest·addTaxiFleetUnit, 1200ms 틱(`start()`, 정리는 `onBeforeUnmount`). `findTaxiZone` 은 export(TaxiView 가 씀).
- `SimHubView`: simHubCards·featured/secondary·openSimCard·정적 공개본 알림(staticSimNotice + 2.5초 타이머, 언마운트 시 정리). 알림 상태·타이머가 화면으로 내려갔으므로 `App.openPage` 가 이동을 시작할 때 `ref` 의 `clearNotice()` 를 호출해 이전과 같이 즉시 걷는다. 카드 클릭은 `open-page` emit.
- `ElevatorView`·`TaxiView`: 템플릿을 그대로 옮김(클래스·카피 동일). `sim` prop(composable 반환값)을 `toRefs(reactive(...))` 로 풀어 템플릿 식을 한 글자도 안 바꿨다. `formatSignedValue`·`formatTaxiEvent`·`taxiStatusLabel` 은 TaxiView 로. 나가기는 `open-page` emit.
- App.vue 에 남긴 것: `fallbackElevatorState`(SimTone·taxiDispatch E2E 가 App.vue 소스를 잘라 읽음 — 이동하면 테스트를 고쳐야 해서 둠), 환승 홀 카드가 읽는 elevatorState·elevatorCars, `loadPortalData`/`activateElevatorPage` 호출 시점(라우팅·onMounted), `createEntityId`(블로그와 공유), 레거시 v040/v050 프로토타입(건드리지 않음, 시뮬 함수 공유 없음).
- App.vue 줄 수: **4,794 → 3,961(-833)**.
- 경계 판단: 택시 틱은 페이지와 무관하게 App 마운트부터 계속 돈다(원래 동작). 시작 시점도 `await loadPortalData()` 뒤로 같다.

## 검증
- `e2e:all`(E2E_WORK_DIR=/private/tmp/tkt208-e2e): 전 99 pass / 18 skip / 0 fail → 후 99 / 18 / 0 (SimTone 5·taxiDispatch 5·splashTone 14·staticRouting 5 포함). 로그 `/private/tmp/tkt208/baseline-e2e.log`·`after-e2e.log`.
- unit: 40 pass / 0 fail. 빌드 root·Pages-base 둘 다 성공. `git diff --check` 0.
- 캡처: 격납고·엘리베이터·택시 × 375/1440 × 다크/라이트 × root(라이브)·Pages-base(정적 공개본 미리보기/준비 중) = 24장, 시계 정지·API 고정 상태에서 전후 **바이트 동일**(`/private/tmp/tkt208/before-*.png` = `after-*.png`).
- 타이머 정리: 두 composable 과 SimHubView 가 각자 `onBeforeUnmount` 에서 clear.

## 질문/에스컬레이션
- [제안] `fallbackElevatorState` 가 App.vue 에 남은 이유가 E2E 의 소스 문자열 자르기다. 후속(TKT-211 등)에서 두 E2E 가 fixture 를 모듈 import 로 읽도록 바꾸면 이 const 도 useElevatorSim 으로 옮길 수 있다.
- [반박] 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-208-r1.md`.
- 없음.

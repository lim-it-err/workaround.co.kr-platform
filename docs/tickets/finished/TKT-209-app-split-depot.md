문서 상태: 작성완료

# TKT-209 `[FE]` App.vue 분해 — 기지선(Work 실행 영역·Runtime·인증) (동작 변화 0)

- 상태: finished · **P1 · v0.8.3** · 담당: dev 서브에이전트(Sonnet) · 브랜치 **`codex/v0.8.3`**(작업 트리 `/Users/imjeonghan/newProject/wa-083`) · 스펙 `design/app-vue-decomposition-v0.8.3.md`.
- 근거: PO 2026-10-25 「0.8.3에서 그럼 app.vue 분해 포함 리팩토링해줘」.
- scope: `frontend/src/App.vue`, 신규 `pages/WorkView.vue`·`RuntimeView.vue`·`composables/useWorkManager.js`. **CSS 이동 금지**(클래스 이름 그대로), 다른 화면 코드 이동 금지.

## 완료 조건
1. [x] 해당 덩어리의 템플릿·상태·함수·타이머가 새 파일로 옮겨지고, App.vue 는 컴포넌트를 쓰기만 한다. 전역에 필요한 값은 props/emit 또는 composable 반환값으로만 주고받는다(전역 변수 공유 금지).
2. [x] 타이머·이벤트 리스너는 옮긴 쪽의 `onBeforeUnmount` 에서 정리된다(누수 0).
3. [x] **동작·화면 변화 0**: `npm --prefix frontend run e2e:all` 97 pass / 18 skip / 0 fail, unit 그린, `git diff --check`. 테스트 파일 수정 0(바꿔야 하면 이유를 적고 PM 판단).
4. [x] 375/1440 × 다크/라이트에서 해당 화면 전후 캡처 비교 `/private/tmp/tkt209/before-*`·`after-*`(같은 시점·같은 난수 시드에서 눈으로 차이 0).
5. [x] App.vue 줄 수 전/후 기록.
6. [x] 인증 토큰 저장·만료·잠금 동작 그대로(TKT-060 하드닝 회귀 0) — 관련 단위 테스트가 없으면 추가.

## 구현 내역
- 새 파일: `frontend/src/composables/useWorkManager.js`(722줄: 보드·헬스·런타임·서비스 상태, 인증 세션 토큰 저장·만료 타이머·잠금, 메타데이터 저장, 명령 전송, Ready 드래그, 로더, runtime 톤 행) · `components/pages/WorkView.vue`(488줄, `WorkNotes` 포함 실행 영역·검토 대기·버전·명령·인증) · `components/pages/RuntimeView.vue`(77줄) · 단위 테스트 `composables/useWorkManager.test.mjs`(신규 6건).
- App.vue 3,961 → **2,847줄**(-1,114). 남은 것: `useWorkManager` 호출과 구조분해(junction 카드·`loadPortalData`·`runtimeState` 등이 읽는 값만), 페이지 스위치의 `<WorkView>`·`<RuntimeView @refresh="loadPortalData">`.
- 설계: 패턴은 TKT-207·208 과 같다(`manager` prop + `toRefs(reactive())`). `fetchJson` 은 주입. 8초 폴링(`loadPortalData`)은 환승 홀·엘리베이터와 공유라 App 에 남기고, 상태 로더만 composable 이 소유. 만료 `setTimeout` 은 composable 의 `onBeforeUnmount` 에서 정리. 새로고침 버튼은 기존처럼 클릭 이벤트를 `loadPortalData` 첫 인자로 넘긴다(옵션 객체 자리라 `refreshElevator` 가 falsy — 기존 동작 그대로).
- **E2E 와의 결합**: SimTone·taxiDispatch E2E 가 `App.vue` 를 문자열로 읽어 `const fallbackHealth/fallbackRuntime/fallbackWorkBoard/fallbackElevatorState` 를 잘라 쓴다. 테스트를 안 고치려고 세 fallback 상수는 App.vue 에 남기고 `useWorkManager({ fallbacks })` 로 주입했다(TKT-208 의 `fallbackElevatorState` 와 같은 사정). 후속(TKT-211 또는 v0.8.4): 두 E2E 를 import 방식으로 바꾼 뒤 이동.
- 테스트 파일 수정 0(신규 단위 테스트 1개만 추가). CSS 이동 0. 레거시 v040/v050 블록 미접촉. 공유 파일 없음.
- `[반박]` 없음.

## 검증
- 기준선(시작 전) `E2E_WORK_DIR=/private/tmp/tkt209-e2e npm run e2e:all`: **99 pass / 18 skip / 0 fail**. 완료 후 동일: **99 / 18 / 0** (로그 `/private/tmp/tkt209/base-e2e.log`·`after-e2e.log`). 중간에 fallback 상수를 옮겼을 때 SimTone·taxiDispatch 가 89/18/2 로 깨졌고 위 이유로 되돌려 해소.
- unit `node --test $(find src -name "*.test.mjs")`: 40 → **46 pass / 0 fail**(신규 6: `resolveWorkManagerAuthSession` 만료·TTL·무효, `isExpiredWorkManagerSession`, 저장 세션 복원/만료 삭제, 유효 세션만 저장, 만료 세션 시작 시 잠금 안내·요청 0, 인증 성공 저장 → 401 잠금·삭제 → 잠그기 삭제).
- build: Pages base(`/workaround.co.kr-platform/`)·root base 모두 통과, CSS 해시 동일(`index-J-xzwwXx.css`). `git diff --check` 통과.
- 캡처(`/private/tmp/tkt209/`): 정적 공개본 `/work`(375·1440 × 다크·라이트 4장)·root-base `/work`·`/runtime`(8장), 모든 `<details>` 펼침·`Math.random` 고정·백엔드 없음(API 404). `before-*` vs `after-*` **12장 바이트 동일**(`cmp`). 가로 overflow 0. 정적 공개본 `/work` 의 `/api/` 요청 **0**(전후 동일). 라이브 base 는 전후 동일하게 7건(헬스·런타임·서비스·보드·엘리베이터 등 기존 폴링).
- 시각 검토: 화면이 바이트 동일이라 신규 어긋남 없음(기존 상태 그대로).
- 확신 없는 점: 인증 입력→로그인 성공 흐름의 실렌더 캡처는 백엔드가 없어 하지 못함(단위 테스트로 대체).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-209-r1.md`.
- 없음.

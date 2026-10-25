문서 상태: 작성완료

# TKT-208 `[FE]` App.vue 분해 — 시뮬(격납고·엘리베이터·택시) (동작 변화 0)

- 상태: ready · **P1 · v0.8.3** · 담당: dev 서브에이전트(Sonnet) · 브랜치 **`codex/v0.8.3`**(작업 트리 `/Users/imjeonghan/newProject/wa-083`) · 스펙 `design/app-vue-decomposition-v0.8.3.md`.
- 근거: PO 2026-10-25 「0.8.3에서 그럼 app.vue 분해 포함 리팩토링해줘」.
- scope: `frontend/src/App.vue`, 신규 `pages/SimHubView.vue`·`ElevatorView.vue`·`TaxiView.vue`·`composables/useElevatorSim.js`·`useTaxiSim.js`. **CSS 이동 금지**(클래스 이름 그대로), 다른 화면 코드 이동 금지.

## 완료 조건
1. [ ] 해당 덩어리의 템플릿·상태·함수·타이머가 새 파일로 옮겨지고, App.vue 는 컴포넌트를 쓰기만 한다. 전역에 필요한 값은 props/emit 또는 composable 반환값으로만 주고받는다(전역 변수 공유 금지).
2. [ ] 타이머·이벤트 리스너는 옮긴 쪽의 `onBeforeUnmount` 에서 정리된다(누수 0).
3. [ ] **동작·화면 변화 0**: `npm --prefix frontend run e2e:all` 97 pass / 18 skip / 0 fail, unit 그린, `git diff --check`. 테스트 파일 수정 0(바꿔야 하면 이유를 적고 PM 판단).
4. [ ] 375/1440 × 다크/라이트에서 해당 화면 전후 캡처 비교 `/private/tmp/tkt208/before-*`·`after-*`(같은 시점·같은 난수 시드에서 눈으로 차이 0).
5. [ ] App.vue 줄 수 전/후 기록.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

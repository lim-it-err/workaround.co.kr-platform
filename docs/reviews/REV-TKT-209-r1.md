문서 상태: 작성완료

# REV-TKT-209-r1 — App.vue 분해: 기지선 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현: dev 서브에이전트(Sonnet). 브랜치 `codex/v0.8.3`.
- 게이트(PM): `e2e:all` 99/18/0 · unit 46/46(인증 세션 단위 6 신규) · `git diff --check`. 구현자 캡처 12장 전후 바이트 동일, 정적 `/work` API 요청 0.
- 확인: App.vue 3,961→2,847줄. 인증 토큰 저장·만료·잠금(TKT-060) 회귀를 단위 테스트로 고정.
- 후속(TKT-211 에 추가): SimTone·taxiDispatch E2E 가 App.vue 소스에서 fallback 상수 4개(`fallbackHealth`·`fallbackRuntime`·`fallbackWorkBoard`·`fallbackElevatorState`)를 문자열로 잘라 읽는다 → 상수를 모듈로 옮기고 두 E2E 를 import 방식으로.

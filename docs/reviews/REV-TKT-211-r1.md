문서 상태: 작성완료

# REV-TKT-211-r1 — App.vue 분해: 환승 홀·셸·라우팅 + 레거시 제거 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현: dev 서브에이전트(Sonnet). 브랜치 `codex/v0.8.3`.
- 게이트(PM): `e2e:all` 99/18/0 · unit 46 · root build 77 modules · `git diff --check`. 구현자 캡처 12장 전후 바이트 동일, 레거시 주소(`/test*`·`?mode=v040/v050`) → 환승 홀·오류 0.
- 확인: **App.vue 1,908→357줄**(v0.8.3 시작 5,127). fallback 상수 → `data/fallbacks.js`, SimTone·taxiDispatch E2E 는 import 로만 바뀌고 단언 무변경. 레거시 프로토타입 1,600여 줄 삭제(목록·안 쓰이게 된 CSS 클래스는 티켓에 — v0.9 CSS 정리 입력).
- [반박] 수용: `useClock.js` 미생성(시계 코드가 이미 없음). `/test*` 옛 북마크가 스플래시를 거치는 것은 일반 첫 진입과 같아 수용.
- 후속(v0.9 정리): `ElevatorView`·`TaxiView` 의 죽은 `isTestRoute` prop, composable 주석의 낡은 "App.vue 소스 문자열" 언급.

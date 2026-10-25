문서 상태: 작성완료

# REV-TKT-208-r1 — App.vue 분해: 시뮬 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현: dev 서브에이전트(Sonnet). 브랜치 `codex/v0.8.3`.
- 게이트(PM): `e2e:all` 전체(아래 숫자) · `git diff --check`. 구현자 전후 99/18/0, 캡처 24장 전후 바이트 동일, unit 40.
- 확인: App.vue 4,794→3,961줄. 폴링·틱 타이머는 composable 이 시작·정리, 템플릿 식 무변경(`toRefs`). SimHub 알림 정리는 `defineExpose` 로 기존 동작 유지.
- 수용: `fallbackElevatorState` 는 App.vue 에 남음 — SimTone·taxiDispatch E2E 가 App.vue 소스를 문자열로 잘라 읽기 때문. **후속(TKT-211 또는 v0.8.4)**: 두 E2E 를 import 방식으로 바꾼 뒤 이동.

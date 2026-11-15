문서 상태: 작성완료

# REV-TKT-207-r1 — App.vue 분해 — 스플래시 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 브랜치 `codex/v0.8.3`.
- 게이트(PM, 러너 필터): splashTone 14/0 · JunctionMap 4 · staticRouting 5 · ToneTools 10/2 skip · `git diff --check`. 구현자 `e2e:all` 전후 97/18/0, unit 38.
- 확인: App.vue 5,127→4,794줄. `useSplash` 는 전환 시각에 `onTransition` 만 호출하고 문 열기·페이지 전환은 App.vue 에 남김 — 경계 명확. 타이머는 composable 의 `onBeforeUnmount` 에서 정리. CSS·테스트 무변경.
- 캡처: 3000ms 정지 화면 4장 전후 바이트 동일.

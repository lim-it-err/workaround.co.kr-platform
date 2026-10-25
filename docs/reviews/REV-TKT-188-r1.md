문서 상태: 작성완료

# REV-TKT-188-r1 — 스플래시 티커 1.3초 → 1.5초 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현자: dev 서브에이전트(Claude Haiku).
- 게이트(직접 재실행): Pages-base build 56 · splashTone E2E 13/13 · unit 27/27 · `git diff --check`.
- 확인: `SPLASH_TICKER_INTERVAL_MS` 1500, E2E 간격 1500·기본 `maxCount` 5→4(5,500ms 안 최대 4틱 — 0/1500/3000/4500, 6000 불가)·reduced-motion 라벨 4.5초. 기대값은 계산에서 나왔고 구현을 따라간 것이 아님.
- 참고(codex-9 UX-TKT-186-r1 S1): 네 번째 문구(4,500ms)는 문 열림(5,000ms) 전 500ms 만 가림 없이 보인다 — PO 결정(1.5초) 범위 안이라 수용, PO 에게 한 줄 보고.
- 지적: 없음.

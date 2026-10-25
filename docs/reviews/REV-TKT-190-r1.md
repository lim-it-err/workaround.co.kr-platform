문서 상태: 작성완료

# REV-TKT-190-r1 — 밥상 칩 행 페이드 포커스 해제 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현자: dev 서브에이전트(Claude Haiku). 근거 codex-9 UX-TKT-186-r1 I1.
- 게이트: Pantry 8/8 · splash 13/13 · unit 28/28 · build 56 · `git diff --check`(189 와 함께 재실행).
- 실화면 `/private/tmp/tkt190/focus-375-dark.png`: 끝까지 스크롤한 `집밥` 칩에 포커스 링이 또렷하고 페이드 없음. 비포커스 시 linear-gradient 유지(구현자 측정).
- 지적: 없음.

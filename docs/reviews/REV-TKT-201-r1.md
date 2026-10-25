문서 상태: 작성완료

# REV-TKT-201-r1 — 스플래시 문 열림 뒤 DOORS OPENING 노출 버그 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현: dev 서브에이전트(Sonnet). 브랜치 `codex/v0.8.1`.
- 게이트(202 와 합쳐 직접 재실행): Pages-base build 58 · splashTone 14/14(신규 1: 열림 250ms 시점 환승 홀 DOM 있음·스플래시 없음·문이 위) · JunctionMap 4 · staticRouting 4 · WorkNotes 8 · Ets2Live 4 · Pantry 8 · blogClosed 16 · unit 29 · `git diff --check`.
- 실화면 `/private/tmp/tkt201/door-opening-mid-1440.png`: 열리는 문 사이로 환승 홀 노선도·목록이 보인다.
- 수용: 스플래시 DOM 제거 시점 5,500→5,000ms 기대값 변경 — 문이 닫힌 순간 전환하는 것이 수정의 본질이고, 마지막 문구 `DOORS OPENING` 은 정착 뒤 1초 이상 보인다(178 계약 유지).

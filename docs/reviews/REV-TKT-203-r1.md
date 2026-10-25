문서 상태: 작성완료

# REV-TKT-203-r1 — 노선도 작은 역 이름 복귀(작고 흐리게) (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현: dev 서브에이전트(Sonnet). 브랜치 `codex/v0.8.1`.
- 게이트(직접 재실행): Pages-base build 58 · JunctionMap 4 · staticRouting 4 · Ets2Live 4 · splashTone 14 · unit 29 · `git diff --check`. 구현자: WorkNotes 8 · blogClosed 16 · ToneTools 10/2 skip.
- 실화면 `/private/tmp/tkt203/junction-1440-dark.png`: 작은 역 10개 이름이 작고 흐리게 항상 보이고, 큰 역 7개는 굵고 밝다. 겹침 없음, 가운데 정렬·블로그 빈자리 정리 유지. PO 1안(위계로 단순화) 그대로.
- 메모: 제한 소역(엘리베이터·유로트럭 개발자·화이트채플)이 더 흐린 것은 기존 잠금 표시 규칙 — 의도대로. 지도 아래 안내 문구 정리는 v0.9 노선 재편 때.

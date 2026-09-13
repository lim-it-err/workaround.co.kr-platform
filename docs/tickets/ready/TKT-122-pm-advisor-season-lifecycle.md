문서 상태: 작성완료

# TKT-122 `[PM]` Advisor 시즌 수명주기 스펙 — 28일 고정 해소

- 상태: ready · P2 · 담당: PM
- 근거: 부관 IA 교차 감사(reports/2026-09-10-ia-audit-adjutant.md) — `seasonStats.js:28,39-42` 단일 seasonStart, 28일 후 적립 거절.

## 산출
`design/advisor-season-spec.md`: 시즌 = 정류장(D-013), 종료 시즌 보존·새 시즌 시작·선택, 스탯 이월 규칙. 이후 [FE] 티켓.

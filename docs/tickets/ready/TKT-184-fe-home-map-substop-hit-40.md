문서 상태: 작성완료

# TKT-184 `[FE]` 홈 노선도 소역 히트 원 — 1440 에서 40px 이상(r=26)

- 상태: ready · **P1** · 담당: codex-1 · 의존: TKT-179 finished. 브랜치 `codex/v0.8.0-live`.
- 근거: REV-TKT-179-r2 — 투명 히트 원 r=20 은 1440 에서 31.5px(SVG 스케일 0.79). UX-179 I2 의 40px 요구 미충족(PM 티켓 오기 "r≥20").
- scope: `frontend/src/components/JunctionMap.vue`(소역 히트 원 r → 26), `JunctionMap.e2e.mjs`(1440 소역 13개 bbox ≥40 단언, 인접 소역 히트 원 겹침 시 레이어 우선 규칙 유지).

## 완료 조건
1. [ ] 1440 다크/라이트 소역 13개 히트 bbox ≥40×40, 라벨 중심 클릭 소유권 13/13 유지, 글자·노선 겹침 0.
2. [ ] Junction E2E·unit 그린.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

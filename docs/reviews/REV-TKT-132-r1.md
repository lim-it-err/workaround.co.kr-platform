문서 상태: 작성완료

# REV-TKT-132-r1 — Advisor 코스 시뮬 모델 충실도 (PM 판정: **통과 → finished**, [중요] 1 → TKT-133)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: `services/advisor/frontend` unit **70/70**, build **115 modules**. 구현자 Playwright 36/36 인정. `taxiDispatch.js`·콘텐츠 3파일 diff 없음.
- 구현 선택: 택시 엔진 래핑 대신 **초 단위 결정론적 다중 창구 큐**(균등 도착·창구 가용 즉시 처리·이동/복귀/tick 없음)로 교체 — 스펙이 허용한 두 번째 안. 결과 설명 문구도 교체됨.
- 실화면 검산(127.0.0.1:5173):
  - 10시·창구 3·예약 35%: `혼합 처리시간 34.5초 · 이용률 53.7% · 평균 0.0분 · 최장 0.0분` — 완료 조건 1(≤2분) ✓. 11시: `이용률 69% · 대기 0` ✓. 10시·창구 1: `이용률 161% · 평균 18.2분 · 최장 36.4분` — 포화 시 대기 폭발 ✓.
  - 이용률 = 도착률 × 처리시간 / 창구 수 표시 ✓(조건 3). 창구 +1 vs 예약 60% 방향 일치는 unit 근거 인정(조건 2).
- **[중요] 균등 도착이라 이용률 100% 미만에서 대기가 항상 0** — 학습 문항 1("평균 대기 5분 미만인 시간대")은 전 시간대, 문항 3("임계 이용률")은 정확히 100% 로 답이 나온다. 실제 큐는 확률 도착 때문에 70~90% 부터 대기가 커진다는 게 핵심 학습인데 이 모델은 그걸 보여주지 못한다. 구현자도 남은 위험으로 적음. **시드 고정 지수 간격 도착(재현 가능)** 으로 바꾸면 결정론을 유지하면서 임계 현상이 보인다 → **TKT-133**(P3).
- [제안] `대기 중` 지표가 구조상 항상 0 — 133 에서 `시간 내 미처리`(시작 시각 > 3600초) 로 바꾸거나 숨김.
- 커밋 범위: `services/advisor/frontend/{e2e/course-container.spec.ts, src/modules/missions/games/courseQueueSimulation.js, src/modules/missions/games/__tests__/courseQueueSimulation.spec.js, src/modules/missions/pages/CourseSimulationPage.vue}`.

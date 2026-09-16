문서 상태: 작성완료

# REV-TKT-133-r1 — 코스 시뮬 시드 고정 확률 도착 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: `services/advisor/frontend` unit **77/77**, build **110 modules**. 구현자 Playwright 40/40 인정.
- 실화면 검산(127.0.0.1:5173 `/courses/vienna-1900/sim/v1900-5-entry-queue`, 예약 35%):
  | 조건 | 이용률 | 평균 대기 | 최장 | 시간 내 미처리 |
  |---|---:|---:|---:|---:|
  | 10시·창구 3 | 53.7% | 0.1분 | 0.7분 | 0 |
  | 11시·창구 3 | 69% | 0.2분 | 1.1분 | 0 |
  | 10시·창구 2 | 80.5% | 0.8분 | 2.2분 | 0 |
  | 10시·창구 1 | 161% | 20.4분 | 40.1분 | 68 |
  같은 조건 재실행 결과 동일(재현성 ✓). 이용률 순으로 대기 단조 증가 ✓ — 임계 현상이 보인다. `대기 중` → `시간 내 처리 시작 / 시간 내 미처리` ✓. 설명 문구 "고정 시드 확률 도착 · 지수분포 · 이동·복귀·tick 없음" ✓. `mulberry32(19000511)` + `-ln(u)/λ`.
- 완료 조건 1~3 충족. 코스 시뮬 3부작(131 집계 → 132 모델 → 133 확률) 종료.
- [제안] 생각해 볼 질문 3("임계 이용률")의 정답 안내는 콘텐츠(PM) 쪽에서 "80% 부근부터 급증" 으로 갱신 — 123 콘텐츠 후속.
- 커밋 범위: `services/advisor/frontend/{e2e/course-container.spec.ts, src/modules/missions/games/courseQueueSimulation.js, src/modules/missions/games/__tests__/courseQueueSimulation.spec.js, src/modules/missions/pages/CourseSimulationPage.vue}`.

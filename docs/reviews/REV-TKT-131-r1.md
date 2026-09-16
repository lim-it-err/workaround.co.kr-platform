문서 상태: 작성완료

# REV-TKT-131-r1 — Advisor 코스 시뮬 정정(집계·조건 안내·현재 표면·성찰 절) (PM 판정: **통과 → finished**, [중요] 1 → TKT-132)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: `services/advisor/frontend` unit **68/68**(13 files), build **116 modules**. 구현자 Playwright 36/36 인정. 공용 엔진 `frontend/src/sim/taxiDispatch.js`·콘텐츠 3파일 diff 없음.
- 실화면 검산(127.0.0.1:5173 `/courses/vienna-1900/sim/v1900-5-entry-queue`):
  - 09시·창구 3·예약 35%: `도착 72 / 처리 72 / 대기 중 0 / 평균 0.7분 / 최장 0.8분` — 도착 ≥ 처리, 처리+대기 = 도착 ✓. 결과에 `실행 조건 · 09시 · 창구 3개 · 사전 예약 35%` 표기 ✓.
  - 시간대를 10시로 바꾸면 `조건이 바뀌었습니다` + 버튼 `바뀐 조건으로 다시 실행` ✓ → 재실행 `도착 168 / 처리 168 / 대기 중 0 / 평균 18.8분 / 최장 37.5분`, 안내 사라짐 ✓.
  - `/courses/**` 에서 전역 `배우기` `aria-current="page"` + `current` ✓.
  - `생각해 볼 질문` 은 접힌 `<details>` 안에 123 콘텐츠 문항 3개 연결(REV-130 의 "빈 절"은 접힘 상태 오독 — 정정). 완료 조건 1~5 충족.
- **[중요] 모델 충실도 — 표기 처리시간과 실제 처리량 불일치**: 10시(분당 2.8명)에 창구 3·처리시간 28초(혼합)면 명목 처리 능력 ≈ 분당 6.4명인데 평균 대기 18.8분·최장 37.5분이 나온다. 원인은 택시 엔진 재사용 구조 — "창구"가 관람객을 전시장까지 이동시킨 뒤 **입구로 되돌아와야 다음 배정**을 받아 1인당 유효 처리 ≈ 60초(+15초 tick 양자화). 학습 문항 3("임계 이용률은 몇 %")을 표기 수치로 풀면 답이 틀린다. 집계(131 범위)는 맞고 모델이 문제 → **TKT-132** 로 분리.
- [제안] 실행 직후 `생각해 볼 질문` details 를 기본 펼침으로.
- 커밋 범위: `services/advisor/frontend/{e2e/course-container.spec.ts, src/app/App.vue, src/modules/missions/games/courseQueueSimulation.js, src/modules/missions/games/__tests__/courseQueueSimulation.spec.js, src/modules/missions/pages/CourseSimulationPage.vue}`.

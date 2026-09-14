문서 상태: 작성완료

# TKT-131 `[FE]` Advisor 코스 시뮬 정정 — 집계 범위·조건 변경 안내·현재 표면·성찰 절

- 상태: ready · P1 · 담당: codex-1 · 의존: TKT-124·130 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박]/[구체화 질문] 의무.**
- 근거: 디자이너 검수 `docs/reviews/UX-TKT-124-r1.md`(B1 블로커·I1·I2), `REV-TKT-124-r1`·`REV-TKT-130-r1` 제안.
- scope: `services/advisor/frontend/src/modules/missions/{games/courseQueueSimulation.js, pages/CourseSimulationPage.vue}`, `services/advisor/frontend/src/app/App.vue`(전역 메뉴 active), 테스트. `frontend/src/sim/taxiDispatch.js` 는 **수정 금지**(격납고 엔진 공용 — 최근 16건 자르기는 엔진의 표시용 계약). 콘텐츠 3파일 불가침.

## 목표
1. **집계 범위(B1)**: 결과의 `도착·처리·평균 대기·최장 대기`는 **전체 실행 집계**로 — 처리 수 ≤ 도착 수, 미처리(대기 중) 수도 표시. 엔진이 완료 목록을 최근 16건으로 자르므로 시뮬 쪽에서 완료 이벤트를 누적 집계한다. 최근 이벤트 표를 두려면 `최근 16건` 라벨을 붙여 분리.
2. **조건 변경 안내(I1)**: 시간대/창구/예약을 바꾸면 이전 결과 위에 `조건이 바뀌었습니다 · 다시 실행` 상태 표시. 결과 카드에 실행 당시 조건(시간대·창구 수·예약 비율)을 함께 표기.
3. **현재 표면(I2)**: `/courses/**` 에서도 전역 메뉴 `배우기` 가 active + `aria-current="page"`.
4. **성찰 절**: 시뮬 결과의 `생각해 볼 질문` 을 123 콘텐츠(`courseVienna1900.js` 의 sim 항목 reflect/questions)와 연결. 콘텐츠에 문항이 없으면 절 자체를 숨긴다(빈 제목 금지).

## 완료 조건
1. [ ] 09시·10시 각 실행에서 도착 ≥ 처리, 처리+대기 중 = 도착, 평균/최장 대기가 전체 완료 건 기준 — unit 1건.
2. [ ] 조건 변경 후 `다시 실행` 상태 표시, 결과에 조건 표기 — E2E 1건.
3. [ ] `/courses/vienna-1900` 및 하위 시뮬에서 `배우기` active/aria-current — E2E 1건.
4. [ ] `생각해 볼 질문` 빈 제목 0.
5. [ ] unit/E2E 회귀 그린, 375/1440 overflow 0.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

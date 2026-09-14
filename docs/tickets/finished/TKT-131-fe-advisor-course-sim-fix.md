문서 상태: 작성완료

# TKT-131 `[FE]` Advisor 코스 시뮬 정정 — 집계 범위·조건 변경 안내·현재 표면·성찰 절

- 상태: finished (2026-09-14, REV-TKT-131-r1 통과) · P1 · 담당: codex-1 · 의존: TKT-124·130 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박]/[구체화 질문] 의무.**
- 근거: 디자이너 검수 `docs/reviews/UX-TKT-124-r1.md`(B1 블로커·I1·I2), `REV-TKT-124-r1`·`REV-TKT-130-r1` 제안.
- scope: `services/advisor/frontend/src/modules/missions/{games/courseQueueSimulation.js, pages/CourseSimulationPage.vue}`, `services/advisor/frontend/src/app/App.vue`(전역 메뉴 active), 테스트. `frontend/src/sim/taxiDispatch.js` 는 **수정 금지**(격납고 엔진 공용 — 최근 16건 자르기는 엔진의 표시용 계약). 콘텐츠 3파일 불가침.

## 목표
1. **집계 범위(B1)**: 결과의 `도착·처리·평균 대기·최장 대기`는 **전체 실행 집계**로 — 처리 수 ≤ 도착 수, 미처리(대기 중) 수도 표시. 엔진이 완료 목록을 최근 16건으로 자르므로 시뮬 쪽에서 완료 이벤트를 누적 집계한다. 최근 이벤트 표를 두려면 `최근 16건` 라벨을 붙여 분리.
2. **조건 변경 안내(I1)**: 시간대/창구/예약을 바꾸면 이전 결과 위에 `조건이 바뀌었습니다 · 다시 실행` 상태 표시. 결과 카드에 실행 당시 조건(시간대·창구 수·예약 비율)을 함께 표기.
3. **현재 표면(I2)**: `/courses/**` 에서도 전역 메뉴 `배우기` 가 active + `aria-current="page"`.
4. **성찰 절**: 시뮬 결과의 `생각해 볼 질문` 을 123 콘텐츠(`courseVienna1900.js` 의 sim 항목 reflect/questions)와 연결. 콘텐츠에 문항이 없으면 절 자체를 숨긴다(빈 제목 금지).

## 완료 조건
1. [x] 09시·10시 각 실행에서 도착 ≥ 처리, 처리+대기 중 = 도착, 평균/최장 대기가 전체 완료 건 기준 — unit 1건.
2. [x] 조건 변경 후 `다시 실행` 상태 표시, 결과에 조건 표기 — E2E 1건.
3. [x] `/courses/vienna-1900` 및 하위 시뮬에서 `배우기` active/aria-current — E2E 1건.
4. [x] `생각해 볼 질문` 빈 제목 0.
5. [x] unit/E2E 회귀 그린, 375/1440 overflow 0.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

## 구현 내역 (2026-09-14, codex-1)

- 공용 택시 엔진의 최근 16건 표시 계약은 그대로 두고, 코스 시뮬이 매 tick 새 완료 ID와 대기시간을 별도로 누적해 전체 실행 지표를 계산하도록 수정했다. 결과에 `도착·처리·대기 중`을 함께 표시한다.
- 시간대·창구·예약 비율이 실행 당시 조건과 달라지면 이전 결과 위에 `조건이 바뀌었습니다` 상태와 재실행 안내를 표시하고, 실행 버튼 및 결과 조건 문구를 현재 상태에 맞춰 갱신한다.
- `/courses`와 모든 `/courses/**` 경로에서 전역 `배우기` 링크를 active로 표시하고 `aria-current="page"`를 부여했다.
- 성찰 문항은 `reflect` 또는 `questions` 배열의 실제 문항만 렌더링하며, 유효 문항이 없으면 `생각해 볼 질문` 절 전체를 숨긴다.
- 금지된 공용 엔진 `frontend/src/sim/taxiDispatch.js`와 콘텐츠 3파일은 수정하지 않았다.

## 검증

- 실제 집계: 09시 `도착 72 / 처리 72 / 대기 0 / 평균 43초 / 최장 45초`, 10시 `도착 168 / 처리 168 / 대기 0 / 평균 1,125초 / 최장 2,250초`.
- `npm run test:unit`: 13 files, 68/68 통과(09시·10시 전체 집계 전용 unit 포함).
- `npm run test:e2e`: Chromium 36/36 통과. 조건 변경→재실행, 실행 조건 표기, 코스 상세·시뮬 `배우기` 현재 위치, 375/1440 overflow 0을 포함한다.
- `npm run build`와 `npm run build -- --base=/workaround.co.kr-platform/advisor/`: 각각 116 modules 통과.
- `git diff --check` 통과. commit/push 없음.

## 남은 위험

- 기존 초기 JS 청크 503.31kB 경고는 유지된다. TKT-129의 선택 제안 범위이며 이번 정확성 수정에는 포함하지 않았다.
- Safari/WebKit 및 실제 GitHub Pages 배포는 미검증이다.

## PR 준비 메모

- 제목 초안: `[advisor] 코스 시뮬 전체 집계와 결과 조건 가시성 정정`
- 포함: 코스 시뮬 집계·화면, 코스 하위 전역 메뉴 현재 위치, 전용 unit/E2E, 티켓·보드·이력.
- 제외: 공용 택시 엔진, 콘텐츠 3파일, TKT-129 통합 인덱스, commit/push.

## 리뷰 기록
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-131-r1.md`. [중요] 모델 충실도(창구 복귀 지연) → TKT-132.

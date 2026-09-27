문서 상태: 작성완료

# TKT-156 `[콘텐츠]` Advisor 두 번째 코스 — "부다페스트 온천 큐"

- 상태: finished (2026-09-15, PM 통과) · P2 · 담당: codex-1 · 의존: TKT-124·133 finished. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: PO 2026-09-15 "새로운 콘텐츠를 만들게 해도 돼"(U-37·D-023). 코스는 배우기의 형식(D-020). 첫 코스 비엔나 1900(12미션)과 같은 환승 구조 — 출처 Line V DAY 8(9/15 세체니). 스펙 `design/advisor-course-spec.md`, 큐 모델 `games/courseQueueSimulation.js`.
- scope: **새 파일** `services/advisor/frontend/src/modules/missions/data/courseBudapestBaths.js`, 등록 `store/courseCatalog.js`·`games/practiceCatalog.js`·`store/learnCatalog.js`(카운트), E2E. 기존 콘텐츠 파일 수정 금지.

## 코스 골격 (6~8 미션, codex 집필·PM 검수)
테마: 큐·용량·시간대. 미션 후보 —
- (sim) 세체니 08~09시 입장 큐 — 창구 수·도착률·이용률, 133 의 시드 도착 모델 재사용. **합계·상하한·단조성 검산표를 티켓에**(U-33).
- (coding) 온천 15개 풀의 온도·수용 인원 CSV → 시간대별 혼잡도 계산.
- (coding) 라커/캐빈/패스트트랙 티켓 조합 최적화(예산·대기 시간).
- (game swipe) 온천 에티켓 판정 15장.
- (game probe) 온천수 성분 가설 — 관측 후 판정(130 순서 계약).
- (coding) 부다 언덕 푸니쿨라 vs 도보 — 경로 비용 비교.

## 콘텐츠 규칙 (U-37)
- 사실 수치(온도·인원·요금)는 학습용 근사값으로 표기하고 `[확인]` 표시, 출처 URL 은 티켓 `## 출처` 절에. 실제 시설의 운영 절차가 아님을 파일 머리 주석에.
- 카피 어조·구조는 `courseVienna1900.js` 와 같게(intro 한 단락, spine/applied, missions 배열).

## 완료 조건
1. [x] `/learn` 코스 2행 → 3행, 인덱스 카운트 갱신 E2E(181→182).
2. [x] 코스 상세·시뮬 페이지 진입, 미션 6개 실행 가능(코딩 제출·게임 판정·시뮬 실행 각 1회 E2E).
3. [x] 시뮬 검산표(도착 ≥ 처리, 이용률 0~1, 창구 증가 시 대기 단조 감소) 티켓에.
4. [x] Playwright 46+·unit 그린, 375 코스 상세 스크린샷.

## 구현 기록
- 새 상세 콘텐츠 `courseBudapestBaths.js`와 목록 전용 요약 `courseBudapestBathsCatalog.js`를 분리했다. `/learn`은 세 번째 코스 행만 먼저 읽고, 코딩 미션·게임 15장·Probe·시뮬 원문은 상세 경로에서 기존 로더를 재사용한다.
- 미션은 sim 1·coding 3·game 2의 6개다. 모든 사실값에는 `[확인]`, 용량·도착률·혼잡·비용에는 `[학습용]`을 붙였고 파일 머리에 실제 운영 절차·예측이 아니라는 경계를 명시했다.
- `learnCatalog.js`의 합계는 코스 배열을 정규화해 계산하므로 소스 상수 수정 없이 181→182, 코스 2→3으로 갱신됐다. 단위·E2E 기대값으로 이 계약을 고정했다.
- 공유 파일: `courseCatalog.js`·`practiceCatalog.js`(TKT-152 지연 로드 구조 보존), `MissionPage.vue`·`ReviewPage.vue`(TKT-154 상태별 리뷰 구조 보존), `CourseSimulationPage.vue`(TKT-133 고정 시드 엔진 보존), 기존 인덱스 E2E 4개(TKT-142·153 기대값만 182/3으로 갱신).

## 시뮬 검산표

고정 시드 `20260915`, 혼합 처리시간 41.25초, 사전 예약 25%를 사용했다. 이용률은 화면의 백분율을 0~1로 정규화한 값이다.

| 시간 | 창구 | 도착 | 처리 시작 | 미처리 | 정규화 이용률 | 평균 대기 | 최장 대기 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 08 | 2 | 89 | 88 | 1 | 0.619 | 7초 | 68초 |
| 08 | 3 | 89 | 89 | 0 | 0.413 | 1초 | 16초 |
| 09 | 2 | 137 | 132 | 5 | 0.894 | 24초 | 111초 |
| 09 | 3 | 137 | 134 | 3 | 0.596 | 5초 | 50초 |

- 네 경우 모두 `도착 ≥ 처리 시작`, `처리 시작 + 미처리 = 도착`, 정규화 이용률 `0..1`이다.
- 같은 시간대에서 창구 2→3일 때 평균 대기는 08시 7→1초, 09시 24→5초로 감소한다. 이 조건을 unit에서 고정했다.

## 검증 기록
- `npm run build`: 117 modules, 경고 0.
- `npm run test:unit`: 15 files, 93/93. 코스 형식 3·2·1, 에티켓 15장, 큐 합계·상하한·단조성 포함.
- `npm run test:e2e`: Chromium 56/56. 신규 상세 375px 및 코딩·게임·시뮬 완료 2건 포함.
- 375px 다크 상세 스크린샷을 직접 확인했다. 6개 행의 긴 제목·형식 배지·상태가 넘침 없이 읽히고 가로 overflow 0이다.
- 보호 콘텐츠 `sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js` diff 0. commit/push 없음.

## 출처
- [확인 2026-09-15] 세체니 온천 공식 풀 목록·온도: https://www.szechenyibath.hu/pools
- [확인 2026-09-15] 세체니 온천 공식 시설 단위: https://www.szechenyibath.hu/bath-units?normal-valtozat=1
- [확인 2026-09-15] 세체니 온천 공식 서비스·P1–P16 지도: https://www.szechenyibath.hu/available-services
- [확인 2026-09-15] 세체니 온천 공식 가격표: https://www.szechenyibath.hu/prices
- [확인 2026-09-15] 세체니 온천 공식 FAQ(수영복·슬리퍼·수영모·보관): https://www.szechenyibath.hu/faq
- [확인 2026-09-15] 세체니 온천 공식 수질 성분표: https://www.szechenyibath.hu/water-composition
- [확인 2026-09-15] BKK 공식 부다 성 푸니쿨라(95m·고저차 50m·약 95초): https://bkk.hu/en/travel-information/special-and-heritage-transport-services/funicular/

## 질문/에스컬레이션
- [반박][해결] 후보의 “15개 풀”은 현재 공식 방문자 지도 P1–P16(16개)와 불일치한다. 사실성을 해치는 누락을 피하려고 의료용 풀은 제외하고 공개 방문자 풀 16행으로 구현했으며, UI 제목도 `16개 풀`로 바로잡았다. PM이 후보 문구 고정을 원하면 별도 판정이 필요하다.

## 리뷰 기록
- 없음.
- 2026-09-15 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-156-r1.md`.

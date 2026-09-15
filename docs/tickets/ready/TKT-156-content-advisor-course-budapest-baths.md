문서 상태: 작성완료

# TKT-156 `[콘텐츠]` Advisor 두 번째 코스 — "부다페스트 온천 큐"

- 상태: ready · P2 · 담당: codex-6/codex-1 · 의존: TKT-124·133 finished. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
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
1. [ ] `/learn` 코스 2행 → 3행, 인덱스 카운트 갱신 E2E(181→N).
2. [ ] 코스 상세·시뮬 페이지 진입, 미션 ≥6 실행 가능(각 형식 최소 1회 완주 E2E).
3. [ ] 시뮬 검산표(도착 ≥ 처리, 이용률 0~1, 창구 증가 시 대기 단조 감소) 티켓에.
4. [ ] Playwright 46+·unit 그린, 375 코스 상세 스크린샷.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

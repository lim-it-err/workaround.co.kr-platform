문서 상태: 작성완료 (리뷰어 초안 — 최종 판정은 PM)

# REV-TKT-082-r1 (draft) — 택시 디스패치 버그: 유휴 차량이 대기 큐를 집지 않는다

- 검증자: 리뷰어 (Claude Sonnet 5)
- 검증일: 2026-09-10
- 대상: `docs/tickets/need_review/TKT-082-chore-taxi-dispatch-idle-bug.md`
- 검증 위치: `cd /Users/imjeonghan/newProject/workaround.co.kr-platform(/frontend)` 절대경로 이동 후 `pwd` 확인(`.agents/claude-reviewer.md` 규칙 준수).

## 범위 검증

- 변경분: `frontend/src/App.vue`(택시 연결부), `frontend/src/styles.css`, 신규 `frontend/src/sim/taxiDispatch.{js,test.mjs,e2e.mjs}` — 선언 범위 `frontend/src/**` 안. `git status --short` 로 재확인, 다른 파일 없음.
- 지도/레이아웃(TKT-074), Pages 정적 차단 정책(TKT-097), 다른 시뮬(TKT-101 격납고)은 손대지 않았음을 diff 범위로 확인.
- `git diff --check`: 클린.

## 완료 게이트 재실행

| # | 게이트 | 결과 | 근거 |
|---|---|---|---|
| 1 | `npm --prefix frontend run build` | 통과 — 36 modules | 직접 재실행 |
| 2 | `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` | 통과 — 36 modules | 직접 재실행 |
| 3 | `node --test taxiDispatch.test.mjs staticRouting.test.mjs staticWritingState.test.mjs voyageCoverage.test.mjs` | **11/11 통과** | 직접 재실행, claim과 정확히 일치 |
| 4 | `node --test taxiDispatch.e2e.mjs` (Playwright, root-base preview, `/api/**` fixture 가로채기) | **5/5 통과** | 직접 재실행. 다크/라이트×375/1280px 4종 + **실제 30.6초** 방치 관찰 1종. `waitForTimeout(30500)` 코드를 확인했고 실행 로그의 `duration_ms: 30634`로 진짜 30초 이상 실시간 대기했음을 확인(컨트롤드 클록 아님) |
| 5 | `WritingStudio.e2e.mjs` (TKT-100 회귀, Pages base) | **8/8 통과** | App.vue/styles.css를 함께 건드리므로 교차 회귀 재실행 — 안 깨짐 확인 |
| 6 | 커밋/push 여부 | 없음 | 재확인 |

## 진단·수정 근거 코드 대조 (적대적 관점 — 파일:라인 주장 검증)

티켓의 "진단·원인 근거" 절이 인용한 코드 위치를 직접 열어 문구와 실제 코드를 대조했다 — 코드 훑기가 아니라 **주장의 사실 여부를 확인하는 절차**다.

- `frontend/src/sim/taxiDispatch.js:85` — `availableTaxi.status = availableTaxi.route.length === 0 ? 'pickup' : 'to-origin'` + 주석 "Already at pickup: no movement event will arrive to advance to this state." → 티켓이 설명한 "픽업 이동 경로가 비어 있으면 곧바로 pickup" 수정과 **정확히 일치**.
- `frontend/src/sim/taxiDispatch.js:65-66` — 주석 "Completion can free a cab during this tick; drain pending work immediately." 다음 줄에 `matchPendingTaxiRequests(nextState)` 재호출 → "완료 직후 대기 큐를 한 번 더 매칭" 수정과 **정확히 일치**.
- `frontend/src/App.vue:1707/1723/1734` — 각각 자동 틱(`advanceTaxiFleet`)·수동 호출(`assignPendingTaxiRequests`)·차량 추가(`assignPendingTaxiRequests`) 반영 지점, 티켓이 인용한 그대로.
- 결론: 원인 진단과 수정 위치 인용이 실제 코드와 어긋남 없이 정확했다. 지어낸 근거가 아니다.

## 실브라우저 라이브 재현 (자동화 스위트와 별개로 리뷰어가 직접 확인)

root-base 프리뷰(fresh port)를 열어 자동화 테스트가 이미 검증한 시나리오를 리뷰어가 손으로 재현했다.

- 대기 중인 `Cab-01`(연남 zone, idle)을 확인 → 수동 호출 입력에서 출발지를 같은 zone(연남), 도착지를 다른 zone(강남)으로 두고 "수동 호출 추가" 클릭 — **동일 구역 픽업** 시나리오를 실제로 유발.
- 10초간 관찰: `ACTIVE REQUESTS` 는 1로 유지(누적되지 않음), `COMPLETED RIDES` 는 13→16으로 꾸준히 증가, `AVG WAIT` 0.2~1.0s — 원 버그 증상("모든 택시가 idle 인데 큐는 줄지 않는다")이 재현되지 않고 정상 순환함을 육안 확인.
- 콘솔에는 `/api/**`(게이트웨이 부재로 인한, 택시 로직과 무관한 배경 폴링) 404가 다수 있었으나 — 이는 리뷰어가 라이브로 열 때 Playwright의 `page.route` 가로채기가 없어 생기는 환경 차이이며, 자동화 E2E는 정확히 이 트래픽을 fixture로 막고 실행해 0 errors 를 재확인했다(위 게이트 4). 택시 시뮬 자체의 JS 예외는 없었다.

## 375px + 다크/라이트

- `taxiDispatch.e2e.mjs` 자체가 다크/라이트 × 375px/1280px 4콤보를 자동 검증하며 이번 실행에서 4/4 통과(overflow 0 포함, 테스트 코드 내 assert 확인). 별도 수동 스크린샷은 생략하고 자동화 결과를 신뢰할 근거(코드 상 실제 픽셀 단위 assert 존재)를 직접 읽어 확인했다.

## 지적사항

없음. 이번 검증에서 [블로커]/[중요]/[제안]급 결함을 발견하지 못했다.

## 종합 의견 (초안 — 최종 판정은 PM)

완료 게이트 5종(빌드 2·공유 node 테스트 11개·전용 E2E 5개(실제 30.6초 포함)·TKT-100 회귀 E2E 8개)을 전부 직접 재실행했고, 티켓이 인용한 진단·수정 코드 위치를 직접 대조해 근거가 정확함을 확인했다. 자동화가 이미 검증한 "동일 구역 즉시 배차" 시나리오를 리뷰어가 별도로 라이브 재현해 큐가 쌓이지 않고 완료 건수가 꾸준히 느는 것을 육안으로도 확인했다. 범위 위반 없음, 커밋·push 없음. finished 전환을 권장한다 — 이번 사이클 검증한 티켓 중 진단 근거의 검증 가능성(코드 인용의 정확도)이 가장 뛰어났다.

## PM 판정 (2026-09-10) — **통과 → finished**
리뷰어 게이트 전건 인정 + PM 재실행: 합산 트리 build 그린, node 테스트 11/11 (taxiDispatch 포함). 블로커 0.

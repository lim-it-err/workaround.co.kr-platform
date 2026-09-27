문서 상태: 작성완료 (리뷰어 초안 — 최종 판정은 PM)

# REV-TKT-101-r1 (draft) — 시뮬 묶음 노선도 단일 진입 "미스터리 트레인" (D-012)

- 검증자: 리뷰어 (Claude Sonnet 5)
- 검증일: 2026-09-10
- 대상: `docs/tickets/need_review/TKT-101-fe-sim-annex-single-entrypoint.md`
- 검증 위치: `cd /Users/imjeonghan/newProject/workaround.co.kr-platform(/frontend)` 절대경로 이동 후 `pwd` 확인(`.agents/claude-reviewer.md` 규칙 준수).

## 범위 검증

- 선언 범위(`frontend/src/data/lines.js`, `frontend/src/App.vue`, `frontend/src/styles.css`) 밖 변경 없음 — `git status --short` 재확인.
- **미신고 디렉터리 발견 → 조사 후 무관 확인**: `frontend/src/sim/taxiDispatch.{js,test.mjs,e2e.mjs}` 가 미커밋 상태로 존재하나, 이는 board.md `started` 상태의 **별개 티켓 TKT-082**(택시 배차·동일 구역 승차 전이 진단/회귀, 같은 담당 codex-1)의 산출물이다. TKT-101의 "질문/에스컬레이션"에도 언급 없고 scope 밖이라 **건드리지 않았고 이번 리뷰 대상에서도 제외**했다.
- `git diff --check` (3개 파일): 클린.

## 완료 게이트 재실행

| # | 게이트 | 결과 | 근거 |
|---|---|---|---|
| 1 | `npm --prefix frontend run build` | 통과 — 36 modules | 직접 재실행. claim은 35 — TKT-082의 신규 `taxiDispatch.js`가 같은 트리에 얹히며 모듈 수가 1 늘었을 뿐, TKT-101 자체 문제 아님(이번 세션에서 반복 관찰된 공유 트리 드리프트) |
| 2 | `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` | 통과 — 36 modules | 위와 동일 사유 |
| 3 | `node --test staticRouting.test.mjs staticWritingState.test.mjs voyageCoverage.test.mjs` | 3/3 통과 | 직접 재실행 |
| 4 | `WritingStudio.e2e.mjs` (TKT-100 회귀 스위트, Pages base) | **8/8 통과** | App.vue/styles.css를 TKT-101이 함께 건드리므로 교차 회귀로 재실행 — TKT-100 완료 이후에도 안 깨짐 확인 |
| 5 | `lines.js` 소스 직접 확인 | E/T 완전 제거, S 1건 | `grep "id: 'E'\|id: 'T'\|id: 'S'\|elevator\|taxi\|미스터리"` → `미스터리 트레인` 1건만 매치. 코드 훑기가 아니라 완료조건 "E·T 삭제"의 단일 진실(lines.js)을 직접 대조 |
| 6 | 커밋/push 여부 | 없음 | 재확인 |

## 실브라우저 검증 — 완료 조건 3개 항목 대조

### 1) 노선도 E·T 제거, S 1개, 클릭 시 진입

- Pages base 프리뷰(정적 모드)와 기본 dev 서버(동적 모드) 양쪽에서 노선도 SVG·`route-rows` 리스트를 직접 열람. `B A W R V D S P` 8개만 존재, E·T 없음. "S 미스터리 트레인" sub-label "심야 임시 운행" 확인.
- 동적 모드: S 클릭 → `location.pathname === '/sim'` 전환 확인(JS 디스패치 클릭, 실 DOM 이벤트).

### 2) simhub(격납고) 2카드, 진입/복귀, 딥링크

- 격납고: 헤더 "미스터리 트레인"/영문 부제 "MYSTERY TRAIN", 통계 타일 0개, 카드 정확히 2장(Elevator Station · Taxi District Lab) — 각 이름+상태 배지("실시간 루프"/"운행 중")+25자 이내 요약("23층 승객 운송" 11자, "9구역 택시 배차" 8자)+진입 버튼 1개. 스펙(§3.3)과 정확히 일치.
- "엘리베이터 열기" 클릭 → E01 승강장 화면 진입, "미스터리 트레인으로 돌아가기" 클릭 → `location.pathname === '/sim'` 복귀 확인(구 simhub 레이아웃 아님).
- 동적 모드에서 `/taxi` 직접 URL 진입 → 리다이렉트 없이 그대로 유지, "district dispatch simulator" 렌더 확인 — 딥링크 보존.

### 3) 정적 모드 경계 (TKT-097 패턴과 일관)

- Pages base 프리뷰에서 S 클릭 → 페이지 이동 없이 "정적 공개본에서는 사용할 수 없음" 메시지만 노출, API 요청 0·콘솔 에러 0.
- `/sim`, `/elevator`, `/taxi` 직접 진입 3개 전부 → `location.pathname`이 base root로 리다이렉트, API 요청 0·콘솔 에러 0.

### 375px + 다크/라이트

- 격납고 화면을 375×812, 다크/라이트 각각에서 직접 렌더 + 스크린샷 확인. `document.documentElement.scrollWidth-clientWidth`, `.page-scroller` 전부 0. 카드·배지·버튼 모두 두 테마에서 판독 가능.

## 검증 제한사항 (실행 불가 항목 — 추정으로 통과 처리하지 않음)

- **엘리베이터/택시 "30초 방치 관찰" 동적 시뮬레이션은 이 환경에서 라이브로 재현하지 못했다.** 프런트가 게이트웨이(`:8080`)를 거쳐 `/api/services/elevator-service/api/state`를 호출하는데, 이 머신의 `:8080`은 **다른 에이전트/세션이 이미 띄워 둔 advisor 서비스**(`kr.co.workaround.advisor.AdvisorApplication`, PID 92699, 기동 후 수 시간 경과)가 점유 중이었다. AGENTS.md 규칙상 다른 에이전트의 실행 중 프로세스를 건드릴 수 없어 게이트웨이를 별도로 띄우지 않았다(사전 빌드된 gateway jar는 클래스 버전 불일치로 어차피 기동 실패 확인함, 포트 점유와는 무관한 별개 사유).
  - 대신 다음으로 보강했다: (a) `elevator-service`를 격리 포트가 아닌 기본 8003에 직접 기동해 `/health`의 `tick` 카운터가 증가함을 확인 — 서비스 자체의 시뮬레이션 루프는 살아있다. (b) 게이트웨이 부재로 인한 404가 전부 **네트워크 요청 실패**일 뿐 **콘솔 JS 예외/Vue 경고는 0건**임을 확인 — 앱이 API 불가 상태를 조용히 폴백 렌더링(고정 4대 배치도)으로 흡수하고 있어 깨지지 않는다. (c) 티켓 scope가 "시뮬 코어·API 호출 함수... 변경하지 않았다"고 명시하고, 실제로 `fetchJson('/api/services/elevator-service/api/state')` 호출부는 App.vue에서 수정 흔적 없이 그대로였다.
  - **권고**: PM 또는 PO가 게이트웨이가 유휴한 환경에서 `/sim` → 엘리베이터/택시 진입 후 30초 관찰만 한 번 더 육안 확인하면 완전하다. 코드 변경 범위와 위 간접 증거로 볼 때 실패 가능성은 낮다고 판단하나, 완료 게이트 항목 자체를 추정으로 통과 처리하지 않기 위해 이 제한을 명시한다.

## 지적사항

없음. 이번 검증에서 [블로커]/[중요]/[제안]급 결함을 발견하지 못했다.

## 종합 의견 (초안 — 최종 판정은 PM)

완료 게이트(빌드 2종·공유 node 테스트 3개·TKT-100 회귀 E2E 8개)를 전부 직접 재실행했고, 완료 조건 3개 항목(E·T 제거/S 단일 진입, 격납고 2카드+진입/복귀+딥링크, build+회귀)을 실브라우저로 대조했다. 정적 모드 경계도 TKT-097과 일관되게 유지됨을 확인했다. 유일한 공백은 이 리뷰어 환경에서 다른 에이전트가 점유한 8080 포트 때문에 막힌 라이브 게이트웨이 경유 시뮬레이션 관찰이며, 이는 위에 정직하게 남겼다. 범위 위반 없음(별도 티켓 TKT-082 산출물과 혼동하지 않고 분리 확인), 커밋·push 없음. 위 제한사항 확인을 조건으로 finished 전환을 권장한다.

## PM 판정 (2026-09-10) — **통과 → finished**
PM 재실행: 합산 build 그린. 게이트웨이 라이브 관찰 공백은 수용 — 이 티켓의 변경은 전부 정적(lines.js/노선도/격납고)이고 시뮬 로직 무접촉. D-012 명칭 그대로 개통.

문서 상태: 작성완료 (리뷰어 초안 — 최종 판정은 PM)

# REV-TKT-098-r1 (draft) — Developer Advisor 기내 로컬 팩·콘텐츠 대확장

- 검증자: 리뷰어 (Claude Sonnet 5)
- 검증일: 2026-09-09
- 대상: `docs/tickets/need_review/TKT-098-fe-advisor-inflight-content-pack.md`
- 검증 위치: 매 명령 전 `cd .../services/advisor(/frontend)` 절대경로 이동 후 `pwd` 확인 (`.agents/claude-reviewer.md` 2026-09-09 규칙 준수). advisor는 `services/advisor/frontend`가 독립 npm 프로젝트라 리포지토리 루트가 아닌 그 디렉터리에서 게이트를 실행함.

## 완료 게이트 재실행 (직접 실행, 로그 기준)

| # | 게이트 | 결과 | 근거 |
|---|---|---|---|
| 1 | `npm run test:unit` (vitest) | 통과 — 8 files, **44 tests** | 직접 재실행, 티켓 claim과 정확히 일치 |
| 2 | `npm run test:e2e` (Playwright, Chromium) | 통과 — **15/15** | 직접 재실행, 티켓 claim과 정확히 일치. `e2e/core-flows.spec.ts:9` `beforeEach`가 `page.route('http://localhost:8080/**', route.abort())`로 전 테스트에 실제 네트워크 차단을 적용함을 코드로 확인 — "네트워크 차단 상태 확인" claim이 형식적이지 않고 실제로 검증됨 |
| 3 | `npm run build` | 통과 — **96 modules** | 직접 재실행, 티켓 claim과 정확히 일치 |
| 4 | `git diff --check -- services/advisor/frontend services/advisor/README.md services/advisor/collab` | 클린 | 직접 재실행 |
| 5 | 커밋/push 여부 | 없음 | `git status --short` 재확인 — 전부 미커밋 |
| 6 | 범위 준수 | 준수 | 아래 참조 |

### 범위 검증

- `git status --short -- services/advisor/service`, `infra/public-site`, 모선 `frontend`(advisor 제외) 전부 클린 — 금지 경로 미접촉.
- **불가침 콘텐츠 파일** (`services/advisor/CLAUDE.md`: `sampleContent.js`, `sampleProjects.js`는 Claude 전담) — `git status`에 두 파일 모두 없음. 신규 미션 6개는 별도 파일 `inflightContent.js`의 `extraMissions`로 분리 구현해 불가침 파일을 건드리지 않았다. **위반 없음.**
- 모선 `frontend/src/components/WritingStudio.vue` 등 2개 미커밋 파일이 같은 워킹트리에 있으나 이는 별개 티켓(`TKT-100`, board.md Started 섹션, codex-1 진행 중)의 산물이며 TKT-098과 무관 — 건드리지 않았다.

## 적대적 검증 (완료 게이트 통과 이상)

1. **ID 중복 교차검사 — 테스트 커버리지 공백 발견, 직접 보완 검증**: `inflightContent.spec.js:21-30`의 "ID 중복" 테스트는 신규 콘텐츠 **내부**(카드/라운드/사건파일/신규게임)의 유일성만 검사하고, 완료 기준이 요구하는 "기존 33개와 ID 중복 없음"을 **기존 미션 목록과 교차검사하지 않는다**. 직접 Node로 `sampleContent.js`의 기존 33개 ID와 `inflightContent.js`의 `extraMissions` 6개 ID를 대조한 결과 중복 0건(`flight-*` 프리픽스로 네임스페이스 분리됨) — **완료 기준은 실제로 충족되나, 이를 보장하는 자동 게이트가 없어 향후 회귀 시 못 잡을 수 있음.**
2. **핵심 문제 중복 여부 수동 스팟체크**: 기존 33개 미션 제목·도메인을 전부 나열해 신규 6개(백신 콜드체인/정수장/박물관 대여/반도체 팹/산불 대피소/스마트 온실)와 대조 — 도메인·기술 문제 모두 겹치지 않음 확인.
3. **실사용자 플로우 — 신규 게임**: `/games` 목록에서 "동시성" 취향 필터로 검색해 "동시성 순서 맞추기"를 UI 클릭으로 진입(E2E가 이미 이 경로를 자동검증하지만, 리뷰어가 별도로 재현) → 라운드 완료 → **새 페이지 로드로 재진입**해 "미열람 131→130"으로 정확히 감소하고 "이어서 하기"에 방금 플레이한 라운드가 뜸을 확인 — 완료 기준 "기내에서... 진행 저장/복원" 재확인.
4. **실사용자 플로우 — 사건 파일 자유열람**: 신규 사건파일 `case-flight-01-cold-room`(백신 콜드체인)에 직접 진입 → 기본 상태 "1/5일"(날짜 대기) → "몰아보기" 클릭 → **즉시 5/5일 전체 개방**, 최종 지목 선택지까지 노출 확인 — 완료 기준 "날짜 대기 없이 자유 열람" 재확인.
5. **375px** — `/inflight`, 사건 파일 페이지 양쪽에서 `document.documentElement.scrollWidth - clientWidth` 직접 측정 = 0.
6. **outbox 리포트 실질 확인** — `collab/outbox/dev-018~022-report.md` 5건 모두 존재하며 내용 확인(변경/검증/미완 섹션이 실질적 — placeholder 아님).

## 지적사항

### [중요] 시간·취향 선택 pill 버튼에 선택 상태를 알리는 ARIA 속성이 없음 — 완료 기준 "접근성 확인"이 형식적으로만 충족됨

- **위치**: `frontend/src/modules/missions/pages/InflightPage.vue:63` (시간 pill), `:67` (취향 pill) — `class="pill" :class="{ active: ... }"` 로만 선택 상태를 표현하고 `aria-pressed`/`aria-current` 등 어떤 ARIA 상태 속성도 바인딩하지 않음.
- **재현**: `/inflight`에서 "동시성" 클릭 → 브라우저 콘솔에서 `document.querySelectorAll('button')`으로 해당 버튼 확인 → `className: "pill active"`이지만 `getAttribute('aria-pressed')`, `getAttribute('aria-current')` 모두 `null`.
- **영향**: 마우스/시각 사용자는 색상·테두리로 선택 상태를 알 수 있지만, 키보드로 Tab 이동만 하거나 스크린리더를 쓰는 사용자는 **어느 시간/취향 필터가 현재 선택됐는지 알 방법이 없다.** 완료 기준 "키보드 포커스 이동 및 버튼 accessible name 확인"은 포커스 이동 자체와 버튼의 텍스트 접근성 이름은 충족하지만(Tab으로 도달 가능, 텍스트 콘텐츠가 이름 역할), 토글 버튼의 **상태 접근성**까지는 다루지 못했다.
- **판단**: 블로커는 아니다 — 핵심 기능(콘텐츠 열람·판정)은 전부 동작하고 시각적으로는 정상이다. 다만 티켓이 명시적으로 "접근성"을 완료 기준에 넣은 만큼, 후속 조치로 `:aria-pressed="prefs.duration === duration"` 류의 바인딩을 추가하는 후속 커밋을 권고.

### [제안] 신규 사건 파일 6개가 공유 템플릿에서 생성되어 일차별 제목·오답 3종이 전부 동일 문구

- **위치**: `frontend/src/modules/missions/data/inflightContent.js:168-198`(대략) — `caseSeeds.map(([slug, title, rootCause, tagline]) => ({...}))` 로 6개 사건파일을 생성하는데, Day 1~5의 `kind`/`title`(예: "Day 1 · 현장 기록 · 처음 발견된 패턴")과 최종 지목의 오답 3종("일시적인 트래픽 증가"/"현장 담당자의 단순 조작 실수"/"원인 불명의 네트워크 지연")이 **6개 파일 전부 글자 하나 다르지 않게 동일**하며, `rootCause`/`title`/`tagline` 4개 변수만 도메인별로 바뀐다.
- **판단**: 완료 기준의 문구("동일한 코드 냄새·사고 원인을 이름만 바꿔 반복하지 않는다")는 "사고 원인"을 기준으로 하고, 6개의 근본 원인(이중 단위 변환/예약작업 시간대/재처리 큐 멱등성/지연 복제본/날씨 이벤트 순서/집계 분모 누락)은 실제로 서로 다르므로 문자 그대로는 위반이 아니다. 다만 사건 파일을 연달아 여러 개 플레이하면 서사 골격(일차 제목·오답 3종)이 매번 똑같아 반복감이 크다 — 자동 테스트로는 잡히지 않는 질적 특성이라 지적으로만 남긴다. 블로커 아님.

## 종합 의견 (초안 — 최종 판정은 PM)

블로커 0건, 중요 1건, 제안 2건. 완료 게이트(unit 44/44·e2e 15/15·build 96 modules·diff-check)를 전부 직접 재실행으로 재확인했고, 티켓이 주장한 수량(독서20·시사회16·머지36·probe15·boundary12·사건파일8/40일·신규게임3×8·신규미션6)을 실제 데이터 로드로 재확인했다. 실사용자 플로우(신규 게임 플레이·저장/복원, 사건파일 자유열람)도 UI로 재현해 확인했다. `finished` 전환에 기술적 결격 사유는 없다고 판단하나, `[중요]` 항목(pill 버튼 aria-pressed 부재)은 접근성을 완료 기준에 명시한 이 티켓의 취지에 비춰 PM이 반영 여부를 직접 판단하길 권한다 — 가볍게 고칠 수 있는 항목이라 반려보다는 finished 승인 + 후속 커밋 요청 쪽을 권고.

## PM 판정 (2026-09-10) — **통과 → finished + [중요] 후속 티켓**
PM 재실행: unit 44/44, build 그린. [중요] pill aria-pressed 부재는 반려 대신 후속 소형 티켓 TKT-104 로 발행(리뷰어 권고 채택). [제안] 사건파일 서사 골격 동일은 콘텐츠 후속 라운드로.

문서 상태: 작성완료 (리뷰어 초안 — 최종 판정은 PM)

# REV-TKT-097-r1 (draft) — GitHub Pages용 여행·글쓰기 정적 UX 준비

- 검증자: 리뷰어 (Claude Sonnet 5)
- 검증일: 2026-09-09
- 대상: `docs/tickets/need_review/TKT-097-fe-static-travel-writing-readiness.md`
- 검증 위치: 전 명령 `cd /Users/imjeonghan/newProject/workaround.co.kr-platform && pwd` 로 절대경로 확인 후 실행 (`.agents/claude-reviewer.md` 2026-09-09 추가 규칙 준수).

## 완료 게이트 재실행 (직접 실행, 로그 기준)

| # | 게이트 | 결과 | 근거 |
|---|---|---|---|
| 1 | `node --test frontend/src/staticRouting.test.mjs frontend/src/staticWritingState.test.mjs frontend/src/data/voyageCoverage.test.mjs` | 통과 3/3 | 직접 재실행 (이번 사이클 재확인) |
| 2 | `npm --prefix frontend run build` (기본) | 통과, 33 modules | 직접 재실행 |
| 3 | `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` | 통과, 33 modules | 직접 재실행 |
| 4 | `git diff --check` | 클린 | 직접 재실행 |
| 5 | 커밋/push 여부 | 없음 | `git status --short` — 관련 파일 전부 미커밋 상태 유지 확인 |
| 6 | 범위 준수 | 준수 | 아래 "범위 검증" 참조 |

### 범위 검증 (scope)

`git status --short` 전체 출력을 검토했다. `services/advisor/**` 변경(TKT-098), `frontend/public/mockups/**` 신규 파일(TKT-102, codex-4)이 같은 워킹트리에 공존하지만 TKT-097 소유 파일이 아니므로 **건드리지 않았고, 리뷰 대상에서도 제외**했다. TKT-097 자신의 변경분은 다음으로 한정된다 — 전부 선언 범위(`frontend/src/**`, `frontend/vite.config.js`, 테스트) 안:

- 수정: `frontend/src/App.vue`, `frontend/src/components/JunctionMap.vue`, `frontend/src/components/VoyageArchiveView.vue`, `frontend/src/components/voyageArchiveState.js`, `frontend/src/styles.css`
- 신규: `frontend/src/staticRouting.js` (+`staticRouting.test.mjs`), `frontend/src/staticWritingState.js` (+`staticWritingState.test.mjs`)

`.github/workflows/**`, `infra/**`, Developer Advisor, 계정 동기화 파일에는 변경 없음 — **금지 범위 위반 없음.**

## 브라우저 실동작 검증

빌드 산출물(`--base=/workaround.co.kr-platform/`)을 `/tmp` 시뮬레이션 디렉터리로 복사하고, **`infra/public-site/prepare-github-pages.mjs` 를 `/tmp` 사본에 대해 실행**(읽기 전용 호출, 저장소 내 파일은 건드리지 않음)해 실제 GitHub Pages 배포와 동일한 `404.html`/`.nojekyll`/`deployment.json`을 생성했다. 이어서 GitHub Pages의 "경로 불일치 시 404.html을 SPA 셸로 서빙" 동작을 재현하는 커스텀 로컬 서버를 직접 작성해 구동했다 (일반 `python3 -m http.server` 는 이 폴백을 지원하지 않아 직접 진입 테스트가 불가능함을 먼저 확인함 — 방법론 상세는 하단 [제안] 참조).

확인 항목:

1. **정적 모드 분리** — 헤더 "정적 공개본" 배지, Work/Runtime/Elevator/Taxi 진입이 "정적 공개본에서는 사용할 수 없음"으로 비활성, Line V·Blog District는 "정적 이용 가능" 유지. 콘솔 에러 0, `/api` 네트워크 요청 0.
2. **내부 이동** — 환승 홀 → Voyage(V01) → 일일 안내(V02, 2일차 "오늘 운행" 실제 활성 — 시스템 날짜 2026-09-09가 여행 기간에 진입해 실검증 가능) → FIELD SESSION 상세 세션(타임라인/체크리스트/조건분기) → "같은 날짜로 돌아가기" → 기록 보관함(V03) 순서로 전부 정상 전환.
3. **직접 진입(콜드 로드, 신규)** — `http://localhost:8099/workaround.co.kr-platform/voyage` 와 `/studio` 를 각각 **새 네트워크 요청으로** (주소창 직접 진입 시뮬레이션) 열어 콘솔 에러 0, 정상 화면 렌더링 확인 (`/voyage` → V01 준비 화면 전체 콘텐츠, `/studio` → Writing Studio B02 초안). `location.pathname` 이 base path를 포함해 정확히 유지됨.
4. **V03 저장/백업** — 스탬프 클릭(V01, "STAMP"→"VISITED✓", `aria-pressed="true"`) → `localStorage['workaround-voyage-archive:east-europe-2026']` 에 `{"stamps":["stop-1"],...}` 로 반영 → 새로고침 후 유지. 메모 입력 시 저장 상태 "저장 중"→"저장됨" 전이가 실제로 확인됨(`immediateStatus:["저장 중"], laterStatus:["저장됨"]`). "내 기록 백업" 클릭 시 `URL.createObjectURL` 로 전달되는 Blob을 가로채 실제 JSON 내용 확인 — `{"format":"workaround-local-writing","travel":{"stamps":["stop-1"],"notes":{...}},"blogDrafts":[]}` 구조 정확.
5. **Writing Studio 저장/복원/백업(신규)** — Markdown 본문에 마커 텍스트 입력 → `role="status"` (`studio-save-status`) 가 "저장됨" 표시 → `localStorage['workaround-blog-posts']` 의 활성 글(`workaround-blog-studio-post` = `post-003`)에 마커 반영 확인. `/studio` 로 전체 새로고침(콜드 로드) 후 **동일 draft(post-003)가 다시 활성 편집 대상으로 복원**되고 textarea에 마커 텍스트가 그대로 남아있음을 확인 — "현재 편집 대상 복원" 완료 기준을 새로고침만이 아니라 콜드 딥링크 재진입까지 포함해 검증. 백업 버튼도 `blogDrafts` 배열에 해당 글과 마커를 포함해 정상 다운로드.
6. **375px 모바일 · 다크/라이트(신규, 명시적 측정)** — `resize_window(375×812)` 후 V03·Writing Studio 양쪽에서 `data-theme` 를 dark/light 각각 전환하며 `document.documentElement.scrollWidth - clientWidth` 를 측정 — **4가지 조합(WS-dark, WS-light, V03-dark, V03-light) 전부 overflow 0**. 스크린샷으로 로컬 저장 고지·백업 피드백·저장 상태 배지가 두 테마 모두에서 읽기 가능함을 육안 확인.

## 지적사항

### [제안] "직접 진입" 완료 기준을 뒷받침하는 자동화 게이트가 TKT-097/TKT-096 어느 쪽에도 없음

- **재현/근거**: `docs/history/2026-09-09.md:46-56` (codex-1 기록)에는 "정적 서버 노선 차단"·"375×812 다크/라이트 확인"만 언급되고, 콜드 로드(새 HTTP 요청)로 깊은 경로에 직접 진입하는 테스트를 했다는 근거가 없다. `frontend/src/staticRouting.test.mjs` 는 `staticRouting.js`의 순수 URL 문자열 함수(`normalizeBasePath`/`stripBasePath` 등)만 단위 테스트하며 서버 레벨 404→SPA 폴백은 다루지 않는다. 실제로 이번 리뷰에서 일반 `python3 -m http.server` 로 먼저 시도했을 때 `/workaround.co.kr-platform/studio` 직접 진입은 **순수 404**였다(재현: `curl -o /dev/null -w '%{http_code}' http://<host>/workaround.co.kr-platform/studio` → 404, 해당 서버가 GitHub Pages의 404.html 폴백을 구현하지 않기 때문). 이 폴백은 `infra/public-site/prepare-github-pages.mjs`(TKT-096/codex-2 소유, TKT-097 범위 밖)가 생성하는 `404.html` 에 전적으로 의존한다.
- **현재 상태**: 리뷰어가 `prepare-github-pages.mjs` 를 직접 실행해 실제 배포와 동일한 폴백을 재현한 뒤 재검증한 결과 `/voyage`, `/studio` 콜드 진입 모두 정상(콘솔 에러 0) — **동작 자체는 문제 없음. 블로커 아님.**
- **왜 지적하나**: TKT-097 완료 기준 "project base 내부 이동과 직접 진입에 깨진 링크가 없다"는 TKT-097 프런트 코드 단독으로는 검증되지 않고 TKT-096의 infra 스크립트와의 결합에서만 성립한다. 이 결합 지점을 검증하는 자동화 테스트가 두 티켓 어디에도 없어, 후속 infra 변경이 `404.html` 생성을 깨뜨려도 TKT-097 쪽 게이트(`node --test`, 기본/Pages base build)는 전부 그린으로 남는다.
- **권고**: PM 판단으로 (a) 실배포 후 PO가 실제 GitHub Pages URL의 `/voyage`, `/studio` 등 깊은 경로에 새 탭으로 직접 접속해 1회 육안 확인하거나, (b) 후속 티켓으로 "Pages 빌드 + prepare 스크립트 + 정적 서버"를 묶은 E2E 스모크를 추가하는 것을 제안. 지금 당장 finished 전환을 막을 사유는 아니라고 판단.

### [제안] Writing Studio/V03 손실조건 고지 문구가 ux-copy-audit §2 원칙 6(리드 문단 ≤40자)을 초과

- **위치**: `frontend/src/staticWritingState.js:2` — `LOCAL_WRITING_HELP = '브라우저 데이터를 지우거나 시크릿 모드를 사용하면 기록이 사라질 수 있으며, 다른 기기에서는 이어지지 않습니다.'` (공백 포함 약 62자). V03·Writing Studio 양쪽에서 "LOCAL NOTES"/"LOCAL DRAFTS" 고지 블록의 두 번째 문장으로 그대로 노출됨.
- **원칙 근거**: `design/ux-copy-audit-2026-08-16.md:25` — "리드 문단은 페이지당 최대 1개, ≤40자."
- **판단**: 이 문구는 티켓 자체의 완료 기준("로컬 저장 범위와 손실 조건이 두 글쓰기 화면에서 명확하다")이 요구하는 필수 고지이며, 화면 정체를 설명하는 장식적 리드 문단이 아니라 데이터 손실조건 안내문이라 원칙 6의 적용 대상인지는 불명확하다 — 다만 글자수만으로는 초과이므로 사실로 남긴다.
- **권고**: 블로커 아님. PM이 "손실조건 고지는 원칙 6 적용 예외"로 명시적으로 판단하면 그걸로 종결. 축약이 필요하면 예: "브라우저 데이터 삭제·시크릿 모드에서는 기록이 사라집니다." (약 27자)로 줄이는 안을 후속 슬라이스에서 검토 가능.

## 종합 의견 (초안 — 최종 판정은 PM)

블로커 0건, 중요 0건, 제안 2건(둘 다 동작에는 문제 없고 절차/카피 다듬기 수준). 완료 게이트 전부 직접 재실행으로 재확인했고, 티켓이 주장한 8개 구현 항목(정적 모드 분리, 내부 이동, 직접 진입, V03 저장/백업, Writing Studio 저장/복원/백업, 9/8·9/9 독립 세션, 375px 다크/라이트, 손실조건 고지)을 전부 실브라우저에서 재현·확인했다. `finished` 전환을 권장하되, 위 제안 2건은 후속 슬라이스 또는 PM 판단으로 남겨두길 권한다.

## PM 판정 (2026-09-10) — **통과 → finished**
PM 재실행: Pages base build 그린, 정적 테스트 3/3. [제안] 2건 처리: ①결합 스모크 — 실배포 URL 육안 확인은 PO 여행 중 실사용이 사실상 수행 중, E2E 스모크는 백로그 후보로만 ②손실조건 고지 62자 — **원칙 6 예외로 판정** (데이터 손실 고지는 완전성이 간결성에 우선한다).

문서 상태: 작성완료 (리뷰어 초안 — 최종 판정은 PM)

# REV-TKT-079-r1 (draft) — Advisor 디자인·역명판 통합 (1·2단계 전체)

- 검증자: 리뷰어 (Claude Sonnet 5)
- 검증일: 2026-09-12
- 대상: `docs/tickets/need_review/TKT-079-v0.7.0-advisor-design-and-frame-integration.md`
- 검증 위치: `cd /Users/imjeonghan/newProject/workaround.co.kr-platform(/frontend, /services/advisor/frontend, /services/advisor/service)` 절대경로 이동 후 `pwd` 확인.

## 범위 검증

- 실제 변경분: `services/advisor/frontend/src/modules/missions/{pages,components}/**`(22개 Vue, 색상→테마 토큰 치환), `services/advisor/frontend/src/app/**`(신규: `platform.css`, `platformNavigation.js`+테스트, `platformTheme.js`+테스트), `services/advisor/frontend/e2e/platform-frame.spec.ts`(신규), `services/advisor/frontend/checks/platform-navigation.mjs`(신규), `design/advisor-frame-baseline-2026-09-{11,12}.md`(신규), 모선 `frontend/src/data/lines.js`(A 노선 등록)·`App.vue`(진입 연결부) — 전부 선언 범위(`services/advisor/frontend/**`, `frontend/src/**` 진입 연결부, `design/**`) 안.
- **불가침 콘텐츠 미접촉 확인**: `sampleContent.js`, `sampleProjects.js` — `git status`에 없음. `modules/missions/data/**`, `store/`, 게임 엔진 파일도 변경 목록에 없음 — "모듈 내부 동결" 계약 준수.
- `.github/workflows/**`, `infra/**`도 변경분에 있으나 이는 **별개 티켓 TKT-103**(이미 별도 리뷰 완료)의 소유임을 git diff 내용으로 직접 확인 — TKT-079 자신은 건드리지 않았다.
- `git diff --check` (TKT-079 소유 경로 한정): 클린.

## 완료 게이트 재실행

| # | 게이트 | 결과 | 근거 |
|---|---|---|---|
| 1 | 모선 기본/Pages base 빌드 | 통과 — 각 37 modules | 직접 재실행, claim과 정확히 일치 |
| 2 | Advisor 기본/Pages nested-base 빌드 | 통과 — 각 99 modules | 직접 재실행, claim과 정확히 일치 |
| 3 | 모선 Node 회귀(정적 라우팅·저장·여행) | 3/3 통과 | 직접 재실행 |
| 4 | Advisor `test:unit` | **61/61 통과**(10 files) | 직접 재실행, claim과 정확히 일치(56 기존 + 5 테마/토큰) |
| 5 | Advisor `test:e2e` | **21/21 통과** — **2회 연속 실행** | claim이 "최초 실행에서 시즌 테스트 3건 간헐 실패 → 수정 후 재실행 통과"라고 자진 신고했기에, 재발 여부를 확인하려고 **직접 두 번 실행**했다. 두 번 다 21/21 클린 — 플레이키니스 수정이 실제로 유효함을 확인 |
| 6 | `cd services/advisor/service && ./run.sh test` (JDK 21) | **34/34 통과** | 직접 재실행. surefire 리포트 14개 파일의 "Tests run" 합계를 직접 더해 34 확인(Failures/Errors/Skipped 전부 0) |
| 7 | 커밋/push 여부 | 없음 | 재확인 |

## `checks/platform-navigation.mjs` 직접 실행 (자체 제작 검증 스크립트 — 코드 읽기 + 재실행)

스크립트 전문을 읽고 다음을 확인했다 — 자기기만적이거나 형식적인 테스트가 아니다:

- 실제 GH Pages 규약대로 `base` 프리픽스 밖 요청을 404 처리하고, 미존재 파일에 **진짜 HTTP 404 상태 코드**로 `404.html`을 서빙하는 자체 로컬 서버를 구성한다(내가 TKT-097/103에서 겪었던 "테스트 서버가 실제 상태 코드를 재현 못 하는" 함정을 이 스크립트는 이미 피해 있다).
- 정확한 계산된 CSS 색상 값(`rgb(13, 19, 28)`, `rgb(124, 137, 240)` 등)과 폰트 패밀리(`Pretendard Variable`)를 하드코딩된 기대값과 비교 — "토큰이 적용됐다"는 주장을 시각적 인상이 아니라 실제 계산값으로 검증.
- `/advisor/inflight`로 이동 후 **실제로 새로고침**해 `reload.status() === 404`를 단언 — dev 서버의 SPA 폴백이 아니라 진짜 Pages 404 경로를 통과했는지 명시적으로 구분해서 확인한다.
- 키보드(Enter)·SVG 클릭 양쪽 내비게이션, 테마 토글의 새로고침 후 유지, 375/1280 × dark/light 4콤보 전체에서 overflow/pageerror/apiRequests 0을 단언.

**직접 실행**: 모선·Advisor를 각각 Pages base로 재빌드 → `prepare-github-pages.mjs`로 병합(TKT-103 검증 때와 동일 절차) → `node checks/platform-navigation.mjs <병합 산출물> <증거 폴더>` 실행 → **4/4 콤보 전부 overflow 0·pageErrors 0·apiRequests 0**으로 claim과 정확히 일치. 생성된 스크린샷(375/1280 × dark/light, 정션·advisor 화면)을 직접 열람해 "A" 역명판·상단 띠 색·다크/라이트 대비·"환승 홀로 나가기"/"밝게 보기" 등 카피가 모선 다른 노선(B/V/S)과 시각적으로 일관됨을 육안으로도 확인했다.

## 세부 확인 사항

- **SeasonPage 색상 예외 4건**: diff를 직접 열람. 하드코딩 hex(`#7aa2f7` 등) 4개가 `var(--accent-text)`/`var(--line-d-text)`/`var(--warn)`/`var(--good)`로 각각 다른 의미 토큰에 매핑됐고, `rgba(...)` 불투명도 블렌드는 `color-mix(in srgb, var(--x) N%, transparent)`로 대체됐다. 4개 스탯(안목/언어화/판단/교양)의 시각적 구분을 유지하면서 테마 반응형으로 바꾼 합리적 선택으로 판단 — 손빼기가 아니다.
- **1안(모듈 복사) vs 2안(별도 빌드) 선택 근거**: `design/advisor-frame-baseline-2026-09-11.md`에서 확인 — PM 2026-09-10 지시로 2안이 명시적으로 지정됐음을 확인(임의 선택 아님).
- **A 노선 등록**: `frontend/src/data/lines.js`에서 `entryPath: '/advisor/'`, `upcoming: false` 직접 확인.

## 지적사항

없음. 이번 검증에서 [블로커]/[중요]/[제안]급 결함을 발견하지 못했다.

## 종합 의견 (초안 — 최종 판정은 PM)

이번 세션에서 검증한 티켓 중 규모가 가장 크고(22개 Vue 컴포넌트 + 신규 검증 인프라 4종 + Java 백엔드), 완료 게이트도 가장 많았다(빌드 4·프런트 테스트 3종·백엔드 테스트 1종, 총 116개 개별 테스트). 전부 직접 재실행했고, 자진 신고된 플레이키니스는 2회 반복 실행으로 재발 여부까지 확인했다. 자체 제작 검증 스크립트(`platform-navigation.mjs`)는 코드 훑기가 아니라 직접 실행해 동일 결과를 재현했으며, 정확한 색상값·진짜 404 상태 코드까지 확인하는 수준 높은 테스트였다. 불가침 콘텐츠·모듈 동결 계약 위반 없음, TKT-103과의 파일 경계도 명확히 분리됨을 확인했다. finished 전환을 권장한다.

## PM 판정 (2026-09-12) — **통과 → finished**
PM 재실행: node 11/11, advisor unit 61/61, 양쪽 build 그린. lines.js A 노선 `entryPath:'/advisor/'`·`upcoming:false` 로 개통, JunctionMap 이 entryHref 로 정적 진입 처리(D-006 정합). 리뷰어 116개 테스트·플레이키 2회 재실행 결과 인정. PO "접속 창이 없다"(09-09) 종결.

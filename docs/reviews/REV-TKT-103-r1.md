문서 상태: 작성완료 (리뷰어 초안 — 최종 판정은 PM)

# REV-TKT-103-r1 (draft) — GitHub Pages 산출물에 advisor 정적 빌드 포함

- 검증자: 리뷰어 (Claude Sonnet 5)
- 검증일: 2026-09-12
- 대상: `docs/tickets/need_review/TKT-103-infra-pages-include-advisor-build.md`
- 검증 위치: `cd /Users/imjeonghan/newProject/workaround.co.kr-platform(/frontend, /services/advisor/frontend)` 절대경로 이동 후 `pwd` 확인.
- 검증 중 자기 정정 1건 있음 — 하단 "재현 방법론" 참조.

## 범위 검증

- 변경분: `.github/workflows/deploy-github-pages.yml`, `infra/public-site/prepare-github-pages.mjs` — 선언 범위와 정확히 일치. `git status --short -- .github infra`로 다른 파일 없음 확인.
- `git diff --check`: 클린.
- 워크플로 YAML 직접 읽음 — 비밀값 리터럴 없음(`github.sha` 컨텍스트 변수만 사용), `prepare-github-pages.mjs` 호출 인자가 아래 수동 재현과 정확히 동일.

## 완료 게이트 재실행

| # | 게이트 | 결과 | 근거 |
|---|---|---|---|
| 1 | `npm --prefix frontend ci`, `npm --prefix services/advisor/frontend ci` | 통과 | 직접 재실행 |
| 2 | 모선 기본 base 빌드 | 통과 — 37 modules | 직접 재실행. claim은 36 — 공유 트리에 다른 티켓 파일이 더 얹히며 발생하는 드리프트(이번 세션 반복 관찰), TKT-103 자체 문제 아님 |
| 3 | 모선 Pages base 빌드 | 통과 — 37 modules | 동일 사유 |
| 4 | advisor 기본 base 빌드 | 통과 — 97 modules | claim 96, 위와 동일한 드리프트 |
| 5 | advisor Pages advisor-base 빌드(`--base=/workaround.co.kr-platform/advisor/`) | 통과 — 97 modules | 직접 재실행 |
| 6 | 모선 Node 회귀(`staticRouting`·`staticWritingState`·`voyageCoverage`·`taxiDispatch`) | **11/11 통과** | 직접 재실행, claim과 정확히 일치 |
| 7 | advisor `test:unit` | 통과 — 56/56(9 files) | claim은 44/44(8 files) — TKT-103 착수(2026-09-11) 이후 다른 티켓이 advisor에 테스트를 추가해 늘어난 것으로 판단(TKT-103 자체는 advisor 소스를 건드리지 않음). 실패 0건이 중요한 부분 |
| 8 | advisor `test:e2e` | **17/17 통과** | 직접 재실행, claim과 일치. 회귀 없음 |
| 9 | 커밋/push 여부 | 없음 | 재확인 |

## prepare-github-pages.mjs 직접 실행 검증 (코드 훑기 아닌 실제 실행)

- 워크플로와 동일한 인자로 직접 실행: `node infra/public-site/prepare-github-pages.mjs --dist frontend/dist --advisor-dist services/advisor/frontend/dist --base /workaround.co.kr-platform/` → **성공**. `frontend/dist/advisor/`에 병합, `deployment.json`에 `advisorBase` 필드 확인.
- **음성 경로(negative path) 검증**: `--advisor-dist` 생략 후 재실행 → `Error: Advisor GitHub Pages output must be provided with --advisor-dist.`로 **실제로 실패**(exit 1) — 티켓이 주장한 "누락 시 의도대로 실패" 그대로 재현됨. 형식적으로만 통과 처리하는 자기기만적 테스트가 아니다.
- 병합 결과물 직접 대조: `advisor/404.html`이 `advisor/index.html`과 바이트 동일(자체 폴백), 루트 `404.html`(28줄)은 `index.html`(14줄)과 다른 별도 JS 셸(경로 접두어로 advisor/모선을 구분해 fetch 후 `document.write`) — 코드(`prepare-github-pages.mjs:78-104`)와 실제 산출물이 일치함을 확인.

## 실브라우저 딥링크 폴백 검증 — 재현 방법론 및 자기 정정

D-014-2("딥링크 HTTP 404는 정적 호스팅의 구조적 한계로 수용 — 화면 렌더 복구가 완료 기준")를 직접 `docs/decisions.md`에서 확인해 인용이 정확함을 검증한 뒤, 실제 GitHub Pages 404 폴백 동작을 로컬로 재현했다.

**1차 시도에서 재현 오류가 있었다**: 로컬 시뮬레이션 서버의 서빙 루트를 `frontend/dist`에 직접 잡았더니(즉 `/workaround.co.kr-platform/` 프리픽스가 실제 디렉터리로 존재하지 않는 상태), 루트 404.html의 셸 스크립트가 `fetch("/workaround.co.kr-platform/advisor/")` 같은 **절대경로**를 호출할 때 그 요청마저 같은 폴백에 재귀적으로 걸려 **동일한 404.html을 다시 받아 `document.write`** 하게 되고, 그 결과 `const base`가 두 번 선언되어 `SyntaxError: Identifier 'base' has already been declared`로 advisor·모선 딥링크 양쪽이 전부 빈 화면이 되는 것처럼 보였다.

이 시점에는 이것이 TKT-103의 실제 회귀(그것도 기존 TKT-096 딥링크 복구까지 깨뜨리는 심각한 것)라고 판단할 뻔했으나, 최소 재현 케이스로 원인을 분리한 결과 **내 시뮬레이션 서버가 실제 GitHub Pages URL 구조(리포명이 경로 프리픽스가 되는 것)를 반영하지 못한 설정 오류**임을 확인했다. 서빙 루트를 리포명 한 겹 위(부모 디렉터리)로 재설정해 `/workaround.co.kr-platform/`가 진짜 존재하는 경로가 되도록 고친 뒤 재검증하니:

- `http://<host>/workaround.co.kr-platform/advisor/inflight` (콜드 진입) → 콘솔 에러 0, "Developer Advisor / ✈️ OFFLINE MODE / 기내 훈련 팩" 정상 렌더.
- `http://<host>/workaround.co.kr-platform/voyage` (모선 콜드 진입) → 콘솔 에러 0, V01 여행 준비 화면 정상 렌더(TKT-096/097 계열 화면 복구도 그대로 유지됨, 회귀 없음).
- 375×812에서 advisor 딥링크 렌더 결과 overflow 0, `/api` 요청 0.

새 포트로 캐시를 배제하고 재확인해 위 결과가 진짜임을 확정했다. **결론: 딥링크 폴백은 advisor·모선 양쪽 다 정상 동작한다. 위 오류는 리뷰어의 로컬 재현 환경 설정 실수였지 TKT-103의 결함이 아니다.**

## 지적사항

### [제안] `advisor/404.html`은 현재 배포 구조에서 실제로는 소비되지 않는다

- **근거**: GitHub Pages는 사이트당 **루트 레벨 `404.html` 하나만** 인식한다 — `advisor/404.html` 같은 하위 경로별 404 파일은 Pages 인프라 자체가 조회하지 않는다. 실제 폴백은 전부 루트 `404.html`의 JS 셸이 `fetch(advisorBase)`로 advisor의 **정상 index.html**을 가져오는 경로로만 동작하며, 이는 위 검증에서 실제로 그렇게 동작함을 확인했다.
- **판단**: 블로커 아님 — 생성 비용이 거의 없고, advisor가 훗날 독립 Pages 사이트로 분리될 경우를 대비한 방어적 산출물로 보면 무해하다. 다만 "왜 필요한지" 코드 주석 한 줄이 있으면 다음 사람이 헷갈리지 않을 것.

## 종합 의견 (초안 — 최종 판정은 PM)

완료 게이트 9종을 전부 직접 재실행했고, `prepare-github-pages.mjs`의 정상/음성 경로를 모두 실제 실행으로 검증했다. 가장 중요한 검증 대상이었던 "advisor 딥링크 화면 복구"는 실제 GitHub Pages URL 구조를 정확히 재현한 로컬 환경에서 advisor·모선 양쪽 다 정상 동작함을 확인했다(1차 오검을 자체적으로 발견·정정한 과정을 위에 투명하게 남김). D-014-2 인용도 정확했다. 범위 위반 없음, 커밋·push 없음. finished 전환을 권장한다.

## PM 판정 (2026-09-12) — **통과 → finished**
PM 재실행(워크플로 동일 순서): 모선 Pages base build · advisor nested base build · `prepare-github-pages.mjs --advisor-dist` → `dist/advisor/{index,404}.html` 생성, 참조 검사 2+2 통과. 실배포 확인은 push 후 advisor URL 200 으로 종결.

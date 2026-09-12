문서 상태: 작성완료

# TKT-103 `[INFRA]` GitHub Pages 산출물에 advisor 정적 빌드 포함

- 상태: `finished` (REV-TKT-103-r1 통과, PM 2026-09-12)
- 우선순위: P1 (TKT-079 언블록 선행 — PO "접속 창이 없다" 계보)
- 담당: codex-2 (INFRA)
- 의존: 없음
- scope: `.github/workflows/deploy-github-pages.yml`, `infra/public-site/prepare-github-pages.mjs`

## 목표

현재 Pages workflow 는 모선 frontend 만 빌드한다. `services/advisor/frontend` 를 함께 빌드해 최종 산출물의 `advisor/` 하위 경로로 포함시켜, 모선에서 `/advisor` 링크(TKT-079 담당)로 진입 가능하게 한다.

## 완료 조건

1. workflow 가 advisor frontend 를 빌드(`npm ci && npm run build`, base=`/workaround.co.kr-platform/advisor/`)해 `dist/advisor/` 로 병합한다.
2. prepare 스크립트의 404 폴백·경로 검사에 advisor 경로가 포함되고 로컬 정적 서버 재현으로 `advisor/` 진입 200 확인.
3. 모선 빌드·기존 검사 회귀 없음. 실배포 확인 절차를 need_review 시 기재 (push 는 PM).

## 구현 메모

- advisor 라우터의 base 처리(vite `--base`) 가능 여부 먼저 확인 — 불가하면 질문 섹션에 적고 blocked.
- TKT-079(FE, codex-1)는 이 티켓 need_review 진입 시 착수한다 (의존성 완화 규칙).

## 질문/에스컬레이션

(비어 있음)

## 리뷰 기록

### 구현 결과 (2026-09-11, codex-2)

- Pages workflow가 모선과 advisor의 lockfile을 함께 캐시하고, 두 앱을 각각 `npm ci`로 설치한다.
- advisor를 `/workaround.co.kr-platform/advisor/` base로 빌드한 뒤 prepare 스크립트가 `frontend/dist/advisor/`로 병합한다.
- prepare 스크립트는 모선·advisor의 정적 참조와 실제 파일을 각각 검사하고, advisor 산출물 누락 또는 잘못된 base를 실패로 처리한다.
- 루트 `404.html`은 요청 경로가 advisor prefix인지 판별해 해당 앱 엔트리를 불러오며, `advisor/404.html`도 함께 생성한다. `deployment.json`에는 `advisorBase`를 기록한다.

### 검증 기록 (2026-09-11, codex-2)

- `npm --prefix frontend ci`, `npm --prefix services/advisor/frontend ci`: 통과.
- 모선 기본 base·Pages base 빌드: 각각 36 modules, 통과.
- advisor 기본 base·Pages advisor base 빌드: 각각 96 modules, 통과.
- 모선 Node 회귀: 11/11 통과. advisor unit: 44/44 통과. advisor Chromium E2E: 17/17 통과.
- prepare 실행: 모선 참조 2개·advisor 참조 2개 검사 및 병합 통과. `--advisor-dist` 누락 시 의도대로 실패함을 확인.
- 로컬 정적 서버: 모선, advisor, 양쪽 JS/CSS, 루트·advisor fallback, `deployment.json` 모두 HTTP 200.
- Pages식 404 재현에서 `/workaround.co.kr-platform/advisor/inflight`는 HTTP 404 본문으로 `Developer Advisor`와 `기내 훈련 팩`을 렌더했고 page error 0. 이는 D-014-2의 화면 복구 계약과 일치한다.
- workflow YAML parse, 비밀값 리터럴 검사, `git diff --check`: 통과.

### 실배포 확인 절차 (PM push 이후)

1. PM이 변경을 commit/push하고 `Deploy GitHub Pages` workflow의 build·deploy 성공과 대상 commit SHA를 확인한다.
2. `https://lim-it-err.github.io/workaround.co.kr-platform/advisor/`가 HTTP 200이고 Developer Advisor가 렌더되는지 확인한다.
3. advisor `index.html`의 JS/CSS 경로가 각각 HTTP 200인지 확인하고, `deployment.json`의 `commitSha`와 `advisorBase=/workaround.co.kr-platform/advisor/`를 대조한다.
4. `/workaround.co.kr-platform/advisor/inflight` 직접 진입·새로고침에서 HTTP 상태는 Pages 한계상 404일 수 있으나 advisor 화면이 정상 복구되는지 확인한다.
5. 모선 루트·Line V·Blog Writing Studio 진입을 재확인한다. 실제 모선 `/advisor` 링크 연결은 의존이 풀린 TKT-079의 범위다.

- commit/push/실배포는 수행하지 않았다. PM 최종 판정 대기.

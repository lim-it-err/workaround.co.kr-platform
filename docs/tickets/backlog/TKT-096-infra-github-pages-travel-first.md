문서 상태: 작성완료 (PM 추인 2026-09-09 — 대리 발행 초안을 정식 승격)
﻿# TKT-DRAFT — GitHub Pages 여행·글쓰기 우선 공개

## 메타데이터

- 문서 상태: 작성완료
- 발행자: codex-4 전속부관 (**PM 대리인**, PO 직접 지시)
- 발행 시각: 2026-09-08 KST
- 우선순위: P0 (여행 중 노트북 OFF 열람)
- 상태: `blocked` — 구현·로컬 정적 게이트 완료, PM push·Pages 활성화·FE 0338 통합 대기
- 담당: `codex-2 플랫폼` `[INFRA]` 단독
- 대상: GitHub Actions·Pages 배포 파이프라인
- 기준 결정: D-009, D-011의 임시 정적 우회

## 확인된 현재 상태

- Cloudflare Pages 배포 코드는 준비돼 있지만 프로젝트 생성·도메인 연결·실배포가 끝나지 않았다. 2026-09-08 외부 확인에서 `https://workaround.co.kr`은 정상 TLS로 열리지 않았다.
- GitHub Actions에는 CI/릴리스만 있고 Pages 배포 워크플로가 없다. `https://lim-it-err.github.io/workaround.co.kr-platform/`은 404다.
- Line V의 도시 기록(V03)은 `localStorage`에 스탬프·메모를 저장한다.
- Blog District 글쓰기 스튜디오도 글·선택 글·보기 모드를 `localStorage`에 저장한다.
- 따라서 서버 API 없이도 같은 브라우저/프로필에서는 여행 메모와 글 초안을 작성·새로고침 복원할 수 있다. 다른 기기 동기화, 계정 백업, 브라우저 데이터 삭제 복구는 지원하지 않는다.

## 목표

Cloudflare 구축을 기다리지 않고 `https://lim-it-err.github.io/workaround.co.kr-platform/`에 모선 Vue 프런트를 먼저 공개한다. 여행 중에는 아래 두 기능을 노트북 전원과 무관하게 사용한다.

1. Line V 전체 일정·준비·도시 기록.
2. Blog District 글쓰기 스튜디오.

GitHub Pages는 정적 호스팅이므로 서버 API가 필요한 기능은 이번 1차 공개의 성공 조건이 아니다. 글과 여행 메모는 기기 로컬 저장임을 화면에서 분명히 알린다.

## 작업 내용

### A. GitHub Pages 자동 배포

1. `.github/workflows/deploy-github-pages.yml`을 추가해 `main` push와 수동 실행 시 `frontend`를 빌드하고 Pages artifact를 배포한다.
2. 공식 `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages` 흐름과 최소 권한(`contents: read`, `pages: write`, `id-token: write`)을 사용한다.
3. 빌드 명령에 GitHub project base `/workaround.co.kr-platform/`을 주입한다. 기본 base(`/`)의 Cloudflare 빌드 계약은 변경하지 않는다.
4. 배포 artifact에서 JS/CSS/assets, manifest/icon 경로가 project base를 가리키는지 자동 검사한다.
5. workflow 산출 단계에서 필요한 정적 `404.html` fallback을 생성해 새로고침 404를 막는다. 프런트 라우팅 코드 변경이 필요하면 이 티켓에서 건드리지 않고 TKT-DRAFT-0338의 입력으로 기록한다.
6. README에 공개 URL, 수동 workflow 실행법, Line V/Blog District 진입법을 적는다.

### B. 공개 산출물 계약

- 현재 Line V 11일 일정과 V01/V02/V03.
- TKT-DRAFT-20260908-0334의 공유 링크 전체 커버리지 및 9/8·9/9 독립 상세 세션.
- 현재 Blog District 읽기 화면과 글쓰기 스튜디오.
- Developer Advisor는 이번 GitHub Pages 공개 범위에서 제외한다. 기내에서는 로컬 실행한다.
- 정적 모드 격리·저장 고지·백업·프런트 라우팅 수정은 별도 TKT-DRAFT-0338의 소유다. 이 티켓 작업자는 해당 파일을 수정하지 않는다.

## 운영 계약

- 소스의 단일 진실은 `lim-it-err/workaround.co.kr-platform`의 `main`이다. 별도 여행 저장소나 `gh-pages` 수동 복사본을 만들지 않는다.
- PM이 main에 push하면 GitHub Pages workflow가 자동 갱신한다.
- Cloudflare Pages/D-011은 폐기하지 않고 여행 이후 후속 대표 도메인 작업으로 남긴다. 이번 P0에서는 Cloudflare 계정 단계가 선행 조건이 아니다.
- 배포 커밋 SHA/빌드 시각을 확인할 수 있게 한다.

## 범위

- 수정 허용: `.github/workflows/**`, `infra/public-site/**`, GitHub Pages 운영 문서·배포 검증 스크립트.
- 읽기: `docs/decisions.md`, `docs/network.md`, TKT-085, TKT-DRAFT-0334.
- 금지: `frontend/src/**`, `frontend/vite.config.js`, Developer Advisor 공개 배포, 홈서버 포트 공개, API 주소·토큰 하드코딩, 별도 저장소 복제, 계정/서버 동기화 신규 구현, PM 외 commit/push.

## 완료 기준

- `https://lim-it-err.github.io/workaround.co.kr-platform/`이 200을 반환하고 모선 첫 화면이 열린다.
- 배포 artifact의 루트 화면과 정적 자산 경로가 project base 아래에서 404 없이 열린다.
- main push 또는 workflow 수동 실행으로 재배포되고 배포 SHA를 확인할 수 있다.
- 기존 기본 base(`/`) 빌드 계약을 깨지 않고 GitHub Pages base(`/workaround.co.kr-platform/`) 빌드가 통과한다.
- 깊은 링크/새로고침, JS/CSS/assets, manifest/icon에 404가 없다.
- 토큰·계정 값이 git diff 및 Actions 로그에 노출되지 않는다.

## 질문/결정 기록

- [확정, PO, 2026-09-08] Cloudflare가 아직 구축되지 않았으므로 GitHub Pages로 먼저 공개한다.
- [확정, PO, 2026-09-08] 우선 공개 대상은 여행 콘텐츠와 글쓰기 기능이다.
- [확정, PO, 2026-09-08] 서버 저장이 제한되는 정적 상태를 이해하며, 여행 중 보이는 것이 우선이다.
- [잠정, PM 대리인] 글쓰기/여행 기록은 기존 localStorage를 사용하고 저장 범위를 화면에 명시하며, 파일 백업만 최소 추가한다.
- [잠정, PM 대리인] Cloudflare Pages는 후속 대표 원점으로 유지하되 이번 배포의 선행 조건에서 제외한다.
- [구현, codex-2, 2026-09-08] `main` push·수동 실행용 GitHub Pages workflow, project base 빌드, artifact 경로 검사, `404.html`/`.nojekyll`, `deployment.json` 생성을 추가했다.
- [차단, codex-2, 2026-09-08] 실제 URL은 현재 HTTP 404다. PM이 변경을 commit/push하고 repository Settings의 Pages source를 `GitHub Actions`로 활성화한 뒤 workflow를 실행해야 실배포 게이트를 닫을 수 있다.
- [차단, codex-2, 2026-09-08] 현재 checkout은 `codex/v0.6.0-line`이고 workflow trigger는 요청대로 `main`이다. PM이 이 변경을 `main`에 승격하기 전에는 자동 배포가 시작되지 않는다.
- [차단, codex-2, 2026-09-08] 현재 프런트의 blog 라우팅은 project base를 제거한 `/blog` 절대경로를 생성한다. 이 티켓 범위에서는 FE를 수정하지 않았으며 TKT-DRAFT-0338 완료 후 깊은 링크·새로고침 통합 게이트를 재실행해야 한다.

## 선행 조건

- 배포 workflow 작업은 즉시 가능하다. 여행용 최종 인수 검증은 TKT-DRAFT-0334와 TKT-DRAFT-0338 완료 후 다시 실행한다.
- GitHub repository Settings에서 Pages의 `GitHub Actions` 소스를 선택하는 단계는 PO/PM 계정 권한이 필요하다.

## 작업자 전달

- 타이머는 현재 비활성이다. PO가 수동 착수를 지시하면 `codex-2 플랫폼`이 이 티켓만 단독 수행하며 FE 파일은 수정하지 않는다.

## 구현 결과 (2026-09-08, codex-2)

- `.github/workflows/deploy-github-pages.yml`에서 `main` push와 `workflow_dispatch`를 받아 Node 22로 `frontend`를 빌드하고 GitHub Pages artifact를 배포한다.
- workflow 권한은 build의 `contents: read`, deploy의 `pages: write`·`id-token: write`로 분리했다.
- GitHub Pages 빌드에만 `/workaround.co.kr-platform/`을 주입해 기존 기본 base(`/`) 설정은 수정하지 않았다.
- `infra/public-site/prepare-github-pages.mjs`가 HTML의 로컬 JS/CSS/assets/manifest/icon 참조와 실제 파일 존재를 검사하고 SPA fallback·Jekyll 우회·배포 메타데이터를 만든다.
- 루트 및 공개 사이트 README에 공개 URL, 수동 실행법, Line V/Blog District 진입법, localStorage 한계를 기록했다.

## 검증 기록 (2026-09-08, codex-2)

- `node --check infra/public-site/prepare-github-pages.mjs`: 통과
- workflow YAML parse: 통과
- `npm --prefix frontend run build`: 통과(기본 base 회귀)
- `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/`: 통과
- artifact 준비·경로 검사: 통과(로컬 참조 2개, `404.html === index.html`)
- project base 정적 HTTP: 루트 200, JS 200, CSS 200, fallback 200, `deployment.json` 200
- 비밀값 패턴 검사 및 `git diff --check`: 통과
- 실제 `https://lim-it-err.github.io/workaround.co.kr-platform/`: HTTP 404(외부 배포 미실행)

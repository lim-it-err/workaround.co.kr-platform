문서 상태: 작성완료

# TKT-103 `[INFRA]` GitHub Pages 산출물에 advisor 정적 빌드 포함

- 상태: ready
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

(비어 있음)

문서 상태: 작성완료

# TKT-115 `[INFRA]` Pages `/next/` 미리보기 — 톤 브랜치 빌드를 트렁크 배포에 동봉

- 상태: ready · 우선순위: P1 · 담당: codex-2 · 의존: 없음
- scope: `.github/workflows/deploy-github-pages.yml`, `infra/public-site/prepare-github-pages.mjs`
- 브랜치: 작업은 `codex/v0.7.0-tone` 에서 하되 **워크플로 변경은 트렁크에도 필요** — need_review 시 PM 이 트렁크로 cherry-pick 한다.

## 목표
트렁크 배포 워크플로가 **`codex/v0.7.0-tone` 을 추가로 checkout·빌드**(base `/workaround.co.kr-platform/next/`)해 산출물 `next/` 로 병합한다. 라이브(트렁크)는 그대로, PO 는 `/next/` 에서 전환 진행분을 폰으로 본다. 톤 브랜치 push 도 트렁크 워크플로를 트리거하도록(`workflow_dispatch` 또는 브랜치 트리거 + 트렁크 checkout 고정).

## 완료 조건
1. `/next/` 루트 200, `/next/` 딥링크 폴백, 라이브 루트 회귀 0.
2. 톤 브랜치 없거나 빌드 실패 시 라이브 배포는 계속 성공(next 단계는 `continue-on-error`).

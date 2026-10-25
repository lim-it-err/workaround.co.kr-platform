문서 상태: 작성완료

# TKT-160 `[INFRA]` Pages 배포 후 스모크 — 정적 경로·Advisor alias 200 확인

- 상태: finished · **v0.8.2** · P2 · 담당: dev 서브에이전트 · 의존: TKT-115 와 워크플로 파일 공유(먼저 잡는 쪽이 `공유 파일:` 표기). 브랜치 **`codex/v0.8.2`**(작업 트리 `/Users/imjeonghan/newProject/wa-082`) — 워크플로 변경은 v0.8.2 PR 로 main 에.
- 근거: 배포 성공 = 아티팩트 업로드 성공일 뿐, 라이브 경로가 실제로 200 인지는 사람이 본다(AS-R006 ③ 404 SPA 폴백 관찰 이후 자동화 없음).
- scope: `.github/workflows/deploy-github-pages.yml`(deploy 뒤 `smoke` job), `infra/public-site/smoke-pages.mjs`(신규 — 경로 목록은 `frontend/src/staticRouting.js` 를 읽어 생성, 중복 하드코딩 금지).

## 완료 조건
1. [x] 정적 8경로 + `/advisor/`·`/advisor/today`·`/advisor/learn`·`/advisor/history` + 파비콘 + 404 폴백(임의 딥링크 → 200 HTML) 을 `curl -fsS` 로 확인, 하나라도 실패하면 job red(배포 자체는 유지).
2. [x] `workflow_dispatch` 로 톤 브랜치에서 dry-run 가능(115 와 겹치면 `공유 파일:`).
3. [x] 실행 시간 ≤1분, 결과를 job summary 표로.

## 구현 내역
- `infra/public-site/smoke-pages.mjs` 신규. 경로는 `staticRouting.js`(LIVE_PAGE_PATHS)·Advisor `routes.js` 를 직접 읽어 prepare 스크립트와 같은 제외 규칙(루트·blog*·/studio·/runtime·/ets2/dev)으로 생성. prepare 는 수정하지 않음(TKT-196 동시 작업).
- 확인 항목: 루트 200, 공개 경로(200 HTML), `/advisor/` 200 + today/learn/history, 파비콘(루트 HTML 의 link rel=icon), `deployment.json`(`--sha` 있을 때 commitSha 일치), 임의 깊은 경로·잠금 경로(/runtime·/ets2/dev·/blog·/studio) = 404 + 셸 마커 HTML. 실패 시 exit 1, 표 출력 + `GITHUB_STEP_SUMMARY` 마크다운 표.
- 옵션 `--expect-copies=false`: 공개·Advisor 하위 경로를 404 셸로 기대(복제 전 라이브용). 기본 true.
- 워크플로: `smoke` job(needs: deploy, contents: read, checkout·setup-node 만, 3회·20초 간격 재시도, 배포 되돌리지 않음). `workflow_dispatch` 입력 `smoke_url` 을 주면 build/deploy 를 건너뛰고 스모크만 실행.
- 공유 파일: `.github/workflows/deploy-github-pages.yml`(TKT-115 와 겹칠 수 있음), `infra/public-site/prepare-github-pages.mjs` 는 TKT-177 변경이 트리에 있을 뿐 이 티켓에선 미접촉.

## 검증
- 라이브(v0.8.1, 복제 전) `--expect-copies=false`: 19/19 통과, exit 0 (공개·Advisor 하위 경로 404 셸, 나머지 기대대로).
- 라이브 기본 모드(`expect-copies=true`): 9/19, 공개 7경로+Advisor 3경로 FAIL(404 셸), exit 1 — 복제 배포 전 기대된 실패.
- unit 29/29 통과, `git diff --check` 클린, 워크플로 YAML 은 python yaml 로 파싱 확인(jobs: build/deploy/smoke).
- 미검증: 실제 Actions 실행(CDN 지연 재시도 동작), 실행 시간 ≤1분은 로컬 기준 수 초.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-160-r1.md`.
- 없음.

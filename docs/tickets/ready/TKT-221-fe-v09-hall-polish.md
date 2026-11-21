문서 상태: 작성완료

# TKT-221 `[FE]` v0.9 환승 홀 손질 — 블로그 행 제거·부팅 로그 버전은 릴리스 버전으로

- 상태: ready · **P1 · v0.9.0** · 담당: dev 서브에이전트(Haiku 5.5 — 명세 완전) · 브랜치 `codex/v0.9.0`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: REV-TKT-219-r1 [중요]·[PM 의문], PO 2026-11-21 「둘 다 권하는대로 해」.
- scope: `frontend/src/data/hallBoard.js`, `frontend/src/components/hall/HallBoard.vue`(필요 시), `frontend/vite.config.js`, `.github/workflows/deploy-github-pages.yml`(환경값 한 줄), `infra/home/web.Dockerfile` 은 **건드리지 않는다**(v1.0.0 브랜치), E2E(`HallV09.e2e.mjs`·`blogClosed.e2e.mjs` 의 블로그 행 예외 제거).

## 완료 조건
1. 출발 안내판에서 블로그 「운행 중단」 행 삭제(7행). `blogClosed.e2e.mjs` 의 그 행 예외 코드 제거 — 블로그 문구 0 단언이 예외 없이 통과. 블로그 복귀(`BLOG_LINE_OPEN=true`) 때 행이 다시 생기게 할 필요 없음(복귀 시 별도 티켓).
2. 안내판 상태를 부팅 로그와 맞춤: 유로트럭 「샘플」, 운영 노트 「공개」(상태색은 운행과 같은 초록).
3. 부팅 로그 버전: `__APP_VERSION__` 을 루트 `VERSION` 대신 **빌드 환경값 `RELEASE_VERSION`**(예: `0.9.0`)에서 읽는다. 값이 없으면 버전 없이 `workaround 기동`. 배포 워크플로 빌드 단계에 `RELEASE_VERSION` 을 PR 제목/브랜치가 아닌 **고정 방식**으로 주는 방법: 워크플로 `env` 에 저장소 변수 `vars.RELEASE_VERSION` 를 쓰고 없으면 빈 값. E2E 는 값 있음/없음 두 경우.
4. 게이트: build, unit, `e2e:all`(기준 121/20/0), `git diff --check`, 375 캡처 2장(안내판·로그) 경로.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- (대기)

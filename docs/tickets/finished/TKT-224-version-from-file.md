문서 상태: 작성완료

# TKT-224 `[INFRA]` 부팅 로그 버전 = 저장소 `VERSION` 파일 하나로

- 상태: finished · **P1 · v0.9.1** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.1`(작업 트리 `/Users/imjeonghan/newProject/wa-090`, main a84bf7c 에서 분기).
- 근거: PO 2026-11-22 「이거 왜 내가 해야되지? 버전명? 이게 깃허브에서 하면 좋은게 뭔데?」 — TKT-221 은 버전을 GitHub 저장소 변수(`vars.RELEASE_VERSION`)로, TKT-223 은 .100 `.env` 로 받아 **두 곳을 PO 가 손으로** 맞춰야 한다. 버전은 저장소 루트 `VERSION` 파일 하나로 관리하고 PM 이 릴리스 PR 에서 올린다.
- scope: `frontend/vite.config.js`, `VERSION`, `infra/home/web.Dockerfile`, `infra/home/web.Dockerfile.dockerignore`(필요 시), `infra/home/docker-compose.yml`, `infra/home/.env.example`, `infra/home/README.md`, `.github/workflows/deploy-github-pages.yml`(RELEASE_VERSION 줄만).

## 완료 조건
1. `frontend/vite.config.js` `readVersion()`: `process.env.RELEASE_VERSION` 이 비어 있지 않으면 그 값(덮어쓰기용), 아니면 **저장소 루트 `VERSION` 파일**(vite.config 기준 `../VERSION`)의 첫 줄 trim, 파일이 없으면 빈 값. 주석의 「VERSION 파일은 읽지 않는다」 문구 교체.
2. 루트 `VERSION` = `0.9.1`.
3. `web.Dockerfile`: 빌드 단계에 `COPY VERSION VERSION`(→ `/repo/VERSION`, vite.config 가 `../VERSION` 으로 찾는 위치). `ARG RELEASE_VERSION` 은 덮어쓰기용으로 유지하되 기본 빈 값. dockerignore 가 VERSION 을 막지 않는지 확인.
4. compose·`.env.example`·README: 「버전은 `VERSION` 파일에서 자동, `.env` 의 `RELEASE_VERSION` 은 덮어쓸 때만」으로 문구 정리.
5. Pages 워크플로: `RELEASE_VERSION: ${{ vars.RELEASE_VERSION }}` 줄은 **삭제**(변수 없이 VERSION 파일 사용). 주석 한 줄로 이유.
6. 검증: `npm --prefix frontend run build` 후 `grep -o '0\.9\.1' frontend/dist/assets/*.js` 1건 이상; `RELEASE_VERSION=9.9.9-x npm --prefix frontend run build` → `9.9.9-x` 포함; `HOME_WEB_PORT=18092 docker compose -p tkt224 build web` 후 컨테이너 안 `/srv/site/assets` 에 `0.9.1` 포함(`docker run --rm --entrypoint sh home-web:local -c "grep -o 0.9.1 -r /srv/site/assets | head -1"`); 단위 테스트 `npm --prefix frontend test`(있으면) 통과; `git diff --check`. 이미지·컨테이너 정리.

## 구현 메모
(dev) 변경 파일 — `frontend/vite.config.js`(readVersion: RELEASE_VERSION → `../VERSION` 첫 줄 → 빈 값, 주석 교체) · `VERSION`(0.8.3 → 0.9.1) · `infra/home/web.Dockerfile`(`COPY VERSION VERSION` 추가, ARG RELEASE_VERSION 기본 빈 값 유지) · `infra/home/docker-compose.yml`·`infra/home/.env.example`·`infra/home/README.md`(문구를 「VERSION 자동, RELEASE_VERSION 은 덮어쓸 때만」으로) · `.github/workflows/deploy-github-pages.yml`(RELEASE_VERSION 줄 삭제 + 이유 주석 한 줄).
- `infra/home/web.Dockerfile.dockerignore` 는 수정 불필요: VERSION 을 막는 항목 없음(node_modules·dist·.git·.github·docs·design·reports·tmp·.env*).
- 루트 `.dockerignore` 없음(해당 없음).
- `npm --prefix frontend test` 는 frontend/package.json 에 test 스크립트가 없어 실행하지 않음(「있으면」 조건 미충족).
- board.md 는 PM 지시대로 건드리지 않음. 보드 줄 이동은 PM 몫.
- 확신 없는 점: Pages 워크플로에서 `actions/checkout` 이 루트 VERSION 을 포함하는지(전체 checkout 이라 포함으로 본다). 워크플로 실행은 하지 않았다.

## 검증
- `npm --prefix frontend run build` — 성공 (`dist/assets/index-*.js`), `grep -o '0\.9\.1' frontend/dist/assets/*.js` = 1건.
- `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — 성공 (Pages base).
- `RELEASE_VERSION=9.9.9-x npm --prefix frontend run build` — 성공, 번들에 `9.9.9-x` 포함 확인. 이후 기본 빌드를 다시 해 `0.9.1` 복원 확인.
- `HOME_WEB_PORT=18092 docker compose -f infra/home/docker-compose.yml -p tkt224 build web` — 성공. `docker run --rm --entrypoint sh home-web:local -c "grep -o 0.9.1 -r /srv/site/assets | head -1"` → `/srv/site/assets/index-BcOwGx2v.js:0.9.1`.
- `docker compose -f infra/home/docker-compose.yml -p tkt224 config -q` — 구문 OK.
- `git diff --check` — 출력 없음(rc=0).
- 정리: `home-web:local` 이미지 삭제, `docker image prune -f`, tkt224 컨테이너 0개. `infra/home/.env` 생성하지 않음(환경변수만 사용).
- UI 변경 없음(빌드 설정·문서·워크플로만) → 375/1440 실렌더 대상 아님. 스크린샷 없음.
- 단위 테스트: test 스크립트 없음, 미실행.

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)
- 게이트 픽스: HallV09.e2e.mjs 부팅 로그 기대값에 버전 허용(PM 승인 범위 확장) — 기대 버전은 RELEASE_VERSION 우선, 없으면 루트 VERSION 첫 줄로 계산.

- r1 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-224-r1.md`

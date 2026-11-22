문서 상태: 작성완료

# TKT-223 `[INFRA]` 집 PC 웹 이미지 = Pages 와 같은 정적 빌드 + 버전 표기

- 상태: finished · **P1 · v0.9.0** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.0`(작업 트리 `/Users/imjeonghan/newProject/wa-090`, main 병합 7d60e23 포함).
- 근거(PM 점검 2026-11-22): `infra/home/web.Dockerfile` 이 `npm run build -- --base=/` 로만 빌드한다. `frontend/src/App.vue:39` 의 `isStaticMode` 는 `VITE_STATIC_MODE === 'true' || base !== '/'` 이므로 **.100 이미지는 라이브 모드**가 된다 → 게이트웨이 없이(기본 구성) `/api/*` 를 부르고, Caddy 는 `/api/work-manager/*` 를 403·나머지는 502 로 돌려준다. Pages(base `/workaround.co.kr-platform/`)는 정적 모드라 이 문제가 없다. 또 TKT-221 의 부팅 로그 버전(`RELEASE_VERSION`)이 .100 빌드에는 전달되지 않는다.
- 결정(PM): **.100 웹은 Pages 와 같은 정적 모드로 빌드한다**(D-037 「당분간 .100 서빙」의 화면 동작 = Pages 와 동일). 게이트웨이를 실제로 화면에 연결하는 일은 별도 결정·티켓(이번 범위 밖).
- scope: `infra/home/web.Dockerfile`, `infra/home/docker-compose.yml`(web 의 build args 만), `infra/home/.env.example`, `infra/home/README.md`, 필요 시 `infra/home/web.Dockerfile.dockerignore`. **프런트 소스(`frontend/src/**`)는 수정 금지** — 필요해 보이면 질문/에스컬레이션.

## 완료 조건
1. `web.Dockerfile` 메인 프런트 빌드에 `VITE_STATIC_MODE=true` 를 준다(ARG `STATIC_MODE` 기본 `true` 로 받아 ENV 로 넘겨도 됨). Advisor 빌드는 지금 그대로 두되, Advisor 에 정적 모드 플래그가 따로 있는지 확인해 결과를 구현 메모에.
2. `RELEASE_VERSION` 을 build arg 로 받아 메인 프런트 빌드 환경에 넘긴다(기본 빈 값 → 부팅 로그 「workaround 기동」). compose web `build.args` 에 `RELEASE_VERSION: ${RELEASE_VERSION:-}`. `.env.example` 에 `RELEASE_VERSION=`(설명 주석, 예: `0.9.0`).
3. Pages 준비 스크립트 `infra/public-site/prepare-github-pages.mjs` 가 dist 에 **추가·변형하는 것**(404 폴백, 데이터 복사, 메타 등)을 읽고, .100 이미지에 빠져서 화면이 달라지는 것이 있으면 목록으로 구현 메모에. 빠진 것이 화면에 영향을 주면 Dockerfile 에서 같은 처리를 하거나(스크립트를 base `/` 로 호출할 수 있으면 그것), 불가하면 질문/에스컬레이션.
4. README 「빌드」 절에 정적 모드인 이유 한 단락, 버전 넣는 법(`.env` 의 `RELEASE_VERSION` → `docker compose build web`).
5. 검증(맥 Docker 사용 가능, 임시 포트로 — 예 `HOME_WEB_PORT=18090`):
   - `RELEASE_VERSION=0.9.0-test` 로 web 만 빌드·기동 → 경로별 HTTP 코드 표: `/health`, `/`, `/pantry`, `/voyage`, `/work`, `/runtime`, `/advisor/today`, 존재하지 않는 경로(SPA 폴백), `/api/tickets`(403).
   - Playwright(또는 기존 E2E 도구)로 `/`·`/work` 실렌더 확인: 부팅 로그 첫 줄에 `workaround 0.9.0-test 기동`, **브라우저가 `/api/` 로 요청을 보내지 않음**(네트워크 기록으로 확인 — 0건이어야 함), 콘솔 에러 0. 375·1440 캡처 각 1장을 `docs/tickets/captures/TKT-223/`.
   - `RELEASE_VERSION` 없이 다시 빌드 → 첫 줄 `workaround 기동`.
   - `git diff --check`, 끝나면 `docker compose down`.

## 구현 메모
- 완료 조건 1~5 충족. 바뀐 파일: `infra/home/web.Dockerfile`(ARG STATIC_MODE=true → ENV VITE_STATIC_MODE, ARG RELEASE_VERSION → ENV, 블로그 목업 정리 RUN, route-rules.mjs COPY), `docker-compose.yml`(web build.args RELEASE_VERSION), `.env.example`, `README.md`(「빌드 — 정적 모드와 버전」 소절, 2번 절 안). dockerignore 변경 없음(infra 는 제외 대상 아님).
- Advisor: `services/advisor/frontend` 에 정적 모드 플래그(VITE_STATIC_MODE 류) 없음(grep: vite.config·src 0건) → 그대로 둠.
- prepare-github-pages.mjs 가 dist 에 하는 일 vs .100: (a) 경로별 index.html 복제·`404.html` 폴백·advisor `404.html` = Caddy `try_files … /index.html` 폴백이 대신함(화면 동일). (b) `.nojekyll`·`deployment.json` = Pages 전용, 불필요. (c) **블로그 스위치(BLOG_LINE_OPEN=false) 시 `mockups/blog-*.html`·writing-studio.html 삭제** = .100 에는 빠져 있었다(닫힌 블로그 목업이 URL 로 노출) → Dockerfile 에서 route-rules.mjs 의 `readBlogLineOpen`/`isBlogMockupFile` 를 재사용해 같은 삭제 수행(스크립트 자체는 base 를 Pages 값으로 강제해 `/` 로 호출 불가). 확인: `/mockups/blog-post.html` 404, `/mockups/home.html` 200. (d) 잠금 경로(`/runtime`·`/ets2/dev`)는 Pages 에선 복제 안 해 404 셸이지만 .100 은 SPA 폴백으로 200 → 앱 안에서 정적 라우팅이 처리. 차이로 남김(아래 질문).
- 경로표(RELEASE_VERSION=0.9.0-test, 포트 18090): /health 200 · / 200 · /pantry 200 · /voyage 200 · /work 200 · /runtime 200 · /advisor/today 200 · /nope/xyz 200(SPA 폴백) · /api/tickets 403 · /mockups/blog-post.html 404 · /mockups/home.html 200.
- Playwright(375·1440 × `/`·`/work`): `/api/` 요청 0건, 콘솔·pageerror 0. `/` 환승 홀 로그 첫 줄 `[ 0.000] workaround 0.9.0-test 기동`. RELEASE_VERSION 없이 재빌드 → `[ 0.000] workaround 기동`, 같은 0건·0 에러. `/work` 는 환승 홀 로그가 없는 화면이라 렌더(운영 노트 본문)·네트워크만 확인.
- 캡처: `docs/tickets/captures/TKT-223/{home,work}-{375,1440}.png`(0.9.0-test 빌드). 직접 본 것: home 375 는 출발 안내판 표, work 375 는 운영 노트 정상, 가로 overflow·영어 간판 없음. 1440 home 은 캡처 시점에 안내판 하단 탭(노선도/승강장) 아래가 비어 보임(애니메이션 직후 — 확신 없음, 프런트 소스 범위 밖).
- 게이트: `git diff --check` 깨끗, `docker compose down` 완료, infra/home/.env 만들지 않음(임시 환경변수만 사용).

## 질문/에스컬레이션
- [구체화 질문] `/runtime`(Pages 에서는 잠금 404 셸)이 .100 에서는 200(SPA 폴백 후 앱이 처리). 같은 잠금 동작을 원하면 Caddyfile 에 해당 경로 처리가 필요하나 이번 scope 밖 — 필요 시 후속 티켓.

## 질문/에스컬레이션
(없음)

## 리뷰 기록
- r1 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-223-r1.md`

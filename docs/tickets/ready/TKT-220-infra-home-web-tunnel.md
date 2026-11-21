문서 상태: 작성완료

# TKT-220 `[INFRA]` 집 PC(.100) 웹 컨테이너 — Docker Compose + Cloudflare Tunnel 로 사이트 직접 서빙

- 상태: ready · **P1 · v1.0.0** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v1.0.0`(작업 트리 `/Users/imjeonghan/newProject/wa-100`, main 기준).
- 근거: **D-037**(PO 2026-11-21 「일단은 100서버에서 cloudflare tunnel로 직접 웹을 보여줄수있잖아. 그런 형태로.」). 기존 `infra/public-site/docker-compose.public-site.yml`(cloudflared·gateway 프로필), `infra/README.md`.
- scope: 신규 `infra/home/`(Dockerfile·compose·Caddyfile·`.env.example`·README), `infra/README.md` 한 줄. 프런트·게이트웨이 소스 수정 금지.

## 목표
`.100`(Windows + Docker Desktop/WSL2)에서 `docker compose up -d` 한 번으로 메인 사이트(+ Advisor)가 뜨고, cloudflared 가 바깥 도메인으로 내보낸다. 공개 포트는 열지 않는다(터널만, 아웃바운드).

## 완료 조건
1. **web 이미지** `infra/home/web.Dockerfile`: 멀티 스테이지 — node 20 으로 `frontend` 를 base `/`, `services/advisor/frontend` 를 base `/advisor/` 로 빌드 → `caddy:2` 계열에 정적 파일. Caddy: 알려진 정적 경로는 그대로, 그 밖의 경로는 `index.html`(Advisor 는 `/advisor/index.html`) 로 SPA 폴백, `/health` 200, `/api/*` 는 `gateway:8080` 으로 프록시(게이트웨이가 안 떠 있으면 502 그대로 — 화면은 정적 폴백으로 동작). 정적 자산 장기 캐시, `index.html` no-cache, gzip/zstd.
2. **compose** `infra/home/docker-compose.yml`: `web`(127.0.0.1:${HOME_WEB_PORT:-8090} 로만 바인드 — LAN 노출 금지), `gateway`(기존 빌드 재사용, 프로필 `api`, 기본은 꺼짐), `cloudflared`(프로필 `tunnel`, `TUNNEL_TOKEN` 은 `.env` 에서만, 이미지 태그 **고정 버전**), 모두 `restart: unless-stopped`, web healthcheck.
3. **비밀값 경계**: 저장소에는 `.env.example`(빈 값·설명)만. 토큰·도메인 계정 정보·개인 경로는 어디에도 쓰지 않는다. `.gitignore` 에 `infra/home/.env`.
4. **README** `infra/home/README.md`: .100 에서의 순서 — 사전조건(Docker Desktop·WSL2), `.env` 만들기, `docker compose up -d --build`, 상태 확인(`docker compose ps`, `curl http://127.0.0.1:8090/health`), 업데이트(`git pull` → `up -d --build`), 터널 켜기(`--profile tunnel`), Cloudflare 쪽에서 PO 가 할 일(터널 생성·Public Hostname 을 `http://web:80` 으로) — 명령은 PowerShell/bash 둘 다. 끄면 사이트가 내려간다는 점과 GitHub Pages 가 비상 주소로 남는다는 점 명시.
5. **검증(맥)**: Docker 데몬이 있으면 `docker compose -f infra/home/docker-compose.yml up -d --build` 후 `/`, `/pantry`, `/voyage`, `/work`, `/advisor/today`, 없는 경로, `/health` 의 HTTP 코드와 첫 화면 렌더(Playwright 1장)를 기록하고 내린다. 데몬이 없으면 이미지 빌드 대신 Caddyfile `caddy validate`(컨테이너 불가 시 생략) + 정적 빌드 두 개 + 경로 표를 기록하고 「맥 미검증 → .100 에서 PO 확인」 을 티켓에 명시. `git diff --check`.

## 구현 메모
- GitHub Pages 배포(`deploy-github-pages.yml`)는 그대로 둔다(비상 주소).
- 블로그 닫힘(`BLOG_LINE_OPEN=false`)·`/runtime`·`/ets2/dev` 등 공개 제외 경로 규칙은 `infra/public-site/route-rules.mjs` 와 어긋나지 않게(복제 대신 SPA 폴백이므로 앱이 처리).
- lab 실시간 API(`lab-api`)는 이 티켓 범위 밖 — compose 에 자리만 주석으로.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- (대기)

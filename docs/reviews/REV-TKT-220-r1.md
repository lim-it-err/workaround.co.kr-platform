문서 상태: 작성완료

# REV-TKT-220-r1 — 집 PC 웹 컨테이너 (PM 판정: **통과**)

- 판정: PM(Claude Opus 5.5), 2026-11-21 · 구현: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v1.0.0`.
- 서브에이전트는 맥 Docker 데몬이 꺼져 있어 컨테이너 검증을 못 했고, **PM 이 Docker Desktop 을 켜고 직접 검증**했다.

## PM 직접 실행 (맥 arm64, Docker 24.0.2)
- `docker compose -f infra/home/docker-compose.yml build web` 통과(약 26초), 이미지 안 `caddy validate` → `Valid configuration`. 이미지 64.4MB.
- `up -d web` 후 실제 응답: `/` `/pantry` `/voyage` `/work` `/advisor` `/advisor/` `/advisor/today` `/no/such/page` `/health` → 200 · `/assets/nope.js` → 404 · `/api/x` → 502(게이트웨이 꺼짐, 의도대로).
- `/advisor/today` 는 Advisor 번들(`/advisor/assets/…`)을 내준다. `index.html` `Cache-Control: no-cache`, 해시 자산 `public, max-age=31536000, immutable`, `text/javascript`, `nosniff`.
- `cloudflare/cloudflared:2025.11.1` 태그 실제 존재(pull 성공). `docker compose config` 기본·api·tunnel 프로필 통과(서브에이전트).
- 검증 뒤 `down` 완료. `git diff --check` 통과.

## 미검증 (.100 에서 PO)
- Windows Docker Desktop/WSL2 에서의 빌드·기동, 실제 터널 연결(토큰 필요), gateway 프로필 기동.

## 지적
- [제안] 화이트채플(`/arcade/whitechapel`)은 이 이미지에 없다 — v0.10 화이트채플 편입 티켓에서 추가.
- [제안] .100 은 x86_64 — 이미지는 거기서 다시 빌드되므로 문제없지만, 맥에서 만든 이미지를 옮기지 말 것(README 에 이미 「.100 에서 build」).

# 집 PC(.100) 웹 이미지 — 메인 사이트(base /) + Advisor(base /advisor/) 정적 빌드 → Caddy
# 빌드 컨텍스트는 저장소 루트다 (compose 가 context: ../.. 로 지정).
# Advisor 가 ../../../../../frontend/src 를 import 하므로 두 프런트를 저장소 경로 그대로 복사한다.

FROM node:20-alpine AS build
WORKDIR /repo

COPY frontend/package.json frontend/package-lock.json frontend/
COPY services/advisor/frontend/package.json services/advisor/frontend/package-lock.json services/advisor/frontend/
RUN npm --prefix frontend ci --no-audit --no-fund \
 && npm --prefix services/advisor/frontend ci --no-audit --no-fund

COPY frontend frontend
COPY services/advisor/frontend services/advisor/frontend
RUN npm --prefix frontend run build -- --base=/ \
 && npm --prefix services/advisor/frontend run build -- --base=/advisor/

FROM caddy:2-alpine
COPY --from=build /repo/frontend/dist /srv/site
COPY --from=build /repo/services/advisor/frontend/dist /srv/site/advisor
COPY infra/home/Caddyfile /etc/caddy/Caddyfile
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
EXPOSE 80

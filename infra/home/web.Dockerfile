# 집 PC(.100) 웹 이미지 — 메인 사이트(base /, 정적 모드) + Advisor(base /advisor/) 정적 빌드 → Caddy
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
COPY infra/public-site/route-rules.mjs infra/public-site/route-rules.mjs
# TKT-224: 버전은 저장소 루트 VERSION 파일이 단일 출처다. vite.config 가 ../VERSION 으로 읽는다(/repo/VERSION).
COPY VERSION VERSION

# TKT-223: 메인은 Pages 와 같은 정적 모드로 빌드한다 (base 가 / 라서 VITE_STATIC_MODE 로 강제).
# 게이트웨이 없이 /api/* 를 부르지 않게 하려는 것 — 이유는 README 「빌드」.
ARG STATIC_MODE=true
# TKT-221·TKT-224: 부팅 로그 버전 덮어쓰기용. 기본은 빈 값 → VERSION 파일 사용. 비우면 VERSION 파일, 그것도 없으면 「workaround 기동」.
ARG RELEASE_VERSION=
ENV VITE_STATIC_MODE=${STATIC_MODE} \
    RELEASE_VERSION=${RELEASE_VERSION}
RUN npm --prefix frontend run build -- --base=/ \
 && npm --prefix services/advisor/frontend run build -- --base=/advisor/

# Pages 준비 스크립트(prepare-github-pages.mjs)가 하는 일 중 .100 에 필요한 것만: 블로그 스위치가
# 닫혀 있으면 dist/mockups 의 블로그 목업을 지운다. (경로별 index.html 복제·404.html 은 Caddy SPA 폴백이 대신한다.)
RUN node --input-type=module -e "import {readBlogLineOpen,isBlogMockupFile} from './infra/public-site/route-rules.mjs'; import {readdirSync,rmSync} from 'node:fs'; if(!readBlogLineOpen()){const d='frontend/dist/mockups'; for(const f of readdirSync(d)){ if(isBlogMockupFile(f)){ rmSync(d+'/'+f); console.log('removed',f) } } }"

FROM caddy:2-alpine
COPY --from=build /repo/frontend/dist /srv/site
COPY --from=build /repo/services/advisor/frontend/dist /srv/site/advisor
COPY infra/home/Caddyfile /etc/caddy/Caddyfile
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
EXPOSE 80

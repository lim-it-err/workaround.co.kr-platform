문서 상태: 작성완료

# REV-TKT-223-r1 — 집 PC 웹 이미지 정적 빌드 + 버전 표기

- 판정: **통과** (블로커 0) · PM 2026-11-22 · 구현 dev 서브에이전트(Sonnet 5.5)
- PM 직접 검증(서브에이전트와 별도 프로젝트명·포트): `RELEASE_VERSION=0.9.0-pm HOME_WEB_PORT=18091 docker compose -p tkt223pm build web && up -d web`

| 요청 | 코드 |
|---|---|
| /health, /, /work, /runtime, /advisor/today, /nope(SPA 폴백) | 200 |
| /api/tickets | 403 |
| /api/health (게이트웨이 꺼짐) | 502 — 정적 모드라 화면은 호출하지 않음 |
| /mockups/blog-post.html | 404 (블로그 스위치 닫힘, Pages 와 동일) |

- 번들 `assets/index-*.js` 에 `0.9.0-pm` 포함 확인. 브라우저(1280)로 `/` 실렌더: 부팅 로그 → 출발 안내판 7행, 네트워크 `/api/` 요청 **0건**.
- `/runtime` 직접 진입 → 정적 모드 라우팅이 환승 홀로 돌려보냄(Pages 와 같은 동작) — 서브에이전트 [구체화 질문] 「/runtime 200」 은 HTTP 수준만 본 것이고 화면은 잠겨 있다. Caddy 처리 불필요.
- 블로그 목업 삭제를 `route-rules.mjs` 재사용으로 Dockerfile 에서 처리 — Pages 규칙과 한 곳에서 관리되어 적절.

## [제안]
- `[제안]` 1440 캡처 안내판 아래 빈 영역은 v0.9 프런트(TKT-219) 레이아웃 문제이지 이 티켓 범위가 아니다 — v0.9 PR 실화면 점검 때 함께 본다.

## [PM 의문]
- 없음(화면 변화 없는 인프라 티켓).

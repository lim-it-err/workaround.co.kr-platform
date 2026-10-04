# 직속 지시함 — codex-7 유로트럭 기관사 (`.100` Windows, 저장소 안 인박스)

> PM 이 쓴다. 규칙: `services/ets2-adas/AGENTS.md`. 브랜치 `codex/ets2-win`(네 전용, push 허용). 맥 레인과 겹치는 파일은 건드리지 않는다.

## 현재 지시 (의존 순서)

1. **`TKT-167` [ETS2-WIN]** — PoC 편입 마감 + R2 퍼블리셔 + `POC_ALLOWED_ORIGINS`. 실게임에서 퍼블리셔 5분 실행 로그를 `docs/qa/env100/` 에. R2 자격은 PO(Q-018) — 없으면 `DRY_RUN` 까지.
2. **`TKT-171` [ETS2-WIN]** (171 은 backlog → 167 뒤 PM 이 ready 로) — OBS → MediaMTX(Docker, `.100`) → WHEP/HLS. 공개 경로는 PM 결정(Tunnel 또는 Cloudflare Stream Live). 네 몫은 `.100` 쪽 송출·서버·지연 측정.
3. 이후: ADAS 후속(차선 인식 어댑터·FFB/핸들 검증)은 PO 지시가 오면 PM 이 티켓으로.

## 금지
- `frontend/**`·`services/advisor/**` 수정, `main`·`codex/v0.8.0-live` push, 비밀값 커밋.

문서 상태: 작성완료

# TKT-175 `[INFRA]` 개발자 페이지 LAN 접근 — 게이트웨이/Caddy 프록시 `/api/ets2/*` → `.100:8765` (보호 구역 인증)

- 상태: backlog · P2 · 담당: codex-2 · 의존: TKT-167·174 finished, 자가 호스팅 스택 기동(085 또는 로컬 compose). 브랜치 `codex/v0.8.0-live`.
- 대안(선행, 코드 0): SSH 포워드 `ssh -p 6445 -L 8765:127.0.0.1:8765 <user>@192.168.123.100` + `POC_ALLOWED_ORIGINS`. 이 티켓은 그 다음.

## 완료 조건
1. [ ] `/api/ets2/state`·`/api/ets2/frame.jpg`·`/api/ets2/action` 프록시, Origin 재작성, 보호 구역 인증 뒤에만.
2. [ ] `Ets2Dev.vue` 가 `VITE_ETS2_DEV_API` 대신 상대 경로 `/api/ets2` 를 쓰는 모드.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

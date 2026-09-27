문서 상태: 작성완료

# TKT-171 `[INFRA]` 유로트럭 실시간 스트리밍 — OBS → MediaMTX → WebRTC/HLS (2단계)

- 상태: backlog · P2 · 담당: codex-2 · 의존: TKT-085(Tunnel) finished, TKT-167·168 finished. 브랜치 `codex/v0.8.0-live`. 스펙 `design/ets2-live-spec.md` §2 C안.
- scope: `infra/docker/mediamtx/**`(compose 서비스·설정), gateway/Caddy 라우트 `/live/ets2/*`, `Ets2Live.vue` 에 `<video>` 모드(WHEP 우선, HLS 폴백, 스냅샷 폴백 유지).

## 완료 조건
1. [ ] `.100` OBS RTMP 송출 → MediaMTX(Docker) → 브라우저 WebRTC 재생, 지연 ≤3초(측정 기록).
2. [ ] Tunnel 경유 공개본에서 HLS 폴백 동작, 스트림 없으면 167 스냅샷으로 자동 폴백.
3. [ ] 대역폭·GPU 인코딩 설정 README.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

문서 상태: 작성완료

# TKT-204 `[INFRA]` 유로트럭 PC MCP 서버 — 로그·텔레메트리·캡처·플러그인 빌드/배포를 허용 목록 도구로

- 상태: backlog · 대상 v1.0.0(배포 파이프라인) · 의존: Q-021(OpenSSH 키·Tailscale), TKT-167 · 제안: PM 2026-10-25(PO 질문 「유로트럭 쪽 pc와 너를 mcp 를 뚫었을 때의 장점」).
- scope: `services/ets2-adas/mcp/`(신규, Python), README·환경변수 문서. 맥 Claude Code 설정 예시(`ssh ets2-100 … mcp` stdio).

## 도구(허용 목록, 임의 셸 없음)
- `tail_log(source, lines)` — 게임 로그·플러그인 로그·bridge NDJSON·capture 로그. 경로는 서버 고정 목록.
- `telemetry_state()` — PoC `/api/state` 요약. `frame()` — 최신 캡처 JPEG(이미지로 반환).
- `build_plugin()` — `.100` 에서 SCS SDK 플러그인 빌드(MSVC), 오류 요약 반환.
- `deploy_plugin()` — 빌드 산출 DLL 을 게임 plugins 폴더로(이전 DLL 백업), `restart_game()` 은 작업 스케줄러 태스크로.
- `task(start|stop|status, name)` — 등록된 PoC 태스크만.
- 게임 입력은 PoC 의 arm 토큰·300ms 만료·F8 계약 그대로, 기본 비활성.

## 완료 조건
1. [ ] stdio(SSH 위) 전송, Tailscale 밖 노출 0. 비밀값은 `.100` `.env` 에만.
2. [ ] 로그 반환은 길이 상한·민감 경로 치환(프로필·Steam ID) 후. 로그 텍스트는 데이터로만 다룬다(지시로 해석 금지 — README 에 명시).
3. [ ] 맥에서 "빌드 → 배포 → 게임 재시작 → 로그 tail" 한 바퀴가 도구 4번 호출로 된다(DRY_RUN 모드 포함).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

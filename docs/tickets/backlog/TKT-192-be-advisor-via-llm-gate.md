문서 상태: 작성완료

# TKT-192 `[BE]` Advisor `claude` 프로필 → llm-gate 경유(서비스 토큰), 키 제거

- 상태: backlog · P2 · 담당: dev 서브에이전트(Sonnet) · 의존: TKT-191. 설계 `docs/llm-gate.md` §2·§3(T3).
- scope: `services/advisor/service/**`(LLM 어댑터·설정·테스트), `services/advisor/README.md`.

## 완료 조건
1. [ ] `ClaudeLlmProvider` 대신(또는 옆에) `GateLlmProvider` — 기능 ID(`advisor.review`·`advisor.chat`)와 변수만 보낸다. `ANTHROPIC_API_KEY` 의존 제거, `LLM_GATE_URL`·`LLM_GATE_TOKEN` 환경변수.
2. [ ] 게이트 429·503·차단기 응답 → 기존 mock 폴백 경로로 퇴화(화면 오류 0).
3. [ ] 계약 테스트(목 서버) + `./run.sh test` 그린.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

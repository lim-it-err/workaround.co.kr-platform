# TKT-086

## 메타데이터
- 제목: 플랫폼 챗봇 — RTX5070 Ollama 질의 (gateway 경유)
- 우선순위: P2 / 상태: `backlog` (TKT-068 RTX5070 구동 선행) / 문서 상태: 작성완료
- 담당: `[BE]`(게이트웨이 정책 경로) + 후속 `[FE]`(위젯) / scope: `gateway/**`
- 근거: D-009 4원칙

## 목표
공개 사이트에서 쓸 수 있는 질의 기능의 서버 경로: `POST /api/chat` → rate limit(IP당) + 동시 1~2 큐 + 입력 길이 상한 + 서버측 고정 템플릿 → RTX5070 Ollama. 다운 시 degraded 응답. **Ollama 직접 노출 절대 금지.**

## 완료 게이트
- mock Ollama 로 단위테스트: rate limit 초과 429, 큐 대기, 템플릿 주입(사용자 입력이 시스템 프롬프트를 못 바꿈), 다운 시 503+원인

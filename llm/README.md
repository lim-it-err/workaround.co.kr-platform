# LLM

LLM 관련 설정과 정책 문서를 두는 디렉터리다.

## 기준

- MVP 는 Ollama 가 기본 compose 스택 밖의 RTX5070 노드에서 실행된다고 가정한다.
- 서비스는 Ollama 에 직접 붙지 않고 워커 또는 게이트웨이 정책 경로를 사용한다.
- Ollama 가 내려가더라도 나머지 플랫폼은 계속 동작해야 한다.

LLM 토폴로지나 가용성 동작을 바꾸기 전에는 `docs/ollama-policy.md` 를 먼저 읽는다.

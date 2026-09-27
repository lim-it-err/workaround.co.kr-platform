# Ollama 정책

## 역할

Ollama는 모델 추론이 필요한 작업에 LLM 기능을 제공한다. MVP에서는 외부 RTX5070 노드에서 실행되는 것을 기본으로 본다.

## 기본 토폴로지

기본 플랫폼 스택은 Ollama를 직접 띄우지 않는다. 워커와 헬스체크는 아래 경로로 연결한다.

```text
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

위 값은 “같은 PC 안의 Docker Compose 컨테이너가 호스트 Ollama 를 본다”는 기본값이다. 별도 RTX5070 장비를 LAN 에 분리했다면 `http://rtx5070-host:11434` 또는 고정 IP URL 로 바꾼다. 호스트에서 직접 점검할 때는 `http://localhost:11434` 를 사용한다.

## 가용성

RTX5070 장비는 게임이나 GPU 집약 작업에 사용될 수 있다. 따라서 Ollama는 플랫폼 전체를 내리지 않고도 stop 가능해야 한다.

Ollama가 unavailable일 때는 아래 규칙을 따른다.

- 헬스 엔드포인트는 `unavailable` 또는 `degraded` 를 보고한다.
- LLM 티켓은 필요 시 `waiting_llm` 상태로 둔다.
- 비LLM 서비스는 계속 동작해야 한다.
- 워커는 짧은 무한 재시도 루프에 빠지면 안 된다.

현재 worker 기준 세부 구분은 아래처럼 둔다.

- `ok`: `/api/tags` 같은 헬스 경로가 제때 2xx 응답을 준다.
- `degraded`: timeout, 5xx, 예상 밖 응답 오류처럼 “응답은 있으나 믿기 어려운” 상태다.
- `unavailable`: 연결 실패, 설정 누락처럼 “접근 자체가 안 되는” 상태다.

기본 재시도 힌트는 `OLLAMA_RETRY_AFTER_SECONDS=30` 초이며, `waiting_llm` 티켓은 `result.retryNotBefore` 시각이 지난 뒤에만 다시 본다.

## 호스트 운영 절차

RTX5070 호스트에서는 아래 순서를 기본 운영 절차로 둔다.

1. `infra/rtx5070-host/preflight.ps1 -AsJson` 으로 Docker/GPU/WSL2 준비 상태를 확인한다.
2. `infra/rtx5070-host/ollama-runtime.ps1 -Action start -AsJson` 으로 Ollama 컨테이너를 띄운다.
3. `infra/rtx5070-host/ollama-runtime.ps1 -Action pull-models -Models qwen2.5-coder:7b,qwen2.5:7b -AsJson` 으로 첫 모델을 준비한다.
4. `infra/rtx5070-host/ollama-runtime.ps1 -Action health -AsJson` 으로 `/api/tags` 기반 헬스를 확인한다.
5. 게임이나 다른 GPU 작업이 필요하면 `infra/rtx5070-host/ollama-runtime.ps1 -Action stop -AsJson` 으로 중지한다.

현재 수집된 `nvidia-smi` 기준 VRAM 이 약 12GB 이므로 첫 모델은 7B 급 1~2개부터 시작한다.

## 접근 정책

서브서비스는 Ollama를 직접 호출하지 않는다. 워커 실행 경로나 게이트웨이 정책 경로를 사용한다. 그래야 가용성 처리, fallback, 향후 모델 라우팅을 한 곳에서 관리할 수 있다.

## 노드 타깃 계약

- `ion2`: 기본 로컬 제어 노드
- `rtx5070`: 외부 GPU 추론 노드
- LLM 티켓은 기본적으로 `targetNode=rtx5070` 와 `targetRuntime=ollama` 조합을 권장한다.
- 게이트웨이 `GET /api/runtime` 는 위 노드 타깃 계약과 Ollama 상태 표현을 프런트엔드/운영 화면에 전달하는 기준 endpoint 다.

## 향후 GPU compose

나중에 RTX5070 서버에서 직접 Ollama를 띄우기 위한 `docker-compose.gpu.yml` 경로를 둘 수 있다. 다만 이것은 기본 MVP 스택에 포함되지 않는다.

호스트 Docker/GPU 준비 자체는 `infra/rtx5070-host/` 아래 preflight, `ollama-runtime.ps1`, 체크리스트로 먼저 검증한다.

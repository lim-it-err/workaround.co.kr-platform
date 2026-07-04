# Ollama

외부 RTX5070 Ollama 연결 정책과 향후 런타임 구성을 설명한다.

## MVP 기본값

컨테이너 안의 worker/gateway 가 같은 PC 호스트 Ollama 를 볼 때 기본 연결 주소는 아래와 같다.

```text
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

게임이나 GPU 집약 작업 때문에 Ollama 를 내려도 기본 플랫폼은 계속 동작해야 한다.

별도 RTX5070 장비를 LAN 에 붙였을 때만 `http://rtx5070-host:11434` 같은 별도 주소를 사용한다. 호스트에서 직접 점검할 때는 `http://localhost:11434` 를 쓴다.

## 가용성 기준

- Ollama 중단은 플랫폼 전체 장애로 간주하지 않는다.
- 워커와 게이트웨이는 degraded 또는 unavailable 상태를 처리할 수 있어야 한다.
- `v0.2.0` 통합 결과물인 `http://localhost:7000` 에서도 이 상태가 보이되, 전체 진입점이 막히면 안 된다.

## Compose 오버레이

RTX5070 기반 Ollama 컨테이너 경로가 필요하면 `infra/docker-compose.gpu.yml` 오버레이를 사용한다.

호스트 Docker/GPU 준비 점검은 `infra/rtx5070-host/preflight.ps1` 와 `infra/rtx5070-host/README.md` 를 먼저 본다.

실제 운영 명령은 `infra/rtx5070-host/ollama-runtime.ps1` 로 통일한다.

## 권장 첫 모델

현재 수집된 `nvidia-smi` 기준 RTX5070 호스트 VRAM 이 약 12GB 이므로 첫 모델은 7B 급부터 시작한다.

- 코드 보조: `qwen2.5-coder:7b`
- 일반 질의/요약: `qwen2.5:7b`

처음부터 여러 대형 모델을 동시에 keep-alive 하지 말고, 7B 급 1~2개만 올린 뒤 지연 시간과 메모리 여유를 본다.

## 운영 절차

```text
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/preflight.ps1 -AsJson
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action start -AsJson
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action pull-models -Models qwen2.5-coder:7b,qwen2.5:7b -AsJson
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action health -AsJson
```

게임이나 다른 GPU 집중 작업 전에는 아래처럼 중지한다.

```text
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action stop -AsJson
```

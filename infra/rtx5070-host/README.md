# RTX5070 호스트 준비

RTX5070 장비에서 Docker 기반 GPU 런타임을 올리기 전 점검 절차와, 이후 Ollama 서빙을 실제로 운영하는 표준 명령을 함께 둔다.

이 폴더는 `TKT-007`, `TKT-008` 범위의 호스트 운영 기준선이다.

## 기본 가정

- 기본 권장 경로는 Windows 호스트 + Docker Desktop + WSL2 GPU 연동이다.
- Linux 호스트라면 같은 체크리스트를 참고하되, Docker Desktop 대신 Docker Engine + NVIDIA Container Toolkit 경로를 사용한다.
- RTX5070 호스트는 게임이나 다른 GPU 작업 때문에 언제든 내려갈 수 있으므로, 플랫폼 기본 스택은 이 호스트가 없어도 계속 동작해야 한다.

## 파일

- `preflight.ps1`: Docker, GPU 드라이버, WSL2, Docker GPU smoke 준비 상태를 점검하는 PowerShell 스크립트
- `ollama-runtime.ps1`: RTX5070 호스트에서 Ollama 컨테이너 시작/중지/재시작/모델 pull/헬스 확인을 수행하는 PowerShell 스크립트

## 권장 순서

1. NVIDIA 드라이버가 최신 상태인지 확인한다.
2. `nvidia-smi` 가 정상 응답하는지 확인한다.
3. Windows 라면 WSL2 가 설치되어 있고 Docker Desktop 이 WSL2 backend 로 동작하는지 확인한다.
4. Docker Desktop 또는 Docker Engine 이 재부팅 후 자동 시작되는지 확인한다.
5. `preflight.ps1` 를 먼저 실행해 빠진 항목을 찾는다.
6. 가능하면 `-RunDockerGpuSmoke` 옵션으로 `docker run --gpus all ... nvidia-smi` 검증까지 수행한다.
7. 실제 Ollama compose 경로는 `infra/docker-compose.gpu.yml` 과 `ollama-runtime.ps1` 절차로 이어간다.

## 실행

기본 점검:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/preflight.ps1 -AsJson
```

Docker GPU smoke 포함:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/preflight.ps1 -RunDockerGpuSmoke -AsJson
```

Ollama 컨테이너 시작:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action start -AsJson
```

초기 모델 pull:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action pull-models -Models qwen2.5-coder:7b,qwen2.5:7b -AsJson
```

헬스만 확인:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action health -AsJson
```

게임이나 다른 GPU 작업 전 중지:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action stop -AsJson
```

로그 확인:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action logs -AsJson
```

## Ollama 운영 기준

- 호스트에서 직접 확인할 때 기본 URL 은 `http://localhost:11434` 다.
- 같은 PC 안의 Docker Compose 컨테이너가 호스트 Ollama 를 볼 때는 `http://host.docker.internal:11434` 를 기본값으로 둔다.
- 별도 RTX5070 장비를 LAN 에 붙였다면 `http://rtx5070-host:11434` 또는 고정 IP 기반 URL 로 바꾼다.
- 현재 수집된 `nvidia-smi` 기준 VRAM 이 약 12GB 이므로 첫 모델은 7B 급 한두 개로 시작한다.
- 기본 권장 조합은 아래와 같다.
  - 코드 작업: `qwen2.5-coder:7b`
  - 일반 작업: `qwen2.5:7b`
- 14B 급 이상은 같은 환경에서 바로 기본값으로 두지 않고, 실제 지연/메모리 여유를 본 뒤 후속 티켓에서 검토한다.

## 워커가 소비할 상태 값 예시

`ollama-runtime.ps1 -Action health -AsJson` 결과는 아래 상태 표현을 기준으로 삼는다.

- `composeFileExists`, `runtimePrerequisites.dockerAvailable`, `nextSteps[]` 를 함께 보면 현재 실패가 "컨테이너 미기동"인지 "Docker 자체 부재"인지 빠르게 구분할 수 있다.

- `health.workerStatus=ok`
  - `/api/tags` 가 2xx 응답을 줌
  - 모델 목록을 읽을 수 있음
- `health.workerStatus=degraded`
  - timeout 또는 5xx/비정상 응답
  - 워커는 `waiting_llm` 재시도 힌트를 유지할 수 있음
- `health.workerStatus=unavailable`
  - 연결 실패, 컨테이너 미기동, URL 오류
  - 워커는 즉시 실패 대신 `waiting_llm` 로 돌릴 수 있음

예시:

```json
{
  "action": "health",
  "health": {
    "status": "ok",
    "workerStatus": "ok",
    "category": "healthy",
    "url": "http://localhost:11434/api/tags",
    "modelCount": 2,
    "models": [
      "qwen2.5-coder:7b",
      "qwen2.5:7b"
    ]
  }
}
```

## Windows 호스트 메모

- Docker Desktop 설치 뒤 `Settings > General > Start Docker Desktop when you log in` 을 켠다.
- `com.docker.service` 시작 유형이 `Automatic` 인지 확인한다.
- `wsl --status` 에서 기본 버전이 2 인지 확인한다.
- GPU 연동 검증은 아래 명령을 기본값으로 쓴다.

```powershell
docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
```

## Linux 호스트 메모

- Docker Engine 설치 뒤 서비스 자동 시작을 켠다.
- NVIDIA Container Toolkit 설치 뒤 `docker run --rm --gpus all ...` 명령이 성공하는지 본다.
- 배포형 호스트라면 재부팅 뒤 `systemctl status docker` 와 GPU smoke 명령을 다시 확인한다.

## 오케스트레이터 확인 증거

아래 항목을 캡처하거나 기록해 두면 검토가 쉬워진다.

- `preflight.ps1 -AsJson` 결과
- `ollama-runtime.ps1 -Action health -AsJson` 결과
- `nvidia-smi` 출력
- `docker version`, `docker compose version` 출력
- `docker run --rm --gpus all ... nvidia-smi` 출력
- 재부팅 후 Docker 서비스 자동 시작 여부
- `docker compose -f infra/docker-compose.gpu.yml --profile gpu up -d` 직후 컨테이너 상태
- 첫 모델 pull 결과와 `/api/tags` 응답

## 수동 단계와 위험

- Docker 설치, WSL2 설치, 재부팅, BIOS/드라이버 조정은 수동 단계다.
- 사내 보안 정책이나 Windows 정책이 Docker Desktop 자동 시작을 막을 수 있다.
- GPU 드라이버 업데이트 후 재부팅이 필요할 수 있다.
- `docker run --gpus all` 검증은 이미지 pull 을 동반할 수 있어 네트워크 연결이 필요하다.
- `ollama pull` 도 모델 다운로드를 위해 네트워크 연결이 필요하다.
- 실제 서빙 중에는 한 번에 많은 모델을 keep-alive 하지 말고 7B 급 1~2개부터 시작하는 편이 안전하다.

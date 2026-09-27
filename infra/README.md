# 인프라

로컬 개발과 이후 배포 기반을 위한 인프라 설정을 둔다.

## 파일

- `docker-compose.yml`: Redis, 게이트웨이, 샘플 서비스, 워커 1개를 올리는 기본 로컬 스택
- `docker-compose.gpu.yml`: RTX5070 기반 Ollama 런타임용 선택 오버레이
- `public-site/`: `workaround.co.kr` 공개 소개 페이지용 compose/Caddy 배포 번들
- `rtx5070-host/`: RTX5070 호스트 Docker/GPU preflight 와 Ollama 운영 스크립트
- `.env.example`: 로컬 환경 변수 예시
- `redis/redis.conf`: 첫 워커 루프용 로컬 Redis 설정

## 현재 기준

- 기본 스택은 워커 1개를 로컬에서 실행할 수 있어야 한다.
- 기본 스택은 Ollama 실행을 필수로 요구하지 않는다.
- GPU 모델 서빙은 GPU 오버레이를 명시적으로 사용할 때만 켠다.
- `http://localhost:7000` 은 기본 compose 포트가 아니라 `v0.2.0` 통합 결과물 목표다.
- `ion2-worker` 는 현재 두 모드를 지원한다.
  - `gateway-polling`: 게이트웨이 티켓 API를 직접 폴링하는 기존 스캐폴드 경로
  - `redis-streams`: Redis Streams consumer group(`platform:tickets` / `platform-workers`)을 읽는 최소 런타임 경로

## 로컬 시작

```text
cd infra
copy .env.example .env
docker compose up --build
```

기본 `.env` 는 `WORKER_RUNTIME_MODE=gateway-polling` 이므로, 현재 게이트웨이 인메모리 티켓 저장소를 기준으로 첫 전체 루프를 확인하기 쉽다.

## Redis Streams 모드

Redis Streams mock 티켓 런타임을 보려면 아래처럼 worker 모드를 바꾼다.

```text
cd infra
copy .env.example .env
set WORKER_RUNTIME_MODE=redis-streams
docker compose up --build
```

별도 터미널에서 mock 티켓을 enqueue 한다.

```text
cd workers/ion2-worker
set REDIS_HOST=127.0.0.1
python enqueue_mock_ticket.py
```

처리 결과는 아래 결과 stream 에 기록된다.

```text
platform:tickets:results
```

현재 게이트웨이는 아직 Redis Streams 에 티켓을 직접 쓰지 않으므로, 이 모드는 `TKT-006` 기준의 최소 워커 런타임 smoke 경로로 본다.

실 Redis 없이 로직만 먼저 재현하려면 아래 smoke 스크립트를 사용한다.

```text
cd workers/ion2-worker
python smoke_redis_stream.py
```

Ollama unavailable / degraded 상황에서 LLM 티켓만 `waiting_llm` 으로 보내고 비LLM 티켓은 계속 처리되는지 보려면 아래 smoke 스크립트를 사용한다.

```text
cd workers/ion2-worker
python smoke_ollama_degraded.py
```

## GPU 시작

```text
cd infra
copy .env.example .env
docker compose -f docker-compose.gpu.yml --profile gpu up -d
```

RTX5070 호스트 준비 상태를 먼저 점검하려면 아래 preflight 를 사용한다.

```text
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/preflight.ps1 -AsJson
```

Docker GPU smoke 포함:

```text
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/preflight.ps1 -RunDockerGpuSmoke -AsJson
```

호스트에서 Ollama 운영을 표준화하려면 아래 스크립트를 사용한다.

```text
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action start -AsJson
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action pull-models -Models qwen2.5-coder:7b,qwen2.5:7b -AsJson
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action health -AsJson
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action stop -AsJson
```

기본 URL 기준은 아래처럼 나눈다.

- 호스트에서 직접 점검: `http://localhost:11434`
- 같은 PC 안의 컨테이너에서 접근: `http://host.docker.internal:11434`
- 별도 RTX5070 장비로 분리했을 때: `http://rtx5070-host:11434`

## 참고

- 현재 저장소는 게이트웨이가 아직 인메모리 티켓 저장소를 쓰더라도 Redis를 워커 런타임 인프라로 유지한다.
- `OLLAMA_BASE_URL` 은 GPU 오버레이로 로컬 Ollama를 띄우지 않는 한 RTX5070 호스트를 가리켜야 한다.
- Windows 에서 `set WORKER_RUNTIME_MODE=redis-streams` 는 현재 셸 한 세션에만 적용된다.

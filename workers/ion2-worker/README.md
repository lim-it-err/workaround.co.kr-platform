# ion2 워커

`v0.1.0` 스캐폴드에서 시작한 소형 티켓 워커다. 현재는 gateway polling 과 Redis Streams 두 런타임 모드를 함께 지원한다.

## 책임

- 게이트웨이 또는 Redis Streams 에서 대기 중인 티켓을 읽는다.
- gateway polling 모드에서는 실행 전에 티켓을 `claim` 처리한다.
- 서비스 헬스를 확인한다.
- 결과 payload 와 함께 티켓을 완료/실패 처리하거나 결과 stream 에 기록한다.
- 작업 전 문서와 히스토리를 읽고, 작업 후 완료 기록을 남긴다.

## 런타임 모드

### `gateway-polling`

- 게이트웨이 티켓 API를 직접 폴링한다.
- 현재 인메모리 티켓 저장소를 쓰는 게이트웨이 기준 첫 전체 루프를 검토하기 쉽다.
- 기존 `claim` / `complete` / `fail` 흐름을 유지한다.

### `redis-streams`

- Redis Streams consumer group 으로 `platform:tickets` 를 직접 읽는다.
- 결과는 `platform:tickets:results` stream 에 기록한다.
- 현재 게이트웨이가 Redis Streams 에 직접 쓰지 않기 때문에, 이 모드는 mock ticket smoke 와 단일 워커 런타임 검증 경로로 본다.
- 실 Redis 없이 로컬 재현만 필요하면 `smoke_redis_stream.py` 가 가짜 Redis/HTTP 서버를 띄워 `enqueue_mock_ticket.py` 와 `worker.py` 를 함께 검증한다.

## LLM 저하 흐름

- 아래 조건 중 하나면 worker 는 해당 티켓을 LLM 의존 작업으로 본다.
  - `type` 이 `job.llm.` 로 시작
  - `payload.requiresLlm=true`
  - `payload.inferenceProvider=ollama`
  - `payload.targetRuntime=ollama`
- `OLLAMA_BASE_URL` 이 비었거나 연결 실패면 `unavailable`
- timeout, 5xx, 예기치 않은 응답 오류면 `degraded`
- LLM 티켓에서 Ollama 가 `ok` 가 아니면 gateway polling 모드에서는 티켓을 `waiting_llm` 으로 보내고, stream 모드에서는 결과 stream 에 `waiting_llm` 결과를 기록한다.
- `retryNotBefore` 시각이 지나기 전에는 `waiting_llm` 티켓을 다시 집지 않는다.

## 환경 변수

- `GATEWAY_BASE_URL`: 기본값 `http://localhost:8080`
- `PLATFORM_API_KEY`: 기본값 `dev-key`
- `WORKER_POLL_INTERVAL_SECONDS`: 기본값 `5`
- `WORKER_ONCE`: `true` 로 설정하면 한 번만 처리하고 종료
- `WORKER_RUNTIME_MODE`: `gateway-polling` 또는 `redis-streams`, 기본값 `gateway-polling`
- `ELEVATOR_SERVICE_URL`: 기본값 `http://localhost:8003`
- `SAMPLE_SPRING_SERVICE_URL`: 기본값 `http://localhost:8002`
- `REDIS_HOST`: 기본값 `localhost`
- `REDIS_PORT`: 기본값 `6379`
- `REDIS_DATABASE`: 기본값 `0`
- `REDIS_STREAM_KEY`: 기본값 `platform:tickets`
- `REDIS_RESULTS_STREAM_KEY`: 기본값 `platform:tickets:results`
- `REDIS_CONSUMER_GROUP`: 기본값 `platform-workers`
- `REDIS_CONSUMER_NAME`: 기본값 `ion2-worker`
- `REDIS_READ_BLOCK_MS`: 기본값 `1000`
- `OLLAMA_BASE_URL`: 기본값 빈 값, 외부 Ollama 런타임 주소
- `OLLAMA_HEALTH_PATH`: 기본값 `/api/tags`
- `OLLAMA_TIMEOUT_SECONDS`: 기본값 `2`
- `OLLAMA_RETRY_AFTER_SECONDS`: 기본값 `30`

## 로컬 실행

gateway polling 모드:

```text
python worker.py
```

Redis Streams 단발 모드:

```text
set WORKER_RUNTIME_MODE=redis-streams
set WORKER_ONCE=true
python worker.py
```

mock ticket enqueue:

```text
python enqueue_mock_ticket.py
```

실 Redis 없이 worker 전체 경로를 검증하려면 아래 smoke 스크립트를 사용한다.

```text
python smoke_redis_stream.py
```

Ollama 응답 구분과 `waiting_llm` degraded 흐름을 같이 보려면 아래 smoke 스크립트를 사용한다.

```text
python smoke_ollama_degraded.py
```

## 컨테이너 실행

`infra/docker-compose.yml` 로도 실행할 수 있다. 이 경우 worker 는 `redis`, `gateway`, `elevator-service`, `sample-spring-service` 와 컨테이너 호스트명으로 통신한다.

## 구현 메모

- Redis Streams 클라이언트는 외부 패키지 없이 stdlib socket 기반 최소 RESP 구현으로 유지한다.
- 현재 목적은 `TKT-006` 의 최소 워커 런타임과 mock ticket smoke 경로를 제공하는 것이다.
- gateway 가 Redis Streams 에 직접 쓰는 본격 경로는 후속 티켓에서 이어간다.

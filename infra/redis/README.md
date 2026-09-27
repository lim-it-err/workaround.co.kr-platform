# Redis

Redis 설정과 첫 워커 런타임용 보조 파일을 둔다.

## 역할

- Redis Streams 를 저장소의 기본 티켓 큐 백엔드로 사용한다.
- 기본 큐 이름은 `docs/ticket-policy.md` 의 정책을 따른다.

```text
stream: platform:tickets
consumer group: platform-workers
results stream: platform:tickets:results
```

## 현재 범위

- 현재 `v0.1.0` 게이트웨이는 인메모리 티켓 저장소를 사용한다.
- `TKT-006` 기준으로는 워커가 Redis Streams consumer group 을 직접 읽는 최소 런타임과 mock ticket smoke 절차를 먼저 제공한다.
- 이후 gateway 가 Redis Streams 에 티켓을 직접 쓰는 경로는 별도 후속 티켓에서 맞춘다.

## mock ticket smoke

실제 gateway 연동이 아니라 Redis Streams 최소 런타임만 보고 싶으면 아래 절차를 따른다.

1. `infra/docker-compose.yml` 로 `redis`, `gateway`, `elevator-service`, `sample-spring-service`, `ion2-worker` 를 띄운다.
2. `WORKER_RUNTIME_MODE=redis-streams` 로 worker 를 시작한다.
3. `workers/ion2-worker/enqueue_mock_ticket.py` 로 샘플 티켓을 `platform:tickets` 에 넣는다.
4. worker 는 서비스 헬스를 점검하고 결과를 `platform:tickets:results` 에 기록한 뒤 원본 entry 를 ack 한다.
5. 실 Redis 없이 재현만 필요하면 `workers/ion2-worker/smoke_redis_stream.py` 로 가짜 Redis/HTTP 서버 기반 smoke 를 먼저 돌릴 수 있다.

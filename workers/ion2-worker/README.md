# ion2 Worker

Small ticket worker used by the v0.1.0 scaffold.

## Responsibilities

- Poll queued tickets from the gateway.
- Claim a ticket before execution.
- Probe the sample services.
- Complete or fail the ticket with a result payload.
- Read docs and history before starting work.
- Record completed work in the dated history file after finishing.

## Runtime

- Uses the gateway ticket APIs.
- Checks the sample Python service and sample Spring service through their `/health` endpoints.
- Skips non-HTTP descriptors such as the worker itself.
- Degrades cleanly when a service is unavailable so the orchestrator can review the handoff.

## Environment Variables

- `GATEWAY_BASE_URL`: defaults to `http://localhost:8080`
- `PLATFORM_API_KEY`: defaults to `dev-platform-key`
- `WORKER_POLL_INTERVAL_SECONDS`: defaults to `5`
- `WORKER_ONCE`: set to `true` to process one cycle and exit
- `SAMPLE_PYTHON_SERVICE_URL`: defaults to `http://localhost:8001`
- `SAMPLE_SPRING_SERVICE_URL`: defaults to `http://localhost:8002`

## Local Run

```text
python worker.py
```

The worker is intentionally small so the first end-to-end loop is easy to inspect and replace later with a Redis Streams consumer.

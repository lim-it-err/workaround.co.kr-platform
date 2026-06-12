# Network Policy

## Local Network Shape

The MVP stack should use Docker Compose for local development. The expected local services are:

- `frontend`
- `gateway`
- `redis`
- `sample-python-service`
- `sample-spring-service`
- `ion2-worker`

The external RTX5070 Ollama server is not part of the default compose stack.

## Local Ports

The v0.1.0 scaffold uses these local ports:

- `frontend`: `http://localhost:5173`
- `gateway`: `http://localhost:8080`
- `sample-python-service`: `http://localhost:8001`
- `sample-spring-service`: `http://localhost:8002`
- `ion2-worker`: worker CLI, no direct HTTP port

## HTTP First

Service-to-service communication should use HTTP first. This keeps sub-services language independent and easy to replace.

Expected route shape:

```text
frontend -> gateway -> services
worker -> gateway or services when a job requires it
worker -> external Ollama only for LLM job execution
```

## Gateway Routing

Sub-services should be exposed through gateway routes such as:

```text
/api/services/{serviceId}/**
```

The gateway may also expose service metadata and health through:

```text
/api/services
/api/health
```

## External Ollama

Ollama should be configured by environment variable:

```text
OLLAMA_BASE_URL=http://rtx5070-host:11434
```

When Ollama is unavailable, the platform should return a degraded or unavailable health state instead of crashing.

## Secrets

Do not commit real secrets. Commit only `.env.example` style files with placeholder values.

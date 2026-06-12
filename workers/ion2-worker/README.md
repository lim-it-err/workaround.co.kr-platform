# ion2 Worker

Placeholder for the first ticket subscriber worker.

## Responsibilities

- Subscribe to Redis Streams tickets.
- Execute typed jobs.
- Update ticket status.
- Handle retries.
- Check external Ollama health for LLM jobs.

LLM jobs should degrade gracefully when the RTX5070 Ollama server is unavailable.

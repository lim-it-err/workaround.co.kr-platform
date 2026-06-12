# Ollama Policy

## Role

Ollama provides LLM capability for jobs that need model inference. The MVP assumes Ollama runs on an external RTX5070 node.

## Default Topology

The default platform stack does not start Ollama. Workers and health checks connect to it through:

```text
OLLAMA_BASE_URL=http://rtx5070-host:11434
```

## Availability

The RTX5070 machine may be used for gaming or other GPU-heavy work. Ollama can be stopped without taking down the platform.

When Ollama is unavailable:

- Health endpoints should report `unavailable` or `degraded`.
- LLM tickets should move to `waiting_llm` when appropriate.
- Non-LLM services should continue working.
- Workers should avoid tight retry loops.

## Access Policy

Sub-services should not call Ollama directly. Use worker execution or a gateway-controlled policy path. This keeps availability handling, fallback behavior, and future model routing centralized.

## Future GPU Compose

A future `docker-compose.gpu.yml` may be added for running Ollama directly on the RTX5070 server. That is not part of the default MVP stack.

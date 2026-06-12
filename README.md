# workaround.co.kr Platform

Personal service platform monorepo for small user-facing services, ticket-driven automation, and optional LLM-assisted workers.

## Goal

This repository is a personal service platform. Vue is the final user-facing UI. Spring Boot is used as an API Gateway, router, and ticket issuer. Each sub-service under `services/` is an independent project and may use its own language and runtime.

Codex acts as a docs-first project manager: it keeps platform decisions clear, issues implementation-ready tickets, and updates documentation whenever architecture, APIs, service contracts, environment variables, or runtime behavior changes.

## Repository Layout

```text
personal-platform/
├─ frontend/                 # Vue.js final user-facing UI
├─ gateway/                  # Spring Boot API Gateway / Router / Ticket issuer
├─ services/                 # Independent sub-services in any language
│  ├─ sample-python-service/
│  └─ sample-spring-service/
├─ workers/                  # Ticket subscribers / job executors
│  └─ ion2-worker/
├─ llm/
│  └─ ollama/                # External RTX5070 Ollama connection policy
├─ infra/
│  ├─ nginx/
│  └─ redis/
├─ docs/                     # Architecture and operating policies
└─ README.md
```

## MVP Scope

The first MVP includes:

- Vue frontend shell with a Seoul subway inspired service navigation concept.
- Spring Boot Gateway for auth, routing, ticket creation, and health checks.
- Redis Streams as the ticket queue.
- One worker subscriber for ticket execution.
- Sample Python service and sample Spring service.
- External Ollama health check for an RTX5070 node.

Actual service implementation is intentionally separate from this first documentation and folder-structure pass.

## Architecture Summary

```text
User -> Vue frontend -> Spring Gateway -> sub-services
Codex -> Spring Gateway Ticket API -> Redis Streams -> workers
workers -> external RTX5070 Ollama when an LLM job requires it
```

Spring should not accumulate heavy business logic. It should remain the gateway, router, ticket issuer, and health aggregation layer. Sub-services own feature logic and stay independently dockerized.

## Documentation Index

- [Architecture](docs/architecture.md)
- [Network](docs/network.md)
- [Ticket Policy](docs/ticket-policy.md)
- [Service Policy](docs/service-policy.md)
- [Ollama Policy](docs/ollama-policy.md)
- [Frontend UX](docs/frontend-ux.md)
- [History](docs/history/README.md)

## Working Rule

Before changing this repository, read `AGENTS.md` and the relevant documents under `docs/`. If implementation and documentation disagree, finish the work by making them agree.

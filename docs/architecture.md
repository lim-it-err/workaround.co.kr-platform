# Architecture

## Platform Intent

This repository is a personal service platform monorepo. It should make it easy to add many small services while keeping routing, tickets, worker execution, and LLM availability policy understandable.

## Main Flow

```text
User -> Vue frontend -> Spring Gateway -> sub-services
Codex -> Spring Gateway Ticket API -> Redis Streams -> workers
workers -> external RTX5070 Ollama when needed
```

## Components

### frontend

`frontend/` contains the Vue final user-facing UI. It presents available services, system health, ticket status, and service navigation.

### gateway

`gateway/` contains Spring Boot. Its responsibility is to provide:

- API routing to sub-services.
- Development authentication.
- Ticket creation and status APIs.
- Health aggregation for services, Redis, workers, and Ollama.

The gateway should not become the home for feature-specific business logic.

### services

`services/` contains independent sub-services. Each service may use Python, Spring, Node, Go, Java, or another runtime. Each service owns its own implementation, Dockerfile, and README.

### workers

`workers/` contains subscribers that execute tickets from Redis Streams. Workers may call sub-services or external systems when a ticket type requires it.

### llm

`llm/ollama/` documents the external RTX5070 Ollama setup. The MVP assumes Ollama is reached through an external URL rather than started by the default compose stack.

### infra

`infra/` contains local infrastructure configuration such as Docker Compose, Redis, Nginx, and future deployment support.

## MVP Boundary

The first MVP should include the Vue shell, Spring Gateway, Redis Streams, one worker, sample Python service, sample Spring service, and Ollama health checks. Deeper product services should be added later as independent sub-services.

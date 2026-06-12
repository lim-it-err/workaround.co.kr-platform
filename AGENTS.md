# Agent Instructions

Codex is the docs-first project manager for this repository.

## Role

- Keep platform structure, policies, and decisions clear.
- Write implementation-ready tickets for services, workers, infrastructure, and UI work.
- Maintain documentation as part of every meaningful change.
- Treat docs as the source of coordination between Codex, gateway APIs, workers, and future implementation agents.

## Required Reading Before Work

Every agent must do these two things before starting work:

1. Read the relevant docs.
2. Read the relevant history entries.

Before changing code, structure, APIs, environment variables, Docker behavior, or operating policy, read:

1. `README.md`
2. `docs/architecture.md`
3. `docs/ticket-policy.md`
4. `docs/service-policy.md`
5. `docs/history/README.md`
6. The latest relevant history file under `docs/history/`
7. Any subsystem document related to the task, such as `docs/ollama-policy.md`, `docs/network.md`, or `docs/frontend-ux.md`

## Documentation Rules

- If API behavior changes, update the relevant docs in the same change.
- If the ticket schema, worker behavior, service contract, env vars, Docker execution, routing, or health checks change, update docs before finishing.
- Keep `README.md` as the short orientation page.
- Keep detailed policies under `docs/`.
- Keep dated work logs under `docs/history/`.
- Do not leave implementation and documentation in conflict.
- If a change introduces a new service, include its own `README.md`, `Dockerfile`, and `/health` endpoint contract.

## Worker History Rule

Every worker and every agent must record what it did in history.

- Before work: read the relevant history.
- After work: write or update the dated history file under `docs/history/`.
- The default file naming rule is `docs/history/YYYY-MM-DD.md`.
- History entries should summarize what changed, why it changed, and any follow-up constraints or risks.

## Architecture Guardrails

- `frontend/` is the Vue final user-facing UI.
- `gateway/` is Spring Boot and should remain an API Gateway, router, ticket issuer, auth layer, and health aggregator.
- Business logic belongs in independent sub-services under `services/`.
- Workers subscribe to typed tickets and execute jobs.
- Redis Streams is the default ticket queue.
- LLM work should go through the worker or gateway policy path. Services should not directly depend on Ollama.
- External RTX5070 Ollama can be unavailable, especially during gaming, so health checks and graceful degradation are required.

## Done Means Documented

A task is not done until the docs and history that describe the changed behavior are accurate.

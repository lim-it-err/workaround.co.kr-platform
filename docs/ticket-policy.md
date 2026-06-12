# Ticket Policy

## Purpose

Tickets are the coordination unit between Codex, the Spring Gateway, Redis Streams, and workers.

Codex should behave like a project manager: create clear typed jobs through the Gateway Ticket API and let subscriber workers execute them.

## Queue Backend

Use Redis Streams for MVP ticket delivery.

Default names:

```text
stream: platform:tickets
consumer group: platform-workers
```

## Ticket Shape

A typed job ticket should include:

```json
{
  "id": "ticket-id",
  "type": "job.type",
  "payload": {},
  "status": "queued",
  "priority": 5,
  "requestedBy": "codex",
  "createdAt": "2026-06-12T00:00:00Z",
  "updatedAt": "2026-06-12T00:00:00Z",
  "attempts": 0,
  "maxAttempts": 3,
  "result": null,
  "error": null
}
```

## Runtime Status Values

Supported MVP runtime statuses:

- `queued`
- `running`
- `completed`
- `failed`
- `retrying`
- `waiting_llm`
- `cancelled`

## Repository Ticket Lifecycle

Repository work tickets live under `docs/tickets/` and use these states:

- `backlog`
- `need_review`
- `finish`

State rules:

- Orchestrator creates and prioritizes tickets in `backlog`.
- Workers pick tickets from `backlog`, implement code on a branch, test the work, and move the ticket to `need_review`.
- Orchestrator reviews and tests tickets in `need_review`.
- If validation passes, orchestrator moves the ticket to `finish`.
- If validation fails, orchestrator moves the ticket back to `backlog` with retry notes.
- The user merges, not the orchestrator and not the worker.

## Worker Behavior

- Workers subscribe through Redis Streams consumer groups.
- Workers ack tickets only after durable status update or successful completion.
- Failed tickets increment `attempts`.
- Tickets below `maxAttempts` may become `retrying`.
- Tickets beyond `maxAttempts` become `failed`.
- LLM jobs should become `waiting_llm` when Ollama is unavailable rather than failing immediately.
- Workers must read docs and history before starting meaningful work.
- Workers must record completed work in history after finishing.

## Gateway API Contract

MVP gateway endpoints should include:

```text
POST /api/tickets
GET /api/tickets
GET /api/tickets/{ticketId}
```

Mutating ticket APIs require `X-Platform-Key` during development.

The v0.1.0 local scaffold may also expose `claim`, `complete`, and `fail` helper endpoints so the worker can prove the end-to-end loop before Redis Streams is introduced.

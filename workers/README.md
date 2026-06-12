# Workers

Workers subscribe to typed tickets and execute jobs.

## Default Queue

MVP workers use Redis Streams:

```text
stream: platform:tickets
consumer group: platform-workers
```

## Required Workflow

Every worker must:

- Read the relevant docs before starting work.
- Read the relevant history entries before starting work.
- Record what it did in the dated history file after finishing work.

See `docs/ticket-policy.md`, `docs/history/README.md`, and the latest relevant history file before changing worker behavior.

# Workers

Workers subscribe to typed tickets and execute jobs.

## Default Queue

MVP workers use Redis Streams:

```text
stream: platform:tickets
consumer group: platform-workers
```

See `docs/ticket-policy.md` before changing worker behavior.

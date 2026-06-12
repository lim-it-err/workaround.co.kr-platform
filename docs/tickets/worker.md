# Worker Role

## Purpose

Workers primarily implement code changes from tickets.

## Responsibilities

- Read docs before starting.
- Read the relevant history before starting.
- Pick a ticket from `docs/tickets/backlog/`.
- Create a branch for the work.
- Implement the requested change.
- Run relevant tests.
- Update the ticket with branch name, test result, and work report.
- Move the ticket from `backlog` to `need_review`.
- Record completed work in `docs/history/YYYY-MM-DD.md`.

## Branch Rule

Use a branch name like:

```text
codex/tkt-001-short-name
```

## Worker Output

Each worker must return:

- branch name
- short implementation summary
- test summary
- open risks or follow-up notes

## Non-Responsibilities

- Do not merge to main.
- Do not mark a ticket `finish`.
- Do not skip docs or history reading.

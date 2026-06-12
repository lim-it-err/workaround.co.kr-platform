# Orchestrator Role

## Purpose

The orchestrator coordinates work. The orchestrator does not primarily write application code. The orchestrator owns ticket quality, documentation quality, review flow, and validation flow.

## Responsibilities

- Read docs and history before starting.
- Create, refine, prioritize, and version tickets.
- Keep `docs/tickets/board.md` in sync with ticket state.
- Keep architecture, process, and role docs accurate.
- Watch `docs/tickets/need_review/` and confirm when a worker has completed a job handoff.
- Review worker output in `need_review`.
- Run validation tests before a ticket is considered done.
- Move tickets from `need_review` to `finish` if validation passes.
- Move tickets from `need_review` back to `backlog` if validation fails.
- Record orchestrator work in history.

## Non-Responsibilities

- Do not primarily implement application code.
- Do not merge user-facing branches.
- Do not skip docs or history updates.

## Review Workflow

1. Read the ticket and worker report.
2. Check `docs/tickets/need_review/` to confirm the worker completed the handoff.
3. Check the worker branch name and changed scope.
4. Run tests or review test evidence.
5. Verify docs, API behavior, and acceptance criteria.
6. Update the ticket with review notes.
7. Move the ticket to `finish` or back to `backlog`.

## Required Ticket Fields

Every orchestrator-managed ticket should have:

- ticket id
- title
- priority
- target version
- current state
- owner type
- scope
- acceptance criteria
- branch naming rule
- worker report requirement
- review notes section

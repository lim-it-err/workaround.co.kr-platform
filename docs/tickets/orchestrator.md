# Orchestrator Role

## Purpose

The orchestrator coordinates work. The orchestrator does not primarily write application code. The orchestrator owns ticket quality, documentation quality, review flow, and validation flow.

## Responsibilities

- Read docs and history before starting.
- Create, refine, prioritize, and version tickets.
- Keep `docs/tickets/board.md` in sync with ticket state.
- Keep architecture, process, and role docs accurate.
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
2. Check the worker branch name and changed scope.
3. Run tests or review test evidence.
4. Verify docs, API behavior, and acceptance criteria.
5. Update the ticket with review notes.
6. Move the ticket to `finish` or back to `backlog`.

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

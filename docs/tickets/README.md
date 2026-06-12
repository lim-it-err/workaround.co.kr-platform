# Ticket System

This folder is the coordination layer for orchestrators and workers.

## Folders

- `docs/tickets/backlog/`: ready-to-pick work items
- `docs/tickets/need_review/`: worker-complete items waiting for orchestrator review and test
- `docs/tickets/finish/`: reviewed items that passed orchestrator validation and are ready for user merge decisions

## Priority Scale

The repository uses `P1` through `P5`.

- `P1`: highest priority
- `P2`: high priority
- `P3`: normal priority
- `P4`: low priority
- `P5`: lowest priority

## Required Flow

1. Orchestrator creates or updates a ticket in `backlog`.
2. A worker reads docs, reads history, creates a branch, implements the ticket, tests the work, and writes a work report.
3. The worker moves the ticket from `backlog` to `need_review` and records the branch and report in the ticket.
4. The orchestrator watches `need_review`, confirms the worker handoff, reviews the worker result, runs validation tests, and updates docs if needed.
5. If the result is good, the orchestrator moves the ticket to `finish`.
6. If the result is not good, the orchestrator moves the ticket back to `backlog` with a clear retry note.
7. The user decides whether to merge.

## Universal Rules

- Every agent reads the relevant docs before starting.
- Every agent reads the relevant history before starting.
- Every agent records its completed work in `docs/history/YYYY-MM-DD.md`.
- Orchestrators manage docs and ticket state.
- Workers primarily change code and return branch plus report.

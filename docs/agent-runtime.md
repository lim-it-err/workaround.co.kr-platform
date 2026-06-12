# Agent Runtime Separation

## Purpose

This repository separates the system that asks for work from the system that runs model inference.

That means:

- Codex or another project manager creates the ticket.
- A worker reads the ticket and decides what needs model help.
- Ollama on the RTX5070 node is only the inference runtime.
- The worker or gateway owns the request flow, retry behavior, and fallback state.

## Why This Exists

The RTX5070 machine may be stopped for gaming or other GPU work. The platform should still function when the model runtime is unavailable.

## Practical Rule

If you ask for code development help, the flow should be:

1. Create a typed ticket.
2. Let the worker route the job.
3. Call Ollama only if the job needs LLM inference.
4. Keep the actual code or docs mutation separate from the model process.

## Outcome

This gives you a clean split between:

- orchestration
- execution
- model inference

That separation is what makes the platform easier to pause, restart, and scale.

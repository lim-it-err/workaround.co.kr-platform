# Service Policy

## Principle

Sub-services are independent projects. They may use any language as long as they follow the platform contract.

Spring Boot is used for the gateway and may also be used for sub-services, but sub-services should not depend on gateway internals.

## Required Service Contract

Every service under `services/` must provide:

- Its own `README.md`.
- Its own `Dockerfile`.
- A `/health` endpoint.
- HTTP API documentation for exposed endpoints.
- Environment variable documentation.

## Independence

A service should be buildable and runnable on its own. It should not require the frontend or gateway to start for basic local testing.

## Communication

Use HTTP first for service communication. Avoid direct shared database coupling between services during MVP unless a future document explicitly defines that contract.

## Gateway Registration

A service added to the platform should document:

- Service id.
- Internal compose hostname.
- Health endpoint.
- Gateway route prefix.
- Required environment variables.

## LLM Access

Services should not directly depend on Ollama. LLM work should go through the worker/ticket path or a gateway policy endpoint so the platform can handle RTX5070 downtime gracefully.

## Initial Samples

MVP sample services:

- `services/sample-python-service/`
- `services/sample-spring-service/`

These samples should demonstrate language independence and Docker isolation rather than real business features.

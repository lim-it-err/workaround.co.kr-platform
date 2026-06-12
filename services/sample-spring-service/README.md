# Sample Spring Service

Placeholder for an independently dockerized Spring Boot sub-service.

## Expected MVP Contract

- Provide a `Dockerfile`.
- Expose `/health`.
- Document sample endpoints.
- Run independently from the gateway for local testing.

## v0.1.0 Runtime

- Base URL: `http://localhost:8002`
- Health: `GET /health`
- Sample endpoint: `GET /api/ping`
- Echo endpoint: `GET /api/echo?message=hello`

## Environment Variables

- `SERVER_PORT`: HTTP port, defaults to `8002`

This service demonstrates that Java/Spring can be used as a sub-service while the gateway remains focused on routing and ticket coordination.

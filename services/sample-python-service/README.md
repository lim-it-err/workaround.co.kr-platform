# Sample Python Service

Placeholder for an independently dockerized Python HTTP service.

## Expected MVP Contract

- Provide a `Dockerfile`.
- Expose `/health`.
- Document sample endpoints.
- Run independently from the gateway for local testing.

## v0.1.0 Runtime

- Base URL: `http://localhost:8001`
- Health: `GET /health`
- Sample endpoint: `GET /api/ping`
- Echo endpoint: `GET /api/echo?message=hello`

## Environment Variables

- `PORT`: HTTP port, defaults to `8001`
- `SERVICE_NAME`: display name for health responses, defaults to `sample-python-service`

This service exists to prove that platform services can use languages other than Java/Spring.

# Gateway

Spring Boot API Gateway, router, ticket issuer, development auth layer, and health aggregator.

## Responsibilities

- Route frontend requests to sub-services.
- Issue typed tickets into Redis Streams.
- Expose ticket status APIs.
- Aggregate health for Redis, workers, services, and external Ollama.
- Enforce development auth through `X-Platform-Key` for mutating APIs.

## v0.1.0 API Surface

- `GET /api/health`
- `GET /api/services`
- `GET /api/tickets`
- `GET /api/tickets/{ticketId}`
- `POST /api/tickets`
- `POST /api/tickets/{ticketId}/claim`
- `POST /api/tickets/{ticketId}/complete`
- `POST /api/tickets/{ticketId}/fail`

## Local Ports

- Gateway listens on `8080`.
- Frontend proxies `/api` traffic to the gateway during local development.

## Notes

- Business logic should live in independent services, not in the gateway.
- The v0.1.0 scaffold uses a minimal local ticket loop to prove the contract before the Redis Streams implementation lands.

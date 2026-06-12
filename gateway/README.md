# Gateway

Spring Boot API Gateway, router, ticket issuer, development auth layer, and health aggregator.

## Responsibilities

- Route frontend requests to sub-services.
- Issue typed tickets into Redis Streams.
- Expose ticket status APIs.
- Aggregate health for Redis, workers, services, and external Ollama.
- Enforce development auth through `X-Platform-Key` for mutating APIs.

Business logic should live in independent services, not in the gateway.

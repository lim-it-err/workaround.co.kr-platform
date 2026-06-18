FROM python:3.12-slim

WORKDIR /app
COPY . /app

ENV GATEWAY_BASE_URL=http://gateway:8080
ENV PLATFORM_API_KEY=dev-key
ENV ELEVATOR_SERVICE_URL=http://elevator-service:8003
ENV SAMPLE_SPRING_SERVICE_URL=http://sample-spring-service:8002
ENV WORKER_RUNTIME_MODE=gateway-polling
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV REDIS_STREAM_KEY=platform:tickets
ENV REDIS_RESULTS_STREAM_KEY=platform:tickets:results
ENV REDIS_CONSUMER_GROUP=platform-workers
ENV REDIS_CONSUMER_NAME=ion2-worker

CMD ["python", "/app/worker.py"]

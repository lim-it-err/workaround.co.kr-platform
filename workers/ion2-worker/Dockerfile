FROM python:3.12-slim

WORKDIR /app
COPY worker.py /app/worker.py

ENV GATEWAY_BASE_URL=http://gateway:8080
ENV PLATFORM_API_KEY=dev-platform-key
ENV SAMPLE_PYTHON_SERVICE_URL=http://sample-python-service:8001
ENV SAMPLE_SPRING_SERVICE_URL=http://sample-spring-service:8002

CMD ["python", "/app/worker.py"]

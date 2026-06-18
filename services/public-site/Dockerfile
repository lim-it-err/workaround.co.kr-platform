FROM python:3.12-alpine

WORKDIR /app

COPY app.py /app/app.py
COPY static /app/static

ENV PORT=8010
EXPOSE 8010

CMD ["python", "app.py"]

FROM python:3.11-slim

RUN pip install --no-cache-dir boto3 psycopg[binary]

WORKDIR /app
COPY worker.py /app/worker.py

CMD ["python", "-u", "worker.py"]

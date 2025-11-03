FROM python:3.11-slim

# System deps (speed up numpy/scipy wheels install)
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Python deps (start minimal; add vectorbt/numba later)
RUN pip install --no-cache-dir boto3 pandas numpy ccxt

# App code
WORKDIR /app
COPY worker.py /app/worker.py

CMD ["python", "-u", "worker.py"]
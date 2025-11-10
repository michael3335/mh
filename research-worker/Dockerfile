FROM python:3.11-slim

# System deps for freqtrade + TA-Lib
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    gfortran \
    libatlas-base-dev \
    libffi-dev \
    libssl-dev \
    libta-lib0 \
    libta-lib0-dev \
    && rm -rf /var/lib/apt/lists/*

# Python deps (freqtrade stack + tooling)
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm /tmp/requirements.txt

# App code
WORKDIR /app
COPY worker.py /app/worker.py

CMD ["python", "-u", "worker.py"]

FROM python:3.11-slim-bookworm

# System deps for freqtrade + TA-Lib
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    gfortran \
    wget \
    curl \
    ca-certificates \
    libatlas-base-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Build & install TA-Lib from source
WORKDIR /tmp
RUN curl -L -o ta-lib-0.4.0-src.tar.gz \
    https://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz \
    && tar -xzf ta-lib-0.4.0-src.tar.gz \
    && cd ta-lib \
    && ./configure --prefix=/usr \
    && make \
    && make install \
    && cd /tmp \
    && rm -rf ta-lib ta-lib-0.4.0-src.tar.gz

# Python deps (freqtrade stack + tooling)
WORKDIR /app
COPY research-worker/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm /tmp/requirements.txt

# App code
COPY research-worker/worker.py /app/worker.py

CMD ["python", "-u", "worker.py"]
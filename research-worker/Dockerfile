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
RUN pip install --no-cache-dir \
    boto3 \
    pandas \
    numpy \
    ccxt \
    python-dateutil \
    pyarrow \
    scipy \
    "pandas-ta @ git+https://github.com/twopirllc/pandas-ta@0.3.14b0" \
    freqtrade==2024.5

# App code
WORKDIR /app
COPY worker.py /app/worker.py

CMD ["python", "-u", "worker.py"]

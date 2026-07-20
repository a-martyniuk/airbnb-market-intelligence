FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and configuration
COPY src/ ./src/
COPY config/ ./config/
COPY data/ ./data/

# Expose FastAPI port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DATABASE_PATH=/app/database/airbnb_intelligence.db

# Launch FastAPI app using shell form to resolve $PORT dynamically
CMD uvicorn backend.api.main:app --host 0.0.0.0 --port ${PORT:-8000}

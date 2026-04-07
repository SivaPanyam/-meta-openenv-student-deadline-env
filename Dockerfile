# Use official Python 3.10 slim image for a smaller footprint
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# Ensure the current directory is in the PYTHONPATH for package imports
ENV PYTHONPATH="/app:${PYTHONPATH}"

# Set work directory
WORKDIR /app

# Install system dependencies (required for some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
# Copy requirements first to leverage Docker layer caching
COPY assignment_deadline_env/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project files
COPY . .

# Default command to run the evaluation loop
CMD ["python", "inference.py"]

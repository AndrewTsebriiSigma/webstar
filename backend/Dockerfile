# WebStar Backend Dockerfile
# Uses Python 3.11 with FFmpeg for media compression

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Verify FFmpeg installation
RUN ffmpeg -version

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory (for local fallback)
RUN mkdir -p uploads

# Expose port (Render uses PORT env variable)
EXPOSE 10000

# Start command - uses PORT env variable from Render
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]

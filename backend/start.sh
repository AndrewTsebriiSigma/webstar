#!/bin/bash
# Start script for Render deployment
# Render will use this if startCommand is not specified

# Get the port from Render's environment variable
PORT=${PORT:-8000}

echo "Starting backend server on port $PORT..."
# --limit-max-requests: Allows handling large file uploads (200MB)
# --timeout-keep-alive: Keep connections alive longer for large uploads
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 300


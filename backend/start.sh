#!/bin/bash
# Start script for Render deployment
# Render will use this if startCommand is not specified

# Get the port from Render's environment variable
PORT=${PORT:-8000}

echo "Starting backend server on port $PORT..."
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT


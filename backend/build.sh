#!/bin/bash
# Build script for Render deployment
# This script runs before the start command

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Build complete!"


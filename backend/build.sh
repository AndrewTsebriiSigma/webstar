#!/bin/bash
# Build script for Render deployment
# This script runs before the start command

set -e  # Exit on error

echo "=========================================="
echo "WebStar Backend Build Script"
echo "=========================================="

# Install FFmpeg for media compression (H.264/AAC video, WebP images, AAC audio)
echo ""
echo "📦 Installing FFmpeg for media compression..."
apt-get update -qq
apt-get install -y -qq ffmpeg

# Verify FFmpeg installation
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
    echo "✅ FFmpeg installed: $FFMPEG_VERSION"
else
    echo "⚠️ FFmpeg installation failed - media compression will be disabled"
fi

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "=========================================="
echo "✅ Build complete!"
echo "=========================================="

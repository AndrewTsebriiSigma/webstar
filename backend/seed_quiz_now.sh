#!/bin/bash
cd "$(dirname "$0")"
if [ -d "venv" ]; then
    source venv/bin/activate
    python seed_quiz.py
else
    echo "Virtual environment not found. Please activate it manually and run: python seed_quiz.py"
    echo "Or install dependencies and run: python3 seed_quiz.py"
fi

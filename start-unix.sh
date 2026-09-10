#!/bin/bash

# Web Monitoring SPA & Backend SRE Console - Unix Run Orchestrator
# Works on macOS and standard Linux platforms

echo "=========================================================="
echo "🚀 Booting Web Monitoring SRE Platform (macOS/Linux)     "
echo "=========================================================="

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js (v14+) first."
    exit 1
fi

# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Virtual Environment Setup
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment 'venv'..."
    python3 -m venv venv
fi

echo "🔌 Activating virtual environment..."
source venv/bin/activate

echo "📥 Installing python dependency requirements..."
pip install -r requirements.txt

echo "💾 Running database migrations..."
python manage.py migrate

# Frontend Setup
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing React node_modules packages. Please wait..."
    cd frontend && npm install && cd ..
fi

echo "=========================================================="
echo "✨ Setup complete. Launching server processes..."
echo "🔌 Backend API: http://127.0.0.1:8000"
echo "🖥️ Frontend UI: http://localhost:3000"
echo "=========================================================="

# Trap ctrl+c to kill background jobs on exit
trap 'kill $(jobs -p)' EXIT

# Start backend
python manage.py runserver &

# Start frontend
cd frontend && npm start &

# Wait for both processes
wait

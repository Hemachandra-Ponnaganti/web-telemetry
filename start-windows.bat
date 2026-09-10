@echo off
title Web Monitoring SRE Platform Orchestrator (Windows)
echo ==========================================================
echo 🚀 Booting Web Monitoring SRE Platform (Windows CMD/PS)
echo ==========================================================

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js not detected in PATH. Install Node.js v14+ first.
    pause
    exit /b 1
)

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Python not detected in PATH. Install Python 3.8+ first.
    pause
    exit /b 1
)

:: Python Virtual Environment
if not exist "venv" (
    echo 📦 Creating virtual environment 'venv'...
    python -m venv venv
)

echo 🔌 Activating virtual environment...
call venv\Scripts\activate

echo 📥 Installing Python requirements...
pip install -r requirements.txt

echo 💾 Running database migrations...
python manage.py migrate

:: Frontend Node Modules
if not exist "frontend\node_modules" (
    echo 📦 Installing React packages. Please wait...
    cd frontend && call npm install && cd ..
)

echo ==========================================================
echo ✨ Setup complete. Booting servers...
echo 🖥️ Frontend UI: http://localhost:3000
echo ==========================================================

:: Run backend silently in the background of the current console
start /b cmd /c "call venv\Scripts\activate && python manage.py runserver 8000"

:: Run frontend in the current console
cd frontend
call npm start

pause

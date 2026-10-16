@echo off
echo 🚀 Initializing Stemify - The Audio Splitter...

REM Check and install prerequisites
echo 🔍 Checking prerequisites...

REM Check if uv is installed
where uv >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing uv...
    powershell -Command "irm https://astral.sh/uv/install.ps1 | iex"
    echo ✅ uv installed successfully!
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is required but not installed. Install it from https://nodejs.org
    pause
    exit /b 1
)

REM Setup backend with uv
echo 🐍 Setting up backend...
cd demucs-backend

REM Install backend dependencies with uv
echo 📦 Installing Python dependencies with uv...
uv sync

REM Create necessary folders
if not exist temp mkdir temp
if not exist separated mkdir separated

REM Install AbletonMCP Remote Script (for the "Send to Ableton" button)
echo 🎛️ Installing AbletonMCP Remote Script (if Ableton is present)...
uvx --from ableton-mcp ableton-mcp-install-script >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Remote Script installed - enable it in Ableton: Settings ^> Link, Tempo ^& MIDI ^> Control Surface ^> AbletonMCP
) else (
    echo ℹ️  Ableton not detected: skipping Remote Script installation
)

REM Setup and start frontend
echo ⚛️ Setting up frontend...
cd ..\demucs-gui
echo 📦 Installing npm dependencies...
npm install

REM Start services
echo 🎯 Starting services...

REM Start backend with Python (Windows)
cd ..\demucs-backend
start "Backend" cmd /k "uv run python app.py"

REM Wait for backend to be ready
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start frontend
cd ..\demucs-gui
start "Frontend" cmd /k "npm run dev"

echo ✨ Application started!
echo 📝 Backend running on http://localhost:5001
echo 🌐 Frontend running on http://localhost:5173
echo.
echo To stop the application, close the terminal windows
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:5173

echo 🎉 Setup complete! The application is running in separate windows.
echo You can close this window now.
pause

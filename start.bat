@echo off
echo ==========================================================
echo Starting AgentForge AI (Single Window Log Mode)
echo ==========================================================

:: Change directory to backend and start uvicorn in the background
echo [1/2] Launching FastAPI Backend...
start /B cmd /c "cd backend && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

:: Wait a brief moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Change directory to frontend and start vite in the same window
echo [2/2] Launching Vite Frontend...
cd frontend && npm run dev -- --host 127.0.0.1 --port 5173

:: This point is reached when the frontend process is terminated
pause

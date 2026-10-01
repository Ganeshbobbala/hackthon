@echo off
echo ========================================================
echo   FARE RADAR PRO - Starting Full-Stack Application
echo   Problem Statement: PS-025 Data Science & Predictive Analytics
echo ========================================================

start "Fare Radar Backend (:8000)" cmd /k "set PYTHONPATH=backend && python -m uvicorn app.main:app --app-dir backend --reload --port 8000"
timeout /t 2 /nobreak >nul
start "Fare Radar Frontend (:5173)" cmd /k "cd frontend && npm run dev"

echo.
echo Backend running at:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend running at: http://localhost:5173
echo.

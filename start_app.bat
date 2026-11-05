@echo off
title राजभाषा-प्रबंधक (Rajbhasha Prabandhak)
chcp 65001 >nul
cd /d %~dp0

echo ======================================================================
echo   राजभाषा-प्रबंधक (Rajbhasha Management Suite - OLMS)
echo   Starting Local Server at http://localhost:8000 ...
echo ======================================================================
echo.

REM Open browser automatically after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

REM Run using python in the local virtual environment
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe run.py
) else (
    python run.py
)

pause

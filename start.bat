@echo off
echo === Starting MoneyKeeper Backend (Flask :5000) ===
cd /d "%~dp0backend"
start /B uv run python app.py

timeout /t 2 /nobreak >nul

echo === Starting MoneyKeeper Frontend (Vite :5173) ===
cd /d "%~dp0frontend"
npm run dev

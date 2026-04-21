@echo off
echo Stopping existing Node.js processes...
taskkill /IM node.exe /F >nul 2>nul

echo Starting server on port 5000...
set PORT=5000
npm run dev

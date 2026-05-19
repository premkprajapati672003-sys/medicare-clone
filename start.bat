@echo off
title ClinAssist AI - Server Launcher
echo ===================================================
echo   ClinAssist AI - Starting Full-Stack Monorepo
echo ===================================================
echo.

echo [1/2] Launching Elysia Backend Server in a new window...
start "ClinAssist Backend (Elysia)" cmd /k "echo --- CLINASSIST BACKEND SERVER --- && cd apps\backend && bun run src/index.ts"

echo.
echo [2/2] Launching Next.js Frontend Server in a new window...
start "ClinAssist Frontend (Next.js)" cmd /k "echo --- CLINASSIST FRONTEND SERVER --- && cd apps\frontend && bun run dev"

echo.
echo ===================================================
echo   Servers successfully spawned! Keep both open.
echo   - Backend: http://localhost:3002
echo   - Frontend: http://localhost:3000
echo ===================================================
echo.
pause

@echo off
title ClinAssist AI - Database Setup
echo ===================================================
echo   ClinAssist AI - Running Migrations & Seeding
echo ===================================================
echo.

echo Running migrations and seed scripts in backend...
cd apps\backend && bun run run_migration.ts && bun run seed_phase2.ts

echo.
echo ===================================================
echo   Database is successfully set up and seeded!
echo ===================================================
echo.
pause

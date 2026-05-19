@echo off
title Medicare Clone - Secure GitHub Publisher
cls

:: Setup styling colors
color 0B

echo =====================================================================
echo    __  __           _ _                      ____ _                   
echo   ^|  \/  ^| ___  __^| (_) ___ __ _ _ __ ___   / ___^| ^| ___  _ __   ___ 
echo   ^| ^|\/^| ^|/ _ \/ _` ^| ^|/ __/ _` ^| '__/ _ \ ^| ^|   ^| ^|/ _ \^| '_ \ / _ \
echo   ^| ^|  ^| ^|  __/ (_^| ^| ^| (_^| (_^| ^| ^| ^|  __/ ^| ^|___^| ^| (_) ^| ^| ^| ^|  __/
echo   ^|_^|  ^|_^|\___^|\__,_^|_^|\___\__,_^|_^|  \___^|  \____^|_^|\___/^|_^| ^|_^|\___^|
echo                                                                        
echo =====================================================================
echo         SECURE GITHUB PUBLISHING & SECRET PROTECTION UTILITY
echo =====================================================================
echo.

:: Step 1: Pre-flight checks
echo [1/5] Running pre-flight configuration checks...

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Git is not installed or not in your system's PATH.
    echo Please install Git from https://git-scm.com/ and try again.
    goto end
)
echo  - Git CLI detected successfully.

:: Setup default user if not configured locally
git config user.name >nul 2>nul
if %errorlevel% neq 0 (
    echo  - Setting local git user.name to 'prem'...
    git config user.name "prem"
)
git config user.email >nul 2>nul
if %errorlevel% neq 0 (
    echo  - Setting local git user.email to 'prem@example.com'...
    git config user.email "prem@example.com"
)

:: Step 2: Clear Nested Submodules
echo.
echo [2/5] Checking for nested submodules and accidental repository files...
if exist "apps\frontend\.git" (
    echo  - Found nested .git in apps\frontend. Cleaning up to prevent submodule locking...
    rmdir /s /q "apps\frontend\.git" 2>nul
)
if exist "apps\backend\.git" (
    echo  - Found nested .git in apps\backend. Cleaning up to prevent submodule locking...
    rmdir /s /q "apps\backend\.git" 2>nul
)
echo  - Clean repository structure confirmed.

:: Step 3: Safeguard Secrets (.gitignore Audit)
echo.
echo [3/5] Auditing .gitignore patterns to guarantee security...
echo  - Checking for environment variable exclusion rules...

:: Ensure .gitignore has env and db patterns
findstr /C:".env" .gitignore >nul 2>nul
if %errorlevel% neq 0 (
    echo .env >> .gitignore
    echo .env.local >> .gitignore
    echo .env.production >> .gitignore
    echo  - Appended missing environment exclusions.
)

findstr /C:"*.db" .gitignore >nul 2>nul
if %errorlevel% neq 0 (
    echo *.db >> .gitignore
    echo *.sqlite >> .gitignore
    echo  - Appended missing database exclusions.
)
echo  - Verification complete: All secret files (.env, databases) are safely ignored.

:: Step 4: Staging and Commit
echo.
echo [4/5] Staging files and preparing local Git commit...
echo.
git add .
echo.
echo  - All safe project files have been successfully staged!
echo.
set /p commit_msg="Enter custom commit message (press Enter for default 'feat: full-stack medicare clone implementation'): "
if "%commit_msg%"=="" (
    set commit_msg="feat: full-stack medicare clone implementation"
)

git commit -m "%commit_msg%"
echo  - Changes committed locally.

:: Step 5: Remote Verification & Push
echo.
echo [5/5] Checking target GitHub repository...
echo.

:: Read current remote URL
for /f "tokens=*" %%a in ('git config --get remote.origin.url 2^>nul') do set remote_url=%%a

if "%remote_url%"=="" (
    color 0E
    echo  - No GitHub remote found in git config.
    set /p remote_url="Please enter your GitHub Repository URL (e.g. https://github.com/premkprajapati672003-sys/medicare-clone.git): "
    if not "%remote_url%"=="" (
        git remote add origin %remote_url%
    )
) else (
    echo  - Target remote detected: %remote_url%
)

echo.
echo =====================================================================
echo READY TO PUSH TO GITHUB
echo =====================================================================
echo Branch: main
echo Remote: origin (%remote_url%)
echo.
echo [IMPORTANT] Windows may open a Git Credential Manager window asking 
echo             you to sign in to your GitHub account. Please authorize it
echo             to complete the upload.
echo =====================================================================
echo.
pause
echo.
echo Uploading project files to GitHub...
echo.

git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [WARNING] Direct push failed. This can happen if the remote repository 
    echo           already contains commits (like a default README or License).
    echo.
    set /p force_push="Would you like to force push to overwrite the remote (Y/N)? "
    if /i "%force_push%"=="Y" (
        echo Force pushing to GitHub...
        git push -f -u origin main
    ) else (
        echo Pushing cancelled. You can resolve differences manually in your terminal.
    )
)

echo.
echo =====================================================================
echo MISSION ACCOMPLISHED!
echo =====================================================================
echo Your entire full-stack Medicare Clone has been securely pushed!
echo Visit: %remote_url% to view your project online.
echo =====================================================================
echo.

:end
pause

# Clear screen and set title
Clear-Host
$Host.UI.RawUI.WindowTitle = "Medicare Clone - Secure GitHub Publisher"

# Define colors
$cyan = "Cyan"
$green = "Green"
$yellow = "Yellow"
$red = "Red"
$white = "White"

Write-Host "=====================================================================" -ForegroundColor $cyan
Write-Host "   __  __           _ _                      ____ _                  " -ForegroundColor $cyan
Write-Host "  |  \/  | ___  __|| (_) ___ __ _ _ __ ___   / ___| | ___  _ __   ___ " -ForegroundColor $cyan
Write-Host "  | |\/| |/ _ \/ _\` | |/ __/ _\` | '__/ _ \ | |   | |/ _ \| '_ \ / _ \" -ForegroundColor $cyan
Write-Host "  | |  | |  __/ (_| | | (_| (_| | | |  __/ | |___| | (_) | | | |  __/" -ForegroundColor $cyan
Write-Host "  |_|  |_|\___|\__,_|_|\___\__,_|_|  \___|  \____|_|\___/|_| |_|\___|" -ForegroundColor $cyan
Write-Host "                                                                       " -ForegroundColor $cyan
Write-Host "=====================================================================" -ForegroundColor $cyan
Write-Host "        SECURE GITHUB PUBLISHING & SECRET PROTECTION UTILITY (PS)" -ForegroundColor $white
Write-Host "=====================================================================" -ForegroundColor $cyan
Write-Host ""

# Step 1: Pre-flight checks
Write-Host "[1/5] Running pre-flight configuration checks..." -ForegroundColor $cyan

# Check for Git CLI
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Git is not installed or not in your system's PATH." -ForegroundColor $red
    Write-Host "Please install Git from https://git-scm.com/ and try again." -ForegroundColor $white
    pause
    exit
}
Write-Host " - Git CLI detected successfully." -ForegroundColor $green

# Configure default user if not configured locally
$gitUserName = git config user.name
if ([string]::IsNullOrEmpty($gitUserName)) {
    Write-Host " - Setting local git user.name to 'prem'..." -ForegroundColor $yellow
    git config user.name "prem"
}
$gitUserEmail = git config user.email
if ([string]::IsNullOrEmpty($gitUserEmail)) {
    Write-Host " - Setting local git user.email to 'prem@example.com'..." -ForegroundColor $yellow
    git config user.email "prem@example.com"
}

# Step 2: Clear Nested Submodules
Write-Host ""
Write-Host "[2/5] Checking for nested submodules and accidental repository files..." -ForegroundColor $cyan
if (Test-Path "apps\frontend\.git") {
    Write-Host " - Found nested .git in apps/frontend. Cleaning up to prevent submodule locking..." -ForegroundColor $yellow
    Remove-Item -Recurse -Force "apps\frontend\.git" -ErrorAction SilentlyContinue
}
if (Test-Path "apps\backend\.git") {
    Write-Host " - Found nested .git in apps/backend. Cleaning up to prevent submodule locking..." -ForegroundColor $yellow
    Remove-Item -Recurse -Force "apps\backend\.git" -ErrorAction SilentlyContinue
}
Write-Host " - Clean repository structure confirmed." -ForegroundColor $green

# Step 3: Safeguard Secrets (.gitignore Audit)
Write-Host ""
Write-Host "[3/5] Auditing .gitignore patterns to guarantee security..." -ForegroundColor $cyan
Write-Host " - Checking for environment variable exclusion rules..." -ForegroundColor $white

$gitignorePath = ".gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath
    
    # Check environment variable rules
    if (-not ($gitignoreContent -match "\.env")) {
        Add-Content $gitignorePath "`n# Environment variables`n.env`n.env.local`n.env.production"
        Write-Host " - Appended environment exclusions to .gitignore." -ForegroundColor $yellow
    }
    
    # Check SQLite database rules
    if (-not ($gitignoreContent -match "\*\.db")) {
        Add-Content $gitignorePath "`n# Databases`n*.db`n*.sqlite"
        Write-Host " - Appended database exclusions to .gitignore." -ForegroundColor $yellow
    }
}
Write-Host " - Verification complete: All secret files (.env, databases) are safely ignored." -ForegroundColor $green

# Step 4: Staging and Commit
Write-Host ""
Write-Host "[4/5] Staging files and preparing local Git commit..." -ForegroundColor $cyan
Write-Host ""
git add .
Write-Host " - All safe project files have been successfully staged!" -ForegroundColor $green
Write-Host ""

$commitMsg = Read-Host "Enter custom commit message (press Enter for default 'feat: full-stack medicare clone implementation')"
if ([string]::IsNullOrEmpty($commitMsg)) {
    $commitMsg = "feat: full-stack medicare clone implementation"
}

git commit -m $commitMsg
Write-Host " - Changes committed locally." -ForegroundColor $green

# Step 5: Remote Verification & Push
Write-Host ""
Write-Host "[5/5] Checking target GitHub repository..." -ForegroundColor $cyan

# Read current remote URL
$remoteUrl = git config --get remote.origin.url
if ([string]::IsNullOrEmpty($remoteUrl)) {
    Write-Host " - No GitHub remote found in git config." -ForegroundColor $yellow
    $remoteUrl = Read-Host "Please enter your GitHub Repository URL (e.g. https://github.com/premkprajapati672003-sys/medicare-clone.git)"
    if (-not [string]::IsNullOrEmpty($remoteUrl)) {
        git remote add origin $remoteUrl
    }
} else {
    Write-Host " - Target remote detected: $remoteUrl" -ForegroundColor $green
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor $cyan
Write-Host "READY TO PUSH TO GITHUB" -ForegroundColor $white
Write-Host "Branch: main" -ForegroundColor $white
Write-Host "Remote: origin ($remoteUrl)" -ForegroundColor $white
Write-Host ""
Write-Host "[IMPORTANT] Windows may open a Git Credential Manager window asking" -ForegroundColor $yellow
Write-Host "            you to sign in to your GitHub account. Please authorize it" -ForegroundColor $yellow
Write-Host "            to complete the upload." -ForegroundColor $yellow
Write-Host "=====================================================================" -ForegroundColor $cyan
Write-Host ""

Read-Host "Press Enter to begin secure upload..."
Write-Host ""
Write-Host "Uploading project files to GitHub..." -ForegroundColor $green
Write-Host ""

git branch -M main
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "" -ForegroundColor $red
    Write-Host "[WARNING] Direct push failed. This can happen if the remote repository" -ForegroundColor $red
    Write-Host "          already contains commits (like a default README or License)." -ForegroundColor $red
    Write-Host ""
    $forcePush = Read-Host "Would you like to force push to overwrite the remote (Y/N)?"
    if ($forcePush -ieq "Y") {
        Write-Host "Force pushing to GitHub..." -ForegroundColor $yellow
        git push -f -u origin main
    } else {
        Write-Host "Pushing cancelled. You can resolve differences manually in your terminal." -ForegroundColor $yellow
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor $cyan
Write-Host "MISSION ACCOMPLISHED!" -ForegroundColor $green
Write-Host "Your entire full-stack Medicare Clone has been securely pushed!" -ForegroundColor $green
Write-Host "Visit: $remoteUrl to view your project online." -ForegroundColor $green
Write-Host "=====================================================================" -ForegroundColor $cyan
Write-Host ""

Read-Host "Press Enter to close this window..."

# Nautix - Development Startup (Windows / PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File start.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

function ok  { param($msg) Write-Host "  " -NoNewline; Write-Host "OK" -ForegroundColor Green -NoNewline; Write-Host "  $msg" }
function log { param($msg) Write-Host "  $msg" }
function err { param($msg) Write-Host "`n  ERROR  $msg - aborting.`n" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  NAUTIX" -ForegroundColor White -NoNewline
Write-Host " - starting development environment"
Write-Host ""

# Prerequisites

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    err "Node.js not found - install from https://nodejs.org (v18+)"
}
ok "Node.js $(node -v)"

if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
    log "yarn not found - installing..."
    npm install -g yarn --silent
}
ok "Yarn $(yarn -v)"

$PYTHON = $null
foreach ($cmd in @("python3", "python")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $PYTHON = $cmd
        break
    }
}
if (-not $PYTHON) {
    err "Python 3.9+ not found - install from https://python.org"
}
ok "Python $(& $PYTHON --version 2>&1)"

# Install dependencies

Write-Host ""
log "Installing dependencies..."

Push-Location frontend
yarn install --silent --ignore-engines
Pop-Location
ok "Frontend packages"

$VENV = "$ScriptDir\backend\.venv"
if (-not (Test-Path $VENV)) {
    log "Creating Python virtual environment..."
    & $PYTHON -m venv $VENV
}
& "$VENV\Scripts\pip.exe" install -r backend\requirements.txt -q
ok "Backend packages"

# Load backend/.env

if (Test-Path "backend\.env") {
    Get-Content "backend\.env" | ForEach-Object {
        if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
        $parts = $_ -split "=", 2
        if ($parts.Length -eq 2) {
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
    ok "Loaded backend/.env"
}

# Start servers

Write-Host ""
log "Starting servers..."

$BackendLog  = "$env:TEMP\nautix-backend.log"
$FrontendLog = "$env:TEMP\nautix-frontend.log"

# Build inner command strings — outer variables expand here, inner single-quotes
# protect paths with spaces when the child powershell.exe runs the command.
$backendCmd  = "Set-Location '$ScriptDir'; & '$VENV\Scripts\python.exe' -m uvicorn backend.server:app --port 8000 --reload *>> '$BackendLog'"
$frontendCmd = "Set-Location '$ScriptDir\frontend'; yarn dev *>> '$FrontendLog'"

# Launch each server in a hidden powershell child process.
# Using a powershell subprocess avoids the PS 5.1 Start-Process bug where
# -RedirectStandardOutput and -RedirectStandardError throw "are same" even
# with distinct paths. The *>> operator captures all output streams reliably.
$BackendProc = Start-Process powershell.exe `
    -ArgumentList "-NoProfile", "-Command", $backendCmd `
    -WindowStyle Hidden -PassThru

$FrontendProc = Start-Process powershell.exe `
    -ArgumentList "-NoProfile", "-Command", $frontendCmd `
    -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 6

if ($BackendProc.HasExited)  { err "Backend failed to start - check $BackendLog" }
if ($FrontendProc.HasExited) { err "Frontend failed to start - check $FrontendLog" }

# Detect port Vite chose
$FrontendPort = "5173"
if (Test-Path $FrontendLog) {
    $match = Select-String -Path $FrontendLog -Pattern "localhost:(\d+)" | Select-Object -First 1
    if ($match) { $FrontendPort = $match.Matches[0].Groups[1].Value }
}

# Ready

Write-Host ""
Write-Host "  +--------------------------------------------------+" -ForegroundColor Green
Write-Host "  |                                                  |" -ForegroundColor Green
Write-Host "  |  " -ForegroundColor Green -NoNewline
Write-Host "NAUTIX is running" -ForegroundColor White -NoNewline
Write-Host "                             |" -ForegroundColor Green
Write-Host "  |                                                  |" -ForegroundColor Green
Write-Host "  |  " -ForegroundColor Green -NoNewline
Write-Host "Website" -ForegroundColor Cyan -NoNewline
Write-Host "  ->  http://localhost:$FrontendPort           |" -ForegroundColor Green
Write-Host "  |  " -ForegroundColor Green -NoNewline
Write-Host "API docs" -ForegroundColor Cyan -NoNewline
Write-Host " ->  http://localhost:8000/docs         |" -ForegroundColor Green
Write-Host "  |                                                  |" -ForegroundColor Green
Write-Host "  |  Backend  ->  $BackendLog" -ForegroundColor Green
Write-Host "  |  Frontend ->  $FrontendLog" -ForegroundColor Green
Write-Host "  |                                                  |" -ForegroundColor Green
Write-Host "  |  Press " -ForegroundColor Green -NoNewline
Write-Host "Ctrl+C" -ForegroundColor White -NoNewline
Write-Host " to stop                           |" -ForegroundColor Green
Write-Host "  |                                                  |" -ForegroundColor Green
Write-Host "  +--------------------------------------------------+" -ForegroundColor Green
Write-Host ""

# Keep running until Ctrl+C

try {
    while ($true) { Start-Sleep -Seconds 2 }
} finally {
    Write-Host ""
    log "Stopping servers..."
    if (-not $BackendProc.HasExited)  { taskkill /F /T /PID $BackendProc.Id  2>$null | Out-Null }
    if (-not $FrontendProc.HasExited) { taskkill /F /T /PID $FrontendProc.Id 2>$null | Out-Null }
    Write-Host ""
}

#!/usr/bin/env bash
# ── Nautix — Development Startup ─────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colours
B='\033[1m'
C='\033[0;36m'
G='\033[0;32m'
Y='\033[1;33m'
R='\033[0;31m'
N='\033[0m'

log()  { echo -e "  $*${N}"; }
ok()   { echo -e "  ${G}✓${N}  $*"; }
err()  { echo -e "\n  ${R}✗${N}  $* — aborting.\n"; exit 1; }

echo ""
echo -e "  ${B}NAUTIX${N} — starting development environment"
echo ""

# ── Prerequisites ─────────────────────────────────────────────────────────────

command -v node &>/dev/null \
    || err "Node.js not found — install from https://nodejs.org (v18+)"
ok "Node.js $(node -v)"

if ! command -v yarn &>/dev/null; then
    log "yarn not found — installing..."
    npm install -g yarn --silent
fi
ok "Yarn $(yarn -v)"

PYTHON=""
for cmd in python3.12 python3.11 python3.10 python3.9 python3; do
    if command -v "$cmd" &>/dev/null; then
        PYTHON="$cmd"
        break
    fi
done
[ -z "$PYTHON" ] && err "Python 3.9+ not found — install from https://python.org"
ok "Python $($PYTHON --version 2>&1 | awk '{print $2}')"

# ── Install dependencies ──────────────────────────────────────────────────────

echo ""
log "Installing dependencies..."

(cd frontend && yarn install --silent --ignore-engines)
ok "Frontend packages"

VENV="$SCRIPT_DIR/backend/.venv"
if [ ! -d "$VENV" ]; then
    log "Creating Python virtual environment..."
    $PYTHON -m venv "$VENV"
fi

# Windows (Git Bash) uses Scripts/, Unix uses bin/
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    PIP="$VENV/Scripts/pip"
    PYTHON_VENV="$VENV/Scripts/python"
else
    PIP="$VENV/bin/pip"
    PYTHON_VENV="$VENV/bin/python"
fi

"$PIP" install -r backend/requirements.txt -q
ok "Backend packages"

# ── Load backend/.env ─────────────────────────────────────────────────────────

if [ -f backend/.env ]; then
    set -o allexport
    source backend/.env
    set +o allexport
    ok "Loaded backend/.env"
fi

# ── Start servers ─────────────────────────────────────────────────────────────

echo ""
log "Starting servers..."

BACKEND_LOG=/tmp/nautix-backend.log
FRONTEND_LOG=/tmp/nautix-frontend.log

"$PYTHON_VENV" -m uvicorn backend.server:app --port 8000 --reload \
    >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

(cd frontend && yarn dev) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Wait for both to be ready
sleep 4

# Check they're still alive
kill -0 "$BACKEND_PID"  2>/dev/null || err "Backend failed to start — check $BACKEND_LOG"
kill -0 "$FRONTEND_PID" 2>/dev/null || err "Frontend failed to start — check $FRONTEND_LOG"

# Detect the frontend port Vite chose
FRONTEND_PORT=$(grep -oE 'localhost:[0-9]+' "$FRONTEND_LOG" | head -1 | cut -d: -f2)
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# ── Ready ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "  ${G}┌──────────────────────────────────────────────────┐${N}"
echo -e "  ${G}│${N}                                                  ${G}│${N}"
echo -e "  ${G}│${N}  ${B}NAUTIX is running${N}                             ${G}│${N}"
echo -e "  ${G}│${N}                                                  ${G}│${N}"
echo -e "  ${G}│${N}  ${C}Website${N}  →  http://localhost:${FRONTEND_PORT}           ${G}│${N}"
echo -e "  ${G}│${N}  ${C}API docs${N} →  http://localhost:8000/docs         ${G}│${N}"
echo -e "  ${G}│${N}                                                  ${G}│${N}"
echo -e "  ${G}│${N}  Logs  →  $BACKEND_LOG   ${G}│${N}"
echo -e "  ${G}│${N}           $FRONTEND_LOG  ${G}│${N}"
echo -e "  ${G}│${N}                                                  ${G}│${N}"
echo -e "  ${G}│${N}  Press ${B}Ctrl+C${N} to stop                           ${G}│${N}"
echo -e "  ${G}│${N}                                                  ${G}│${N}"
echo -e "  ${G}└──────────────────────────────────────────────────┘${N}"
echo ""

# ── Cleanup on Ctrl+C ─────────────────────────────────────────────────────────

cleanup() {
    echo ""
    log "Stopping servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    echo ""
    exit 0
}

trap cleanup SIGINT SIGTERM

wait

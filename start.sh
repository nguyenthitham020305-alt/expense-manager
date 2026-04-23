#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
    echo ""
    echo "Shutting down..."
    kill "$BACKEND_PID" 2>/dev/null
    wait "$BACKEND_PID" 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "=== Starting MoneyKeeper Backend (Flask :5000) ==="
cd "$SCRIPT_DIR/backend"
uv run python app.py &
BACKEND_PID=$!

sleep 2

echo "=== Starting MoneyKeeper Frontend (Vite :5173) ==="
cd "$SCRIPT_DIR/frontend"
npm run dev

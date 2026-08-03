#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PORT=${PORT:-8765}

cd "$SCRIPT_DIR"

cleanup() {
  if [ -n "${SERVER_PID:-}" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM
python3 -m http.server "$PORT" --bind 127.0.0.1 &
SERVER_PID=$!

sleep 0.5
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://127.0.0.1:$PORT" >/dev/null 2>&1 || true
fi

printf 'Local Twitch Message Creator: http://127.0.0.1:%s\n' "$PORT"
printf 'Press Ctrl+C to stop it.\n'
wait "$SERVER_PID"

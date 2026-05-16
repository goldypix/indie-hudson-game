#!/bin/bash
cd "$(dirname "$0")"

if ! lsof -i :8123 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Starting local server on http://localhost:8123 …"
  python3 server.py 8123 >/dev/null 2>&1 &
  sleep 1
else
  echo "Server already running on http://localhost:8123"
fi

open -a "Google Chrome" "http://localhost:8123"
echo "Game opened in Chrome. You can close this Terminal window when you're done playing."

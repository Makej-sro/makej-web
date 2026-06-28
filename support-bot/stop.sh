#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .pids ]; then
  PIDS=$(cat .pids)
  kill $PIDS 2>/dev/null && echo "✅ Bot zastaven." || echo "Procesy už neběží."
  rm -f .pids
else
  # Fallback — zabij podle jména
  pkill -f "uvicorn main:app" 2>/dev/null
  pkill -f "ngrok http 8000" 2>/dev/null
  echo "✅ Bot zastaven."
fi

#!/usr/bin/env bash
set -euo pipefail

PORT=8080
LOG_FILE=/tmp/simple-shorts-live-server.log
MATCH_PATTERN="live-server --host=0.0.0.0 --port=${PORT}"

if ps -eo args= | grep -E "[l]ive-server --host=0\\.0\\.0\\.0 --port=${PORT}( |$)" >/dev/null 2>&1; then
  echo "live-server already running on port ${PORT}"
  exit 0
fi

echo "Starting live-server on port ${PORT}..."
nohup npx --yes live-server --host=0.0.0.0 --port="${PORT}" --no-browser >"${LOG_FILE}" 2>&1 &
echo "live-server started. Logs: ${LOG_FILE}"

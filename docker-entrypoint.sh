#!/bin/sh

set -e

echo "[entrypoint] Running database migrations..."
npm run migration:run

echo "[entrypoint] Starting application..."
exec "$@"


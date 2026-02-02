#!/bin/sh

set -e

echo "[entrypoint] Running database migrations..."
if [ "$NODE_ENV" = "production" ]; then
  npm run migration:prod
else
  npm run migration:run
fi

echo "[entrypoint] Starting application..."
exec "$@"


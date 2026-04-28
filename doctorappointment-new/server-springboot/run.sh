#!/usr/bin/env bash
# Loads .env and starts the Spring Boot jar. Secrets live in .env, not in the repo.
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  echo ".env is missing. Copy .env.example and fill it in." >&2
  exit 1
fi
set -a
. ./.env
set +a
exec java -jar target/doctor-appointment-1.0.0.jar

#!/usr/bin/env bash

COMPOSE_FILE="infra/docker/docker-compose.yml"
SERVICE="postgres"

status=$(docker compose -f "$COMPOSE_FILE" ps --status running --services 2>/dev/null)

if echo "$status" | grep -qx "$SERVICE"; then
  echo "postgres is already running"
else
  echo "starting postgres..."
  docker compose -f "$COMPOSE_FILE" up -d "$SERVICE"
  if [ $? -ne 0 ]; then
    echo "error: failed to start postgres" >&2
    exit 1
  fi
  echo "postgres started"
fi

#!/usr/bin/env bash
# Run on EC2 from the repository root. The GitHub Action calls this script.
set -Eeuo pipefail

ROOT_DIR="${1:-$(pwd)}"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Engine and Docker Compose plugin first." >&2
  exit 1
fi

# An optional .env beside docker-compose.yml supplies CORS_ORIGINS and thresholds.
# `sudo` works on the EC2 ubuntu account before it has re-logged in after
# `usermod -aG docker`. It also keeps this script suitable for first deploy.
# A failed pip/Torch build can leave BuildKit cache behind. This removes build
# cache only; it does not delete containers, named volumes, or uploaded data.
sudo docker builder prune --force --all
AVAILABLE_KB=$(df --output=avail /var/lib/docker | tail -n 1 | tr -d ' ')
if [ "${AVAILABLE_KB:-0}" -lt 6291456 ]; then
  echo "Need at least 6 GB free under /var/lib/docker; available: ${AVAILABLE_KB:-0} KB. Increase the EC2 EBS volume, then retry." >&2
  exit 1
fi
sudo docker compose -f docker-compose.yml up -d --build --remove-orphans recycle-ai
sudo docker compose -f docker-compose.yml ps
for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:8000/health; then
    exit 0
  fi
  sleep 2
done
echo "Recycle AI did not become healthy within 60 seconds." >&2
exit 1

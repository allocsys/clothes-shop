#!/bin/sh
# Postgres backup for the Docker setup. Run from anywhere:  sh scripts/backup.sh
# Saves a compressed dump in backups/ and keeps the newest 14.
# IMPORTANT: also copy the files in backups/ off this server (your computer, another provider).
set -e
cd "$(dirname "$0")/.."
mkdir -p backups
file="backups/shop-$(date +%F-%H%M).sql.gz"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$file"
ls -1t backups/shop-*.sql.gz | tail -n +15 | xargs -r rm --
echo "Backup saved: $file"

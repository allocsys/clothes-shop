#!/bin/sh
# Backup for the Docker setup: Postgres dump + product photos. Run from anywhere:  sh scripts/backup.sh
# Saves a compressed dump in backups/ (keeps the newest 14) and a photos archive (keeps the newest 3).
# IMPORTANT: also copy the files in backups/ off this server (your computer, another provider).
set -e
cd "$(dirname "$0")/.."
mkdir -p backups
file="backups/shop-$(date +%F-%H%M).sql.gz"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$file"
ls -1t backups/shop-*.sql.gz | tail -n +15 | xargs -r rm --
echo "Backup saved: $file"

# Product photos (volume mounted at /uploads in the web container)
photos="backups/photos-$(date +%F-%H%M).tar.gz"
docker compose exec -T web tar -C /uploads -czf - . > "$photos" || { rm -f "$photos"; echo "Photo backup failed (is the web container running?)"; exit 1; }
ls -1t backups/photos-*.tar.gz | tail -n +4 | xargs -r rm --
echo "Photos saved: $photos"

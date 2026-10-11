#!/bin/sh
# Backup for the Docker setup: Postgres dump + product photos. Run from anywhere:  sh scripts/backup.sh
# Saves a compressed dump in backups/ (keeps the newest 14) and a photos archive (keeps the newest 3).
# Then, if you set a destination in .env, copies the backups OFF this server (see "Off-server copy" below).
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

# ---- Off-server copy (optional) ----
# A backup that lives only on the server dies with the server. Set ONE of these in .env (or in the environment):
#   BACKUP_RSYNC_TARGET=user@other-server:/path/to/folder   copy over SSH to another server (needs rsync on both)
#   BACKUP_SSH_KEY=/root/.ssh/backup_key                    optional: the SSH key to use for it
#   BACKUP_RCLONE_REMOTE=arvan:my-bucket/mahpari            copy with rclone to a (private!) bucket, e.g. ArvanCloud S3
# Only the BACKUP_ lines of .env are read; the file is never executed. Nothing is deleted on the other side.
setting() {
  eval "val=\${$1:-}"
  if [ -z "$val" ] && [ -f .env ]; then
    val=$(grep -E "^$1=" .env | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//")
  fi
  printf '%s' "$val"
}

rsync_target=$(setting BACKUP_RSYNC_TARGET)
rclone_remote=$(setting BACKUP_RCLONE_REMOTE)
ssh_key=$(setting BACKUP_SSH_KEY)
failed=0

if [ -z "$rsync_target" ] && [ -z "$rclone_remote" ]; then
  echo "WARNING: no off-server copy is set (BACKUP_RSYNC_TARGET or BACKUP_RCLONE_REMOTE in .env). These backups exist only on this server."
fi

if [ -n "$rsync_target" ]; then
  ssh_cmd="ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20"
  [ -n "$ssh_key" ] && ssh_cmd="$ssh_cmd -i $ssh_key"
  if rsync -a --partial --include='shop-*.sql.gz' --include='photos-*.tar.gz' --exclude='*' -e "$ssh_cmd" backups/ "$rsync_target/"; then
    echo "Copied off-server (rsync): $rsync_target"
  else
    echo "ERROR: the rsync copy to $rsync_target failed. The backup on this server is fine."
    failed=1
  fi
fi

if [ -n "$rclone_remote" ]; then
  if rclone copy backups "$rclone_remote" --include 'shop-*.sql.gz' --include 'photos-*.tar.gz'; then
    echo "Copied off-server (rclone): $rclone_remote"
  else
    echo "ERROR: the rclone copy to $rclone_remote failed. The backup on this server is fine."
    failed=1
  fi
fi

[ "$failed" = 0 ] || exit 1

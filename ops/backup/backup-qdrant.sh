#!/bin/bash
#
# Qdrant 快照备份脚本
# Crontab: 0 3 * * * /path/to/backup-qdrant.sh >> /var/log/backup-qdrant.log 2>&1

set -euo pipefail

QDRANT_HOST="${QDRANT_HOST:-http://127.0.0.1:6333}"
BACKUP_DIR="${BACKUP_DIR:-/data/backups/qdrant}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting Qdrant backup..."

COLLECTIONS=$(curl -s "${QDRANT_HOST}/collections" | \
    python3 -c "import sys,json; [print(c['name']) for c in json.load(sys.stdin)['result']['collections']]" 2>/dev/null || true)

if [ -z "${COLLECTIONS}" ]; then
    echo "[$(date)] No collections found, skipping backup"
    exit 0
fi

for COLLECTION in ${COLLECTIONS}; do
    echo "[$(date)] Creating snapshot for collection: ${COLLECTION}"

    SNAPSHOT_RESULT=$(curl -s -X POST "${QDRANT_HOST}/collections/${COLLECTION}/snapshots")
    SNAPSHOT_NAME=$(echo "${SNAPSHOT_RESULT}" | \
        python3 -c "import sys,json; print(json.load(sys.stdin)['result']['name'])" 2>/dev/null || true)

    if [ -z "${SNAPSHOT_NAME}" ]; then
        echo "[$(date)] ERROR: Failed to create snapshot for ${COLLECTION}"
        continue
    fi

    DEST_FILE="${BACKUP_DIR}/${COLLECTION}_${TIMESTAMP}.snapshot"
    curl -s -o "${DEST_FILE}" \
        "${QDRANT_HOST}/collections/${COLLECTION}/snapshots/${SNAPSHOT_NAME}"

    FILESIZE=$(du -h "${DEST_FILE}" | cut -f1)
    echo "[$(date)] Saved: ${DEST_FILE} (${FILESIZE})"

    curl -s -X DELETE \
        "${QDRANT_HOST}/collections/${COLLECTION}/snapshots/${SNAPSHOT_NAME}" > /dev/null
done

echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "*.snapshot" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Qdrant backup completed"

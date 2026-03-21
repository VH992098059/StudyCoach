#!/bin/bash
#
# Elasticsearch 快照备份脚本
# 前置条件: 需先注册快照仓库 (首次运行自动注册)
# Crontab: 0 3 * * * /path/to/backup-es.sh >> /var/log/backup-es.log 2>&1

set -euo pipefail

ES_HOST="${ES_HOST:-http://127.0.0.1:9200}"
REPO_NAME="${ES_REPO_NAME:-studycoach_backup}"
REPO_PATH="${ES_REPO_PATH:-/usr/share/elasticsearch/backup}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_NAME="snapshot_${TIMESTAMP}"

ensure_repo() {
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${ES_HOST}/_snapshot/${REPO_NAME}")
    if [ "${STATUS}" != "200" ]; then
        echo "[$(date)] Registering snapshot repository: ${REPO_NAME}"
        curl -s -X PUT "${ES_HOST}/_snapshot/${REPO_NAME}" \
            -H 'Content-Type: application/json' \
            -d "{
                \"type\": \"fs\",
                \"settings\": {
                    \"location\": \"${REPO_PATH}\",
                    \"compress\": true
                }
            }"
        echo ""
    fi
}

create_snapshot() {
    echo "[$(date)] Creating snapshot: ${SNAPSHOT_NAME}"
    curl -s -X PUT "${ES_HOST}/_snapshot/${REPO_NAME}/${SNAPSHOT_NAME}?wait_for_completion=true" \
        -H 'Content-Type: application/json' \
        -d '{
            "indices": "content_vector*,qa_content_vector*",
            "ignore_unavailable": true,
            "include_global_state": false
        }'
    echo ""
    echo "[$(date)] Snapshot created successfully"
}

cleanup_old_snapshots() {
    echo "[$(date)] Cleaning up snapshots older than ${RETENTION_DAYS} days..."
    CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +%Y%m%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y%m%d)

    SNAPSHOTS=$(curl -s "${ES_HOST}/_snapshot/${REPO_NAME}/_all" | \
        python3 -c "
import sys, json
data = json.load(sys.stdin)
for s in data.get('snapshots', []):
    name = s['snapshot']
    date_part = name.replace('snapshot_', '').split('_')[0]
    if date_part < '${CUTOFF_DATE}':
        print(name)
" 2>/dev/null || true)

    for SNAP in ${SNAPSHOTS}; do
        echo "[$(date)] Deleting old snapshot: ${SNAP}"
        curl -s -X DELETE "${ES_HOST}/_snapshot/${REPO_NAME}/${SNAP}"
        echo ""
    done
}

ensure_repo
create_snapshot
cleanup_old_snapshots

echo "[$(date)] ES backup completed"

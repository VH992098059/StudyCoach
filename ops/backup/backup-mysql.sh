#!/bin/bash
#
# MySQL 定时备份脚本
# 用法: ./backup-mysql.sh [full|incremental]
# Crontab: 0 2 * * * /path/to/backup-mysql.sh full >> /var/log/backup-mysql.log 2>&1

set -euo pipefail

BACKUP_TYPE="${1:-full}"
BACKUP_DIR="${BACKUP_DIR:-/data/backups/mysql}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-root}"
MYSQL_DATABASE="${MYSQL_DATABASE:-studyCoach}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${MYSQL_DATABASE}_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting ${BACKUP_TYPE} backup of ${MYSQL_DATABASE}..."

if [ "${BACKUP_TYPE}" = "full" ]; then
    mysqldump \
        -h "${MYSQL_HOST}" \
        -P "${MYSQL_PORT}" \
        -u "${MYSQL_USER}" \
        -p"${MYSQL_PASSWORD}" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --set-gtid-purged=OFF \
        "${MYSQL_DATABASE}" | gzip > "${BACKUP_FILE}"
else
    mysqldump \
        -h "${MYSQL_HOST}" \
        -P "${MYSQL_PORT}" \
        -u "${MYSQL_USER}" \
        -p"${MYSQL_PASSWORD}" \
        --single-transaction \
        --no-create-info \
        --set-gtid-purged=OFF \
        "${MYSQL_DATABASE}" | gzip > "${BACKUP_FILE}"
fi

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup completed: ${BACKUP_FILE} (${FILESIZE})"

echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" | wc -l)
echo "[$(date)] Current backup count: ${BACKUP_COUNT}"

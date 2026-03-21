#!/bin/bash
#
# 全链路健康检查脚本
# 用法: ./health-check.sh [--verbose]

set -uo pipefail

VERBOSE="${1:-}"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
ES_HOST="${ES_HOST:-http://127.0.0.1:9200}"
QDRANT_HOST="${QDRANT_HOST:-http://127.0.0.1:6333}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

check_service() {
    local name="$1"
    local cmd="$2"

    if eval "${cmd}" > /dev/null 2>&1; then
        printf "${GREEN}[OK]${NC}    %-25s\n" "${name}"
    else
        printf "${RED}[FAIL]${NC}  %-25s\n" "${name}"
        FAILED=$((FAILED + 1))
    fi
}

echo "========================================="
echo "  StudyCoach 全链路健康检查"
echo "  $(date)"
echo "========================================="
echo ""

echo "--- 基础设施 ---"
check_service "MySQL"          "mysqladmin ping -h ${MYSQL_HOST} --silent 2>/dev/null || nc -z ${MYSQL_HOST} 3306"
check_service "Redis"          "redis-cli -h ${REDIS_HOST} ping 2>/dev/null | grep -q PONG || nc -z ${REDIS_HOST} 6379"
check_service "Elasticsearch"  "curl -sf ${ES_HOST}/_cluster/health | grep -qE '\"status\":\"(green|yellow)\"'"
check_service "Qdrant"         "curl -sf ${QDRANT_HOST}/collections > /dev/null"
check_service "SeaweedFS"      "curl -sf http://127.0.0.1:8888/status > /dev/null"

echo ""
echo "--- 应用服务 ---"
check_service "Backend Health"  "curl -sf ${BACKEND_URL}/gateway/healthz"
check_service "Backend Ready"   "curl -sf ${BACKEND_URL}/gateway/readyz"
check_service "OpenAPI Doc"     "curl -sf ${BACKEND_URL}/api.json > /dev/null"

if [ "${VERBOSE}" = "--verbose" ]; then
    echo ""
    echo "--- 详细信息 ---"

    echo -n "Backend Metrics:  "
    curl -sf "${BACKEND_URL}/gateway/metrics" | head -5 2>/dev/null || echo "unavailable"

    echo -n "ES Cluster:       "
    curl -sf "${ES_HOST}/_cluster/health?pretty" 2>/dev/null | grep -E "status|number_of_nodes" || echo "unavailable"

    echo -n "Qdrant Collections: "
    curl -sf "${QDRANT_HOST}/collections" 2>/dev/null | python3 -c \
        "import sys,json; cs=json.load(sys.stdin)['result']['collections']; print(', '.join(c['name'] for c in cs) if cs else 'none')" \
        2>/dev/null || echo "unavailable"
fi

echo ""
echo "========================================="
if [ ${FAILED} -eq 0 ]; then
    printf "${GREEN}All checks passed${NC}\n"
    exit 0
else
    printf "${RED}${FAILED} check(s) failed${NC}\n"
    exit 1
fi

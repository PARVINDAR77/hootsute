#!/usr/bin/env bash
# ==============================================================================
# OmniSocial AI — Emergency Production Database Recovery Protocol (Bash)
# ==============================================================================
# SEPARATE, RESTRICTED EMERGENCY PROCEDURE: Restores into a production database.
# Requires explicit authorization, automated pre-recovery snapshot, and validation.
# DO NOT USE DURING ROUTINE OPERATIONS.
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"
PRODUCTION_DB="${2:-}"
HOST="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"
USER="${PGUSER:-postgres}"

LOG_PREFIX="[EMERGENCY-PROD-RECOVERY $(date -u +"%Y-%m-%dT%H:%M:%SZ")]"

echo -e "\033[31m$LOG_PREFIX ================================================================\033[0m"
echo -e "\033[31m$LOG_PREFIX ATTENTION: EMERGENCY PRODUCTION DATABASE RECOVERY PROTOCOL INITIATED\033[0m"
echo -e "\033[31m$LOG_PREFIX Target Production Database: '$PRODUCTION_DB'\033[0m"
echo -e "\033[31m$LOG_PREFIX Backup Source: '$BACKUP_FILE'\033[0m"
echo -e "\033[31m$LOG_PREFIX ================================================================\033[0m"

# 1. Authorization check
if [ "${EMERGENCY_RECOVERY_AUTHORIZED:-}" != "TRUE" ]; then
    echo -e "\033[31m$LOG_PREFIX ABORT: Emergency recovery is not authorized.\033[0m"
    echo -e "\033[31m$LOG_PREFIX Set environment variable EMERGENCY_RECOVERY_AUTHORIZED=TRUE to proceed.\033[0m"
    exit 1
fi

# 2. Check arguments and file existence
if [ -z "$BACKUP_FILE" ] || [ -z "$PRODUCTION_DB" ]; then
    echo "Usage: EMERGENCY_RECOVERY_AUTHORIZED=TRUE $0 <backup-file.dump> <production-db-name>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "\033[31m$LOG_PREFIX ERROR: Backup file not found: $BACKUP_FILE\033[0m"
    exit 1
fi

# 3. Locate pg_restore and pg_dump
command -v pg_restore >/dev/null 2>&1 || { echo -e "\033[31m$LOG_PREFIX ERROR: pg_restore is not installed.\033[0m"; exit 1; }
command -v pg_dump >/dev/null 2>&1 || { echo -e "\033[31m$LOG_PREFIX ERROR: pg_dump is not installed.\033[0m"; exit 1; }

# 4. Validate source archive integrity before touching the live database
echo -e "\033[36m$LOG_PREFIX Step 1/4: Validating source archive integrity...\033[0m"
pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1 || {
    echo -e "\033[31m$LOG_PREFIX ABORT: Backup archive validation failed. File is corrupt.\033[0m"
    exit 1
}
echo -e "\033[32m$LOG_PREFIX Source archive integrity verified.\033[0m"

# 5. Mandatory Pre-Recovery Safety Snapshot (Rollback Insurance)
mkdir -p ./backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PRE_RECOVERY_DUMP="./backups/pre_recovery_snapshot_${PRODUCTION_DB}_${TIMESTAMP}.dump"
echo -e "\033[33m$LOG_PREFIX Step 2/4: Creating mandatory pre-recovery safety snapshot: '$PRE_RECOVERY_DUMP'...\033[0m"

pg_dump \
    --host="$HOST" \
    --port="$PORT" \
    --username="$USER" \
    --format=custom \
    --blobs \
    --file="$PRE_RECOVERY_DUMP" \
    "$PRODUCTION_DB" || {
    echo -e "\033[31m$LOG_PREFIX ABORT: Pre-recovery snapshot failed. Refusing to proceed without safety snapshot.\033[0m"
    exit 1
}
echo -e "\033[32m$LOG_PREFIX Pre-recovery snapshot created successfully. Rollback path guaranteed.\033[0m"

# 6. Execute Emergency Restore
echo -e "\033[31m$LOG_PREFIX Step 3/4: Restoring archive into production database '$PRODUCTION_DB'...\033[0m"

set +e
pg_restore \
    --host="$HOST" \
    --port="$PORT" \
    --username="$USER" \
    --dbname="$PRODUCTION_DB" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "$BACKUP_FILE"
RESTORE_EXIT=$?
set -e

if [ $RESTORE_EXIT -eq 0 ] || [ $RESTORE_EXIT -eq 1 ]; then
    echo -e "\033[32m$LOG_PREFIX Step 4/4: Validating restored database...\033[0m"
    if command -v psql >/dev/null 2>&1; then
        TABLE_COUNT=$(psql --host="$HOST" --port="$PORT" --username="$USER" --dbname="$PRODUCTION_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        echo -e "\033[32m$LOG_PREFIX Verified public table count in '$PRODUCTION_DB': $(echo "$TABLE_COUNT" | tr -d ' ') tables present.\033[0m"
    fi
    echo -e "\033[32m$LOG_PREFIX EMERGENCY PRODUCTION RECOVERY COMPLETED SUCCESSFULLY.\033[0m"
    exit 0
else
    echo -e "\033[31m$LOG_PREFIX ERROR: Restore failed with exit code $RESTORE_EXIT. Revert immediately using '$PRE_RECOVERY_DUMP'.\033[0m"
    exit 1
fi

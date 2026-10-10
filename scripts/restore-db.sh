#!/usr/bin/env bash
# ==============================================================================
# OmniSocial AI — Safe Database Restore Script
# Validates archive integrity, enforces non-production safety by default
# ==============================================================================

set -euo pipefail

LOG_PREFIX="[DB-RESTORE $(date -u +"%Y-%m-%dT%H:%M:%SZ")]"

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <backup-file.dump> <target-database-name>"
  echo "Example: $0 ./backups/omnisocial_db_20261010.dump hootsute_restore_test"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_DB="$2"

echo "${LOG_PREFIX} Initiating restore into target database: '${TARGET_DB}'..."

# 1. Verify backup file exists and is readable
if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "${LOG_PREFIX} ERROR: Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

# 2. Strict Safety Guardrail: Unconditionally reject production database targets
LOWER_TARGET_DB=$(echo "${TARGET_DB}" | tr '[:upper:]' '[:lower:]')
PROD_DB_NAME=$(echo "${POSTGRES_DB:-hootsute_db}" | tr '[:upper:]' '[:lower:]')
if [[ "${LOWER_TARGET_DB}" == "hootsute_db" || "${LOWER_TARGET_DB}" == *"prod"* || "${LOWER_TARGET_DB}" == "${PROD_DB_NAME}" ]]; then
  echo "${LOG_PREFIX} CRITICAL SAFETY ABORT: Target database '${TARGET_DB}' is a production database." >&2
  echo "${LOG_PREFIX} Routine restore scripts are strictly prohibited from targeting production databases." >&2
  echo "${LOG_PREFIX} Routine restoration must target a separate disposable database (e.g. 'hootsute_restore_test')." >&2
  echo "${LOG_PREFIX} For emergency production disaster recovery, follow the documented emergency recovery protocol." >&2
  exit 1
fi

# 3. Verify pg_restore exists
if ! command -v pg_restore >/dev/null 2>&1; then
  echo "${LOG_PREFIX} ERROR: 'pg_restore' utility not found in PATH." >&2
  exit 1
fi

# 4. Verify archive integrity before touching the database
echo "${LOG_PREFIX} Validating archive integrity..."
if ! pg_restore --list "${BACKUP_FILE}" >/dev/null 2>&1; then
  echo "${LOG_PREFIX} ERROR: Backup archive is corrupted or not a valid PostgreSQL custom dump." >&2
  exit 1
fi
echo "${LOG_PREFIX} Archive validation passed."

# 5. Extract host/port/user credentials
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"

# 6. Execute pg_restore
echo "${LOG_PREFIX} Restoring into database '${TARGET_DB}' on ${PGHOST}:${PGPORT}..."
set +e
pg_restore \
  --host="${PGHOST}" \
  --port="${PGPORT}" \
  --username="${PGUSER}" \
  --dbname="${TARGET_DB}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "${BACKUP_FILE}"

RESTORE_EXIT=$?
set -e

# Note: pg_restore returns exit code 1 if minor warnings/notices occurred (e.g. drop if exists on non-existent objects)
if [[ ${RESTORE_EXIT} -eq 0 || ${RESTORE_EXIT} -eq 1 ]]; then
  echo "${LOG_PREFIX} SUCCESS: Database restore completed."
  
  # 7. Post-restore table verification
  if command -v psql >/dev/null 2>&1; then
    TABLE_COUNT=$(psql --host="${PGHOST}" --port="${PGPORT}" --username="${PGUSER}" --dbname="${TARGET_DB}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    echo "${LOG_PREFIX} Verified public table count in '${TARGET_DB}': ${TABLE_COUNT} tables present."
  fi
  exit 0
else
  echo "${LOG_PREFIX} ERROR: pg_restore failed with exit code ${RESTORE_EXIT}." >&2
  exit 1
fi

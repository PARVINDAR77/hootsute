#!/usr/bin/env bash
# ==============================================================================
# OmniSocial AI — Production Database Backup Script
# PostgreSQL Custom Archive Format (-Fc) with Integrity Check
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/omnisocial_db_${TIMESTAMP}.dump"
LOG_PREFIX="[DB-BACKUP $(date -u +"%Y-%m-%dT%H:%M:%SZ")]"

echo "${LOG_PREFIX} Starting OmniSocial AI PostgreSQL backup..."

# 1. Verify pg_dump exists
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "${LOG_PREFIX} ERROR: 'pg_dump' utility not found in PATH. Please install PostgreSQL client tools." >&2
  exit 1
fi

# 2. Extract database connection parameters
# Supports DATABASE_URL or individual PG* variables
if [[ -n "${DATABASE_URL:-}" ]]; then
  # Use DATABASE_URL directly
  DB_CONN_ARG="--dbname=${DATABASE_URL}"
else
  PGHOST="${PGHOST:-localhost}"
  PGPORT="${PGPORT:-5432}"
  PGUSER="${PGUSER:-postgres}"
  PGDATABASE="${PGDATABASE:-hootsute_db}"
  
  if [[ -z "${PGDATABASE}" ]]; then
    echo "${LOG_PREFIX} ERROR: Neither DATABASE_URL nor PGDATABASE is set." >&2
    exit 1
  fi
  DB_CONN_ARG="--host=${PGHOST} --port=${PGPORT} --username=${PGUSER} --dbname=${PGDATABASE}"
fi

# 3. Create backup directory if it does not exist
mkdir -p "${BACKUP_DIR}"

if [[ -f "${BACKUP_FILE}" ]]; then
  echo "${LOG_PREFIX} ERROR: Target backup file already exists: ${BACKUP_FILE}" >&2
  exit 1
fi

# 4. Execute pg_dump using PostgreSQL custom format (-Fc)
echo "${LOG_PREFIX} Generating archive to ${BACKUP_FILE}..."
if pg_dump ${DB_CONN_ARG} \
    --format=custom \
    --compress=6 \
    --no-owner \
    --no-privileges \
    --file="${BACKUP_FILE}"; then
  
  # Set restricted permissions on backup file (owner read/write only)
  chmod 600 "${BACKUP_FILE}" 2>/dev/null || true
  
  BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
  echo "${LOG_PREFIX} SUCCESS: Database backup created successfully (${BACKUP_SIZE})"
  echo "${LOG_PREFIX} Archive Location: ${BACKUP_FILE}"
  
  # 5. Integrity check using pg_restore table of contents listing
  if command -v pg_restore >/dev/null 2>&1; then
    echo "${LOG_PREFIX} Verifying archive integrity..."
    pg_restore --list "${BACKUP_FILE}" >/dev/null
    echo "${LOG_PREFIX} Integrity verification passed."
  fi
  
  exit 0
else
  echo "${LOG_PREFIX} ERROR: pg_dump failed! Removing corrupted artifact." >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

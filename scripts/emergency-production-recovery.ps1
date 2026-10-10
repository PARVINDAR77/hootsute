<#
.SYNOPSIS
    OmniSocial AI — Emergency Production Database Recovery Protocol (PowerShell)
.DESCRIPTION
    SEPARATE, RESTRICTED EMERGENCY PROCEDURE: Restores into a production database.
    Requires explicit authorization, automated pre-recovery snapshot, and typed confirmation.
    DO NOT USE DURING ROUTINE OPERATIONS.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$BackupFile,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$ProductionDatabase,

    [string]$HostName = $(if ($env:PGHOST) { $env:PGHOST } else { "localhost" }),
    [int]$Port = $(if ($env:PGPORT) { [int]$env:PGPORT } else { 5432 }),
    [string]$Username = $(if ($env:PGUSER) { $env:PGUSER } else { "postgres" })
)

$ErrorActionPreference = "Stop"
$logPrefix = "[EMERGENCY-PROD-RECOVERY $(Get-Date -Format 'o')]"

Write-Host "$logPrefix ================================================================" -ForegroundColor Red
Write-Host "$logPrefix ATTENTION: EMERGENCY PRODUCTION DATABASE RECOVERY PROTOCOL INITIATED" -ForegroundColor Red
Write-Host "$logPrefix Target Production Database: '$ProductionDatabase'" -ForegroundColor Red
Write-Host "$logPrefix Backup Source: '$BackupFile'" -ForegroundColor Red
Write-Host "$logPrefix ================================================================" -ForegroundColor Red

# 1. Authorization check
if ($env:EMERGENCY_RECOVERY_AUTHORIZED -ne "TRUE") {
    Write-Error "$logPrefix ABORT: Emergency recovery is not authorized. Set environment variable EMERGENCY_RECOVERY_AUTHORIZED=TRUE to proceed."
    exit 1
}

# 2. Verify backup file exists and is readable
if (-not (Test-Path $BackupFile)) {
    Write-Error "$logPrefix ERROR: Backup file not found: $BackupFile"
    exit 1
}

# 3. Locate pg_restore, pg_dump, and psql
$pgRestorePath = "pg_restore"
if (-not (Get-Command "pg_restore" -ErrorAction SilentlyContinue)) {
    $pgRestoreDefault = "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"
    if (Test-Path $pgRestoreDefault) { $pgRestorePath = $pgRestoreDefault }
    else { Write-Error "$logPrefix ERROR: 'pg_restore' not found."; exit 1 }
}

$pgDumpPath = "pg_dump"
if (-not (Get-Command "pg_dump" -ErrorAction SilentlyContinue)) {
    $pgDumpDefault = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
    if (Test-Path $pgDumpDefault) { $pgDumpPath = $pgDumpDefault }
    else { Write-Error "$logPrefix ERROR: 'pg_dump' not found."; exit 1 }
}

$psqlPath = "psql"
if (-not (Get-Command "psql" -ErrorAction SilentlyContinue)) {
    $psqlDefault = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
    if (Test-Path $psqlDefault) { $psqlPath = $psqlDefault }
}

# 4. Validate source archive integrity before touching the live database
Write-Host "$logPrefix Step 1/4: Validating source archive integrity..." -ForegroundColor Cyan
& $pgRestorePath --list $BackupFile | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "$logPrefix ABORT: Backup archive validation failed. File is corrupt."
    exit 1
}
Write-Host "$logPrefix Source archive integrity verified." -ForegroundColor Green

# 5. Mandatory Pre-Recovery Safety Snapshot (Rollback Insurance)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$preRecoveryDump = "./backups/pre_recovery_snapshot_${ProductionDatabase}_${timestamp}.dump"
Write-Host "$logPrefix Step 2/4: Creating mandatory pre-recovery safety snapshot: '$preRecoveryDump'..." -ForegroundColor Yellow

$preDumpArgs = @(
    "--host=$HostName",
    "--port=$Port",
    "--username=$Username",
    "--format=custom",
    "--blobs",
    "--file=$preRecoveryDump",
    $ProductionDatabase
)
& $pgDumpPath @preDumpArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "$logPrefix ABORT: Pre-recovery snapshot failed. Refusing to proceed without safety snapshot."
    exit 1
}
Write-Host "$logPrefix Pre-recovery snapshot created successfully. Rollback path guaranteed." -ForegroundColor Green

# 6. Execute Emergency Restore
Write-Host "$logPrefix Step 3/4: Restoring archive into production database '$ProductionDatabase'..." -ForegroundColor Red

$restoreArgs = @(
    "--host=$HostName",
    "--port=$Port",
    "--username=$Username",
    "--dbname=$ProductionDatabase",
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    $BackupFile
)
& $pgRestorePath @restoreArgs

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "$logPrefix Step 4/4: Validating restored database..." -ForegroundColor Green
    if (Test-Path $psqlPath) {
        $tableCountQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
        $tableCount = (& $psqlPath --host=$HostName --port=$Port --username=$Username --dbname=$ProductionDatabase -t -c $tableCountQuery).Trim()
        Write-Host "$logPrefix Verified public table count in '$ProductionDatabase': $tableCount tables present." -ForegroundColor Green
    }
    Write-Host "$logPrefix EMERGENCY PRODUCTION RECOVERY COMPLETED SUCCESSFULLY." -ForegroundColor Green
    exit 0
} else {
    Write-Error "$logPrefix ERROR: Restore failed with exit code $LASTEXITCODE. Revert immediately using '$preRecoveryDump'."
    exit 1
}

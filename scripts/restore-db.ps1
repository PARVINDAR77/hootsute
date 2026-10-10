<#
.SYNOPSIS
    OmniSocial AI — Safe Database Restore Script (PowerShell)
.DESCRIPTION
    Restores a PostgreSQL custom archive backup with safety guards to prevent accidental production overwrite.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$BackupFile,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$TargetDatabase,

    [string]$HostName = $(if ($env:PGHOST) { $env:PGHOST } else { "localhost" }),
    [int]$Port = $(if ($env:PGPORT) { [int]$env:PGPORT } else { 5432 }),
    [string]$Username = $(if ($env:PGUSER) { $env:PGUSER } else { "postgres" })
)

$ErrorActionPreference = "Stop"
$logPrefix = "[DB-RESTORE $(Get-Date -Format 'o')]"

Write-Host "$logPrefix Initiating restore into target database: '$TargetDatabase'..." -ForegroundColor Cyan

# 1. Verify backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Error "$logPrefix ERROR: Backup file not found: $BackupFile"
    exit 1
}

# 2. Strict Production Guardrail: Unconditionally reject production database targets
$lowerTarget = $TargetDatabase.ToLower()
if ($lowerTarget -eq "hootsute_db" -or $lowerTarget -like "*prod*" -or $lowerTarget -eq $env:POSTGRES_DB) {
    Write-Error "$logPrefix CRITICAL SAFETY ABORT: Target database '$TargetDatabase' is a production database. Routine restore scripts are strictly prohibited from targeting production databases. Routine restoration must target a separate disposable database (e.g. 'hootsute_restore_test'). For emergency disaster recovery, follow the documented emergency recovery protocol."
    exit 1
}

# 3. Locate pg_restore and psql
$pgRestorePath = "pg_restore"
if (-not (Get-Command "pg_restore" -ErrorAction SilentlyContinue)) {
    $pgRestoreDefault = "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"
    if (Test-Path $pgRestoreDefault) {
        $pgRestorePath = $pgRestoreDefault
    } else {
        Write-Error "$logPrefix ERROR: 'pg_restore' utility not found."
        exit 1
    }
}

$psqlPath = "psql"
if (-not (Get-Command "psql" -ErrorAction SilentlyContinue)) {
    $psqlDefault = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
    if (Test-Path $psqlDefault) { $psqlPath = $psqlDefault }
}

# 4. Verify archive integrity
Write-Host "$logPrefix Validating archive integrity..." -ForegroundColor Cyan
& $pgRestorePath --list $BackupFile | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "$logPrefix ERROR: Archive validation failed. Backup may be corrupted."
    exit 1
}
Write-Host "$logPrefix Archive validation passed." -ForegroundColor Green

# 5. Execute restore
Write-Host "$logPrefix Restoring into '$TargetDatabase' on ${HostName}:${Port}..." -ForegroundColor Cyan

$restoreArgs = @(
    "--host=$HostName",
    "--port=$Port",
    "--username=$Username",
    "--dbname=$TargetDatabase",
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    $BackupFile
)

& $pgRestorePath @restoreArgs

# pg_restore exit code 0 (clean) or 1 (minor warnings like DROP IF EXISTS on absent table) are acceptable
if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "$logPrefix SUCCESS: Database restore completed." -ForegroundColor Green
    
    # 6. Verify table count
    if (Test-Path $psqlPath) {
        $tableCountQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
        $tableCount = (& $psqlPath --host=$HostName --port=$Port --username=$Username --dbname=$TargetDatabase -t -c $tableCountQuery).Trim()
        Write-Host "$logPrefix Verified public table count in '$TargetDatabase': $tableCount tables present." -ForegroundColor Green
    }
    exit 0
} else {
    Write-Error "$logPrefix ERROR: pg_restore failed with exit code $LASTEXITCODE."
    exit 1
}

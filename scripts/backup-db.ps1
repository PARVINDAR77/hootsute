<#
.SYNOPSIS
    OmniSocial AI — Production Database Backup Script (PowerShell)
.DESCRIPTION
    Creates a timestamped PostgreSQL custom archive (-Fc) backup using pg_dump.
#>

[CmdletBinding()]
param(
    [string]$BackupDir = "./backups",
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$HostName = $(if ($env:PGHOST) { $env:PGHOST } else { "localhost" }),
    [int]$Port = $(if ($env:PGPORT) { [int]$env:PGPORT } else { 5432 }),
    [string]$Username = $(if ($env:PGUSER) { $env:PGUSER } else { "postgres" }),
    [string]$DatabaseName = $(if ($env:PGDATABASE) { $env:PGDATABASE } else { "hootsute_db" })
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logPrefix = "[DB-BACKUP $(Get-Date -Format 'o')]"

Write-Host "$logPrefix Starting OmniSocial AI PostgreSQL backup..." -ForegroundColor Cyan

# Find pg_dump executable
$pgDumpPath = "pg_dump"
if (-not (Get-Command "pg_dump" -ErrorAction SilentlyContinue)) {
    $pgDefaultPath = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
    if (Test-Path $pgDefaultPath) {
        $pgDumpPath = $pgDefaultPath
    } else {
        $pg16Path = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
        if (Test-Path $pg16Path) {
            $pgDumpPath = $pg16Path
        } else {
            Write-Error "$logPrefix ERROR: 'pg_dump' utility not found. Please install PostgreSQL client tools."
            exit 1
        }
    }
}

# Ensure destination directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$backupFile = Join-Path $BackupDir "omnisocial_db_${timestamp}.dump"

if (Test-Path $backupFile) {
    Write-Error "$logPrefix ERROR: Destination backup file already exists: $backupFile"
    exit 1
}

Write-Host "$logPrefix Generating archive to $backupFile using $pgDumpPath..." -ForegroundColor Cyan

$dumpArgs = @(
    "--host=$HostName",
    "--port=$Port",
    "--username=$Username",
    "--dbname=$DatabaseName",
    "--format=custom",
    "--compress=6",
    "--no-owner",
    "--no-privileges",
    "--file=$backupFile"
)

& $pgDumpPath @dumpArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "$logPrefix ERROR: pg_dump failed with exit code $LASTEXITCODE."
    if (Test-Path $backupFile) { Remove-Item $backupFile -Force }
    exit 1
}

$fileInfo = Get-Item $backupFile
$fileSizeKb = [math]::Round($fileInfo.Length / 1KB, 2)
Write-Host "$logPrefix SUCCESS: Database backup created successfully ($fileSizeKb KB)" -ForegroundColor Green
Write-Host "$logPrefix Archive Location: $($fileInfo.FullName)" -ForegroundColor Green

# Integrity check using pg_restore
$pgRestorePath = "pg_restore"
if (-not (Get-Command "pg_restore" -ErrorAction SilentlyContinue)) {
    $pgRestoreDefault = "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"
    if (Test-Path $pgRestoreDefault) { $pgRestorePath = $pgRestoreDefault }
}

if (Get-Command $pgRestorePath -ErrorAction SilentlyContinue) {
    Write-Host "$logPrefix Verifying archive integrity..." -ForegroundColor Cyan
    & $pgRestorePath --list $backupFile | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "$logPrefix Integrity verification passed." -ForegroundColor Green
    }
}

exit 0

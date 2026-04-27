$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$createdb = "C:\Program Files\PostgreSQL\18\bin\createdb.exe"
$dropdb = "C:\Program Files\PostgreSQL\18\bin\dropdb.exe"
$backendPython = Join-Path $backendDir "venv\Scripts\python.exe"

& $dropdb -h 127.0.0.1 -p 5433 -U postgres --if-exists repairflow
& $createdb -h 127.0.0.1 -p 5433 -U postgres repairflow

Push-Location $backendDir
try {
  & $backendPython .\init_db.py
} finally {
  Pop-Location
}

Write-Host "Local project database recreated and seeded."

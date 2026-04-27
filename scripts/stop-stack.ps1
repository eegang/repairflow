$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$pgData = Join-Path $backendDir "pgdata"
$pgCtl = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"

Get-CimInstance Win32_Process |
  Where-Object {
    ($_.CommandLine -like "*uvicorn*main:app*127.0.0.1*8000*") -or
    ($_.CommandLine -like "*vite*127.0.0.1*5173*")
  } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

& $pgCtl -D $pgData stop | Out-Null

Write-Host "Local project stack stopped."

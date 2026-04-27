$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$pgData = Join-Path $backendDir "pgdata"
$pgLog = Join-Path $backendDir "postgres-local.log"
$uvicornLog = Join-Path $backendDir "uvicorn.log"
$uvicornErrLog = Join-Path $backendDir "uvicorn.err.log"
$viteLog = Join-Path $frontendDir "vite.log"
$viteErrLog = Join-Path $frontendDir "vite.err.log"

$pgCtl = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$createdb = "C:\Program Files\PostgreSQL\18\bin\createdb.exe"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$backendPython = Join-Path $backendDir "venv\Scripts\python.exe"

if (-not (Test-Path (Join-Path $pgData "PG_VERSION"))) {
  throw "Local PostgreSQL data directory not found: $pgData"
}

$pgReady = $false
try {
  & $psql -h 127.0.0.1 -p 5433 -U postgres -d postgres -c "select 1;" | Out-Null
  $pgReady = $true
} catch {
  $pgReady = $false
}

if (-not $pgReady) {
  & $pgCtl -D $pgData -l $pgLog -o " -p 5433" start | Out-Null
  $dbStarted = $false
  for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 1
    try {
      & $psql -h 127.0.0.1 -p 5433 -U postgres -d postgres -c "select 1;" | Out-Null
      $dbStarted = $true
      break
    } catch {
      $dbStarted = $false
    }
  }

  if (-not $dbStarted) {
    throw "Local PostgreSQL failed to start on 127.0.0.1:5433"
  }
}

$dbExists = & $psql -h 127.0.0.1 -p 5433 -U postgres -d postgres -tAc "select 1 from pg_database where datname='repairflow';"
if (-not $dbExists) {
  & $createdb -h 127.0.0.1 -p 5433 -U postgres repairflow
}

Push-Location $backendDir
try {
  & $backendPython .\init_db.py | Out-Null
} finally {
  Pop-Location
}

try {
  $backendHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2
  if ($backendHealth.status -ne "ok") {
    throw "Backend is running but database is unavailable"
  }
} catch {
  if (Test-Path $uvicornLog) { Remove-Item $uvicornLog -Force }
  if (Test-Path $uvicornErrLog) { Remove-Item $uvicornErrLog -Force }
  Start-Process -FilePath $backendPython -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port","8000" -WorkingDirectory $backendDir -RedirectStandardOutput $uvicornLog -RedirectStandardError $uvicornErrLog | Out-Null
  $backendReady = $false
  for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 1
    try {
      $backendHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2
      if ($backendHealth.status -eq "ok") {
        $backendReady = $true
        break
      }
    } catch {
      $backendReady = $false
    }
  }

  if (-not $backendReady) {
    throw "Backend failed to become ready on http://127.0.0.1:8000"
  }
}

try {
  (Invoke-WebRequest -Uri "http://127.0.0.1:5173" -UseBasicParsing -TimeoutSec 2) | Out-Null
} catch {
  if (Test-Path $viteLog) { Remove-Item $viteLog -Force }
  if (Test-Path $viteErrLog) { Remove-Item $viteErrLog -Force }
  Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev","--","--host","127.0.0.1","--port","5173" -WorkingDirectory $frontendDir -RedirectStandardOutput $viteLog -RedirectStandardError $viteErrLog | Out-Null
  Start-Sleep -Seconds 5
}

Write-Host "PostgreSQL: http://127.0.0.1:5433 (local project instance)"
Write-Host "Backend:    http://127.0.0.1:8000"
Write-Host "Frontend:   http://127.0.0.1:5173"

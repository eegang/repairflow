$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$systemPython = "C:\Users\egor\AppData\Local\Python\pythoncore-3.14-64\python.exe"

if (-not (Test-Path $systemPython)) {
  throw "System Python not found at $systemPython"
}

$runner = @'
import sys
import unittest

sys.path.insert(0, r"__BACKEND_DIR__")
sys.path.insert(0, r"__BACKEND_SITE_PACKAGES__")

suite = unittest.defaultTestLoader.discover(r"__BACKEND_TESTS__")
result = unittest.TextTestRunner(verbosity=2).run(suite)
raise SystemExit(0 if result.wasSuccessful() else 1)
'@

$runner = $runner.Replace("__BACKEND_DIR__", $backendDir.Replace("\", "\\"))
$runner = $runner.Replace(
  "__BACKEND_SITE_PACKAGES__",
  (Join-Path $backendDir "venv\Lib\site-packages").Replace("\", "\\")
)
$runner = $runner.Replace("__BACKEND_TESTS__", (Join-Path $backendDir "tests").Replace("\", "\\"))

$tempFile = Join-Path $env:TEMP "repairflow_backend_tests.py"

try {
  Set-Content -LiteralPath $tempFile -Value $runner -Encoding UTF8
  cmd /c "`"$systemPython`" `"$tempFile`""
} finally {
  Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
}

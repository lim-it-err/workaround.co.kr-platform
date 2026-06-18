$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$serviceDir = Join-Path $repoRoot 'services\elevator-service'
$pythonCandidates = @(
  'C:\Program Files\LibreOffice\program\python.exe',
  'C:\Program Files\LibreOffice\program\python-core-3.11.13\bin\python.exe'
)

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  $pythonPath = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($pythonPath) {
    $python = [pscustomobject]@{ Source = $pythonPath }
  }
}

if (-not $python) {
  throw 'python executable not found on PATH or known fallback locations.'
}

Push-Location $serviceDir
try {
  & $python.Source 'app.py'
}
finally {
  Pop-Location
}

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $repoRoot '.codex-preview'
$names = @('frontend-7000', 'gateway-8080', 'elevator-8003')

foreach ($name in $names) {
  $pidPath = Join-Path $stateDir "$name.pid"
  if (-not (Test-Path $pidPath)) {
    continue
  }

  $pidValue = (Get-Content -LiteralPath $pidPath -Raw -ErrorAction SilentlyContinue).Trim()
  if (-not $pidValue) {
    Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
    continue
  }

  try {
    Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
  } catch {
  }

  Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
}

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $repoRoot '.codex-preview'
$names = @('frontend-7000', 'gateway-8080', 'elevator-8003')
$dockerExe = 'C:\Users\user\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe'

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

if (Test-Path $dockerExe) {
  & $dockerExe rm -f workaround-elevator-service 2>$null | Out-Null
}

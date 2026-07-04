$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $repoRoot 'frontend'
$npmCommand = Get-Command npm -ErrorAction SilentlyContinue

if (-not $npmCommand) {
  throw @"
npm is not available on PATH.
Install the official Windows x64 Node.js 22 LTS distribution first, then rerun this command.
You can inspect the current baseline with:
  powershell -ExecutionPolicy Bypass -File .\tools\check-node-toolchain.ps1
"@
}

Push-Location $frontendDir
try {
  Write-Host "Using PATH npm to install frontend dependencies."
  & $npmCommand.Source install
}
finally {
  Pop-Location
}

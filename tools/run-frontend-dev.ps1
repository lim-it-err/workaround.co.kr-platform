$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $repoRoot 'frontend'
$localNode = Join-Path $repoRoot 'tools\local-node\node.exe'
$viteEntry = Join-Path $frontendDir 'node_modules\vite\bin\vite.js'
$npmCommand = Get-Command npm -ErrorAction SilentlyContinue

Push-Location $frontendDir
try {
  if ($npmCommand) {
    Write-Host "Using PATH npm for the frontend dev server."
    & $npmCommand.Source run dev -- --host 0.0.0.0 --port 7000
    return
  }

  if (-not (Test-Path $localNode)) {
    throw "Node runtime not found: $localNode"
  }

  if (-not (Test-Path $viteEntry)) {
    throw "Vite entry not found: $viteEntry`nInstall frontend dependencies after installing the official Node.js 22 LTS + npm baseline."
  }

  Write-Host "npm is not available on PATH. Falling back to the repository-local Node + Vite entry."
  & $localNode $viteEntry --host 0.0.0.0 --port 7000
}
finally {
  Pop-Location
}

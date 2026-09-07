param(
  [switch]$SkipBuild,
  [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$repositoryRoot = (Resolve-Path (Join-Path $scriptDir '../..')).Path
$frontendDir = Join-Path $repositoryRoot 'frontend'
$distDir = Join-Path $frontendDir 'dist'
$routesSource = Join-Path $scriptDir 'pages/_routes.json'
$routesTarget = Join-Path $distDir '_routes.json'

if (-not $SkipBuild) {
  $npm = Get-Command npm -ErrorAction Stop
  Push-Location $frontendDir
  try {
    & $npm.Source run build
    if ($LASTEXITCODE -ne 0) {
      throw "Frontend build failed with exit code $LASTEXITCODE."
    }
  }
  finally {
    Pop-Location
  }
}

$indexFile = Join-Path $distDir 'index.html'
if (-not (Test-Path $indexFile -PathType Leaf)) {
  throw "Pages output is missing: $indexFile"
}

Copy-Item -Path $routesSource -Destination $routesTarget -Force

$result = [ordered]@{
  buildCommand = 'npm run build'
  frontendDirectory = $frontendDir
  outputDirectory = $distDir
  routesFile = $routesTarget
  ready = $true
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 3
  exit 0
}

Write-Host "Cloudflare Pages output ready: $distDir"
Write-Host "Build command: npm run build"
Write-Host "Output directory: frontend/dist"

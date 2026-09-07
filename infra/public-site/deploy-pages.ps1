param(
  [string]$ProjectName = $env:CLOUDFLARE_PAGES_PROJECT,
  [string]$Branch = $env:CLOUDFLARE_PAGES_BRANCH,
  [switch]$SkipBuild,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ProjectName)) {
  throw 'ProjectName or CLOUDFLARE_PAGES_PROJECT is required.'
}
if ([string]::IsNullOrWhiteSpace($Branch)) {
  $Branch = 'main'
}

$scriptDir = $PSScriptRoot
$repositoryRoot = (Resolve-Path (Join-Path $scriptDir '../..')).Path
$distDir = Join-Path $repositoryRoot 'frontend/dist'
$pagesDir = Join-Path $scriptDir 'pages'

& (Join-Path $scriptDir 'build-pages.ps1') -SkipBuild:$SkipBuild

$arguments = @(
  'wrangler',
  'pages',
  'deploy',
  $distDir,
  '--project-name',
  $ProjectName,
  '--branch',
  $Branch
)

if ($DryRun) {
  Write-Host "Dry run: npx $($arguments -join ' ')"
  Write-Host "Pages Functions directory: $pagesDir/functions"
  exit 0
}

$npx = Get-Command npx -ErrorAction Stop
Push-Location $pagesDir
try {
  & $npx.Source @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Wrangler deploy failed with exit code $LASTEXITCODE."
  }
}
finally {
  Pop-Location
}

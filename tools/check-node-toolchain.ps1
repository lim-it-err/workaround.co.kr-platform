param(
  [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function Get-ToolInfo {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $commands = @(Get-Command $Name -All -ErrorAction SilentlyContinue)
  $paths = @($commands | ForEach-Object { $_.Source } | Sort-Object -Unique)
  $versions = @()

  foreach ($path in $paths) {
    $version = $null

    try {
      $version = (& $path --version 2>&1 | Select-Object -First 1)
    }
    catch {
      $version = $_.Exception.Message
    }

    $versions += [pscustomobject]@{
      path = $path
      version = $version
    }
  }

  return [pscustomobject]@{
    name = $Name
    foundOnPath = $paths.Count -gt 0
    paths = $paths
    versions = $versions
  }
}

function Get-VersionOrNull {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [string[]]$Arguments = @('--version')
  )

  if (-not (Test-Path $Path)) {
    return $null
  }

  try {
    return (& $Path @Arguments 2>&1 | Select-Object -First 1)
  }
  catch {
    return $_.Exception.Message
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$localNodePath = Join-Path $repoRoot 'tools\local-node\node.exe'
$localNpmCmdPath = Join-Path $repoRoot 'tools\local-node\npm.cmd'
$localNpmCliPath = Join-Path $repoRoot 'tools\local-node\node_modules\npm\bin\npm-cli.js'
$bundledNodePath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'

$nodeInfo = Get-ToolInfo -Name 'node'
$npmInfo = Get-ToolInfo -Name 'npm'
$npxInfo = Get-ToolInfo -Name 'npx'

$officialToolchainPresent = $nodeInfo.foundOnPath -and $npmInfo.foundOnPath -and $npxInfo.foundOnPath

$result = [ordered]@{
  recommendedBaseline = 'Windows x64 Node.js 22 LTS with bundled npm/npx on PATH'
  officialToolchainPresent = $officialToolchainPresent
  pathTools = [ordered]@{
    node = $nodeInfo
    npm = $npmInfo
    npx = $npxInfo
  }
  fallback = [ordered]@{
    localNodePath = $localNodePath
    localNodeVersion = Get-VersionOrNull -Path $localNodePath
    localNpmCmdPath = $localNpmCmdPath
    localNpmUsable = Test-Path $localNpmCliPath
    localNpmCliPath = $localNpmCliPath
    bundledNodePath = $bundledNodePath
    bundledNodeVersion = Get-VersionOrNull -Path $bundledNodePath
  }
  preferredCommands = @(
    'Set-Location frontend',
    'npm install',
    'npm run dev -- --host 0.0.0.0 --port 7000',
    'npm run build'
  )
  fallbackCommands = @(
    'powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-dev.ps1',
    'powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-build.ps1'
  )
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 6
  exit 0
}

Write-Host "Recommended baseline: $($result.recommendedBaseline)"
Write-Host "Official toolchain on PATH: $officialToolchainPresent"
Write-Host ""
Write-Host "[PATH tools]"

foreach ($toolName in @('node', 'npm', 'npx')) {
  $tool = $result.pathTools[$toolName]
  $summary = if ($tool.foundOnPath) { 'found' } else { 'missing' }
  Write-Host "- ${toolName}: $summary"

  foreach ($entry in $tool.versions) {
    Write-Host "  - $($entry.path) :: $($entry.version)"
  }
}

Write-Host ""
Write-Host "[Fallback state]"
Write-Host "- local node: $($result.fallback.localNodePath) :: $($result.fallback.localNodeVersion)"
Write-Host "- local npm usable: $($result.fallback.localNpmUsable)"
Write-Host "- bundled node: $($result.fallback.bundledNodePath) :: $($result.fallback.bundledNodeVersion)"
Write-Host ""
Write-Host "[Preferred commands]"
$result.preferredCommands | ForEach-Object { Write-Host "- $_" }
Write-Host ""
Write-Host "[Fallback commands]"
$result.fallbackCommands | ForEach-Object { Write-Host "- $_" }

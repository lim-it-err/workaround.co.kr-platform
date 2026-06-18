param(
  [string]$EnvFile = '.env.public-site',
  [switch]$AsJson,
  [switch]$CheckDns
)

$ErrorActionPreference = 'Stop'

function Get-DockerCommand {
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if ($docker) {
    return $docker.Source
  }

  return $null
}

function Read-KeyValueFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $values = @{}
  foreach ($line in Get-Content -Encoding UTF8 $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
      continue
    }

    $parts = $trimmed -split '=', 2
    if ($parts.Count -eq 2) {
      $values[$parts[0]] = $parts[1]
    }
  }

  return $values
}

function Test-PortListener {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  try {
    $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop)
    return [pscustomobject]@{
      port = $Port
      status = if ($listeners.Count -gt 0) { 'in_use' } else { 'available' }
      listeners = @($listeners | Select-Object -First 5 -Property LocalAddress,LocalPort,OwningProcess)
      note = $null
    }
  }
  catch {
    return [pscustomobject]@{
      port = $Port
      status = 'unknown'
      listeners = @()
      note = $_.Exception.Message
    }
  }
}

function Get-DnsStatus {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Domain
  )

  try {
    $records = @(Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop)
    return [pscustomobject]@{
      domain = $Domain
      status = 'resolved'
      records = @($records | Select-Object -Property Name,Type,IPAddress)
      note = $null
    }
  }
  catch {
    return [pscustomobject]@{
      domain = $Domain
      status = 'unresolved'
      records = @()
      note = $_.Exception.Message
    }
  }
}

$scriptDir = $PSScriptRoot
$resolvedEnvFile = if ([System.IO.Path]::IsPathRooted($EnvFile)) {
  $EnvFile
} else {
  Join-Path $scriptDir $EnvFile
}

$envExists = Test-Path $resolvedEnvFile
$envValues = if ($envExists) { Read-KeyValueFile -Path $resolvedEnvFile } else { @{} }
$dockerPath = Get-DockerCommand

$dockerCli = [pscustomobject]@{
  found = [bool]$dockerPath
  path = $dockerPath
  version = $null
  daemonReachable = $false
  composeAvailable = $false
  note = $null
}

if ($dockerPath) {
  try {
    $dockerCli.version = (& $dockerPath --version 2>&1 | Select-Object -First 1)
  }
  catch {
    $dockerCli.note = $_.Exception.Message
  }

  try {
    [void](& $dockerPath info 2>$null)
    $dockerCli.daemonReachable = ($LASTEXITCODE -eq 0)
  }
  catch {
    $dockerCli.note = $_.Exception.Message
  }

  try {
    [void](& $dockerPath compose version 2>$null)
    $dockerCli.composeAvailable = ($LASTEXITCODE -eq 0)
  }
  catch {
    $dockerCli.note = $_.Exception.Message
  }
}

$requiredKeys = @(
  'PUBLIC_SITE_DOMAIN',
  'PUBLIC_SITE_ALIAS_DOMAIN',
  'PUBLIC_SITE_EMAIL'
)

$missingKeys = @()
foreach ($key in $requiredKeys) {
  if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
    $missingKeys += $key
  }
}

$canonicalDomain = $envValues['PUBLIC_SITE_DOMAIN']
$aliasDomain = $envValues['PUBLIC_SITE_ALIAS_DOMAIN']
$email = $envValues['PUBLIC_SITE_EMAIL']

$configChecks = [pscustomobject]@{
  envFileExists = $envExists
  envFile = $resolvedEnvFile
  missingKeys = $missingKeys
  canonicalDomain = $canonicalDomain
  aliasDomain = $aliasDomain
  publicEmail = $email
  canonicalDiffersFromAlias = if ($canonicalDomain -and $aliasDomain) { $canonicalDomain -ne $aliasDomain } else { $false }
}

$ports = @(
  (Test-PortListener -Port 80),
  (Test-PortListener -Port 443)
)

$dns = @()
if ($CheckDns -and $canonicalDomain) {
  $dns += Get-DnsStatus -Domain $canonicalDomain
}
if ($CheckDns -and $aliasDomain) {
  $dns += Get-DnsStatus -Domain $aliasDomain
}

$result = [ordered]@{
  composeDirectory = $scriptDir
  env = $configChecks
  docker = $dockerCli
  ports = $ports
  dns = $dns
  ready = (
    $configChecks.envFileExists -and
    $missingKeys.Count -eq 0 -and
    $dockerCli.found -and
    $dockerCli.daemonReachable -and
    $dockerCli.composeAvailable
  )
  nextSteps = @(
    'Review PUBLIC_SITE_* values in the env file.',
    'Confirm ports 80 and 443 are reachable on the target host.',
    'Run docker compose --env-file .env.public-site -f docker-compose.public-site.yml up -d --build from infra/public-site.',
    'Collect redirect and TLS evidence with verify-public-site.ps1 after deployment.'
  )
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 6
  exit 0
}

Write-Host "Compose directory: $scriptDir"
Write-Host "Env file: $resolvedEnvFile"
Write-Host "Ready: $($result.ready)"
Write-Host ""
Write-Host "[Env]"
Write-Host "- exists: $($configChecks.envFileExists)"
Write-Host "- missing keys: $(if ($missingKeys.Count -gt 0) { $missingKeys -join ', ' } else { 'none' })"
Write-Host "- canonical: $canonicalDomain"
Write-Host "- alias: $aliasDomain"
Write-Host "- email: $email"
Write-Host ""
Write-Host "[Docker]"
Write-Host "- found: $($dockerCli.found)"
Write-Host "- path: $($dockerCli.path)"
Write-Host "- version: $($dockerCli.version)"
Write-Host "- daemon reachable: $($dockerCli.daemonReachable)"
Write-Host "- compose available: $($dockerCli.composeAvailable)"
if ($dockerCli.note) {
  Write-Host "- note: $($dockerCli.note)"
}
Write-Host ""
Write-Host "[Ports]"
foreach ($port in $ports) {
  Write-Host "- $($port.port): $($port.status)"
  if ($port.note) {
    Write-Host "  - note: $($port.note)"
  }
}
if ($dns.Count -gt 0) {
  Write-Host ""
  Write-Host "[DNS]"
  foreach ($entry in $dns) {
    Write-Host "- $($entry.domain): $($entry.status)"
    if ($entry.note) {
      Write-Host "  - note: $($entry.note)"
    }
  }
}

param(
  [string]$EnvFile = '.env.public-site',
  [ValidateSet('tunnel', 'local', 'caddy')]
  [string]$Profile = 'tunnel',
  [switch]$AsJson,
  [switch]$CheckDns
)

$ErrorActionPreference = 'Stop'

function Read-KeyValueFile {
  param([Parameter(Mandatory = $true)][string]$Path)

  $values = @{}
  foreach ($line in Get-Content -Encoding UTF8 $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    $parts = $trimmed -split '=', 2
    if ($parts.Count -eq 2) { $values[$parts[0]] = $parts[1] }
  }
  return $values
}

function Resolve-ConfiguredPath {
  param([string]$Value, [string]$BaseDirectory)

  if ([string]::IsNullOrWhiteSpace($Value)) { return $null }
  if ([System.IO.Path]::IsPathRooted($Value)) { return $Value }
  return Join-Path $BaseDirectory $Value
}

function Get-PortStatus {
  param([int]$Port)

  try {
    $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop)
    return [pscustomobject]@{ port = $Port; status = if ($listeners.Count) { 'in_use' } else { 'available' } }
  }
  catch {
    return [pscustomobject]@{ port = $Port; status = 'unknown'; note = $_.Exception.Message }
  }
}

function Get-DnsStatus {
  param([string]$Domain)

  try {
    $records = @(Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop)
    return [pscustomobject]@{ domain = $Domain; status = 'resolved'; records = $records.IPAddress }
  }
  catch {
    return [pscustomobject]@{ domain = $Domain; status = 'unresolved'; note = $_.Exception.Message }
  }
}

$scriptDir = $PSScriptRoot
$resolvedEnvFile = if ([System.IO.Path]::IsPathRooted($EnvFile)) { $EnvFile } else { Join-Path $scriptDir $EnvFile }
$envExists = Test-Path $resolvedEnvFile -PathType Leaf
$envValues = if ($envExists) { Read-KeyValueFile -Path $resolvedEnvFile } else { @{} }

$docker = Get-Command docker -ErrorAction SilentlyContinue
$dockerStatus = [ordered]@{
  found = [bool]$docker
  version = $null
  daemonReachable = $false
  composeAvailable = $false
}
if ($docker) {
  $dockerStatus.version = (& $docker.Source --version 2>&1 | Select-Object -First 1)
  & $docker.Source info 2>$null | Out-Null
  $dockerStatus.daemonReachable = ($LASTEXITCODE -eq 0)
  & $docker.Source compose version 2>$null | Out-Null
  $dockerStatus.composeAvailable = ($LASTEXITCODE -eq 0)
}

$requiredKeys = @('PUBLIC_SITE_DOMAIN', 'PUBLIC_SITE_ALIAS_DOMAIN', 'PLATFORM_API_KEY')
if ($Profile -eq 'tunnel') { $requiredKeys += 'CLOUDFLARE_TUNNEL_TOKEN' }

$missingKeys = @($requiredKeys | Where-Object {
  -not $envValues.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($envValues[$_])
})
$platformApiKeyIsPlaceholder = $envValues['PLATFORM_API_KEY'] -eq 'replace-before-public-deploy'

$originKeys = @(
  'CLOUDFLARE_ORIGIN_CERT_CO_KR_PATH',
  'CLOUDFLARE_ORIGIN_KEY_CO_KR_PATH',
  'CLOUDFLARE_ORIGIN_CERT_KR_PATH',
  'CLOUDFLARE_ORIGIN_KEY_KR_PATH'
)
$originFiles = @()
if ($Profile -eq 'caddy') {
  foreach ($key in $originKeys) {
    $path = Resolve-ConfiguredPath -Value $envValues[$key] -BaseDirectory $scriptDir
    $originFiles += [pscustomobject]@{ key = $key; path = $path; exists = if ($path) { Test-Path $path -PathType Leaf } else { $false } }
  }
}

$ports = if ($Profile -eq 'caddy') { @((Get-PortStatus 80), (Get-PortStatus 443)) } else { @() }
$dns = @()
if ($CheckDns) {
  foreach ($domain in @($envValues['PUBLIC_SITE_DOMAIN'], $envValues['PUBLIC_SITE_ALIAS_DOMAIN'])) {
    if ($domain) { $dns += Get-DnsStatus -Domain $domain }
  }
}

$result = [ordered]@{
  profile = $Profile
  envFile = $resolvedEnvFile
  envFileExists = $envExists
  missingKeys = $missingKeys
  platformApiKeyIsPlaceholder = $platformApiKeyIsPlaceholder
  originFiles = $originFiles
  docker = $dockerStatus
  ports = $ports
  dns = $dns
  ready = (
    $envExists -and
    $missingKeys.Count -eq 0 -and
    -not $platformApiKeyIsPlaceholder -and
    ($Profile -ne 'caddy' -or @($originFiles | Where-Object { -not $_.exists }).Count -eq 0) -and
    $dockerStatus.found -and
    $dockerStatus.daemonReachable -and
    $dockerStatus.composeAvailable
  )
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 6
  exit 0
}

Write-Host "Profile: $Profile"
Write-Host "Env file: $resolvedEnvFile"
Write-Host "Missing keys: $(if ($missingKeys.Count) { $missingKeys -join ', ' } else { 'none' })"
Write-Host "Docker daemon reachable: $($dockerStatus.daemonReachable)"
Write-Host "Ready: $($result.ready)"
if ($Profile -eq 'tunnel') {
  Write-Host 'Tunnel opens no inbound host ports. Configure the Cloudflare public hostname to http://gateway:8080.'
}
elseif ($Profile -eq 'caddy') {
  Write-Host 'The caddy profile is retained for legacy/internal operation and is not the primary public path.'
}

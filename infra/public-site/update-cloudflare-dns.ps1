param(
  [string]$PublicIpv4 = $env:PUBLIC_IPV4,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Get-RequiredEnvironmentValue {
  param([Parameter(Mandatory = $true)][string]$Name)

  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Required environment variable is missing: $Name"
  }

  return $value.Trim()
}

function Invoke-CloudflareApi {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$ApiToken,
    [object]$Body
  )

  $parameters = @{
    Method = $Method
    Uri = "https://api.cloudflare.com/client/v4/$Path"
    Headers = @{ Authorization = "Bearer $ApiToken" }
    ErrorAction = 'Stop'
  }

  if ($null -ne $Body) {
    $parameters.ContentType = 'application/json'
    $parameters.Body = $Body | ConvertTo-Json -Depth 5 -Compress
  }

  $response = Invoke-RestMethod @parameters
  if (-not $response.success) {
    $messages = @($response.errors | ForEach-Object { $_.message }) -join '; '
    throw "Cloudflare API request failed: $messages"
  }

  return $response
}

if ([string]::IsNullOrWhiteSpace($PublicIpv4)) {
  $PublicIpv4 = (Invoke-RestMethod -Uri 'https://api.ipify.org' -Method Get -ErrorAction Stop).Trim()
}

$parsedAddress = $null
if (-not [System.Net.IPAddress]::TryParse($PublicIpv4, [ref]$parsedAddress) -or
    $parsedAddress.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) {
  throw "PUBLIC_IPV4 is not a valid IPv4 address: $PublicIpv4"
}

$canonicalDomain = if ($env:PUBLIC_SITE_DOMAIN) { $env:PUBLIC_SITE_DOMAIN.Trim() } else { 'workaround.co.kr' }
$aliasDomain = if ($env:PUBLIC_SITE_ALIAS_DOMAIN) { $env:PUBLIC_SITE_ALIAS_DOMAIN.Trim() } else { 'workaround.kr' }
$zones = @(
  [pscustomobject]@{ zoneIdName = 'CLOUDFLARE_ZONE_ID_CO_KR'; zoneId = $env:CLOUDFLARE_ZONE_ID_CO_KR; recordName = $canonicalDomain },
  [pscustomobject]@{ zoneIdName = 'CLOUDFLARE_ZONE_ID_KR'; zoneId = $env:CLOUDFLARE_ZONE_ID_KR; recordName = $aliasDomain }
)

foreach ($zone in $zones) {
  if ([string]::IsNullOrWhiteSpace($zone.zoneId)) {
    throw "Required environment variable is missing: $($zone.zoneIdName)"
  }
}

if ($DryRun) {
  $zones | ForEach-Object {
    [pscustomobject]@{
      action = 'would_upsert'
      name = $_.recordName
      type = 'A'
      content = $PublicIpv4
      proxied = $true
    }
  } | ConvertTo-Json -Depth 4
  exit 0
}

$apiToken = Get-RequiredEnvironmentValue -Name 'CLOUDFLARE_API_TOKEN'
$results = @()

foreach ($zone in $zones) {
  $escapedName = [Uri]::EscapeDataString($zone.recordName)
  $lookup = Invoke-CloudflareApi -Method 'Get' -Path "zones/$($zone.zoneId)/dns_records?type=A&name=$escapedName" -ApiToken $apiToken
  $payload = @{
    type = 'A'
    name = $zone.recordName
    content = $PublicIpv4
    ttl = 1
    proxied = $true
  }

  if (@($lookup.result).Count -gt 1) {
    throw "Multiple A records found for $($zone.recordName); refusing an ambiguous update."
  }

  if (@($lookup.result).Count -eq 1) {
    $recordId = $lookup.result[0].id
    $response = Invoke-CloudflareApi -Method 'Put' -Path "zones/$($zone.zoneId)/dns_records/$recordId" -ApiToken $apiToken -Body $payload
    $action = 'updated'
  }
  else {
    $response = Invoke-CloudflareApi -Method 'Post' -Path "zones/$($zone.zoneId)/dns_records" -ApiToken $apiToken -Body $payload
    $action = 'created'
  }

  $results += [pscustomobject]@{
    action = $action
    id = $response.result.id
    name = $response.result.name
    type = $response.result.type
    content = $response.result.content
    proxied = $response.result.proxied
  }
}

$results | ConvertTo-Json -Depth 4

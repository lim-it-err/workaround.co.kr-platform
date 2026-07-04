param(
  [string]$FrontendBaseUrl = 'http://127.0.0.1:7000',
  [string]$ElevatorServiceBaseUrl = 'http://127.0.0.1:8003',
  [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function New-WebRequestOptions {
  $options = @{}
  if ((Get-Command Invoke-WebRequest).Parameters.ContainsKey('UseBasicParsing')) {
    $options.UseBasicParsing = $true
  }
  return $options
}

function New-RestMethodOptions {
  $options = @{}
  if ((Get-Command Invoke-RestMethod).Parameters.ContainsKey('UseBasicParsing')) {
    $options.UseBasicParsing = $true
  }
  return $options
}

function Invoke-PreviewProbe {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [ValidateSet('web', 'rest')]
    [string]$Kind,

    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  $result = [ordered]@{
    name = $Name
    kind = $Kind
    url = $Url
    ok = $false
  }

  try {
    if ($Kind -eq 'rest') {
      $restOptions = New-RestMethodOptions
      $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5 @restOptions
      $result.ok = $true
      $result.summary = $response
      return $result
    }

    $webOptions = New-WebRequestOptions
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 5 @webOptions
    $result.statusCode = [int]$response.StatusCode
    $result.ok = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
    $content = if ($null -eq $response.Content) { '' } else { $response.Content }
    $result.contentLength = $content.Length
    return $result
  }
  catch {
    $result.error = $_.Exception.Message
    return $result
  }
}

$frontendChecks = @(
  Invoke-PreviewProbe -Name 'frontend-root' -Kind 'web' -Url "$FrontendBaseUrl/"
  Invoke-PreviewProbe -Name 'frontend-main-js' -Kind 'web' -Url "$FrontendBaseUrl/src/main.js"
  Invoke-PreviewProbe -Name 'frontend-app-vue' -Kind 'web' -Url "$FrontendBaseUrl/src/App.vue"
)

$serviceChecks = @(
  Invoke-PreviewProbe -Name 'elevator-health' -Kind 'rest' -Url "$ElevatorServiceBaseUrl/health"
  Invoke-PreviewProbe -Name 'elevator-state' -Kind 'rest' -Url "$ElevatorServiceBaseUrl/api/state"
)

$report = [ordered]@{
  generatedAt = [DateTime]::UtcNow.ToString('o')
  frontendBaseUrl = $FrontendBaseUrl
  elevatorServiceBaseUrl = $ElevatorServiceBaseUrl
  frontendChecks = $frontendChecks
  serviceChecks = $serviceChecks
}

$allChecks = @($frontendChecks + $serviceChecks)
$report.ok = ($allChecks | Where-Object { -not $_.ok }).Count -eq 0

if ($AsJson) {
  $report | ConvertTo-Json -Depth 8
  exit 0
}

Write-Host "Elevator preview smoke"
Write-Host "  frontend: $FrontendBaseUrl"
Write-Host "  service : $ElevatorServiceBaseUrl"
Write-Host ""

foreach ($check in $allChecks) {
  $status = if ($check.ok) { 'OK' } else { 'FAIL' }
  Write-Host ("[{0}] {1} :: {2}" -f $status, $check.name, $check.url)
  if ($check.Contains('statusCode')) {
    Write-Host ("  statusCode: {0}" -f $check.statusCode)
  }
  if ($check.Contains('contentLength')) {
    Write-Host ("  contentLength: {0}" -f $check.contentLength)
  }
  if ($check.Contains('summary')) {
    Write-Host ("  summary: {0}" -f (($check.summary | ConvertTo-Json -Depth 6 -Compress)))
  }
  if ($check.Contains('error')) {
    Write-Host ("  error: {0}" -f $check.error)
  }
}

if (-not $report.ok) {
  exit 1
}

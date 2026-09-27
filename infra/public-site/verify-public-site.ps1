param(
  [string]$CanonicalUrl = 'https://workaround.co.kr',
  [string]$AliasUrl = 'http://workaround.kr',
  [string]$LocalHealthUrl = 'http://127.0.0.1:8010/health',
  [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function Invoke-Check {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [string]$Method = 'GET'
  )

  try {
    $requestParams = @{
      Uri = $Url
      Method = $Method
      MaximumRedirection = 0
      ErrorAction = 'Stop'
    }

    if ((Get-Command Invoke-WebRequest).Parameters.ContainsKey('SkipHttpErrorCheck')) {
      $requestParams.SkipHttpErrorCheck = $true
    }

    $response = Invoke-WebRequest @requestParams
    return [pscustomobject]@{
      name = $Name
      url = $Url
      ok = $true
      statusCode = [int]$response.StatusCode
      location = $response.Headers['Location']
      contentType = $response.Headers['Content-Type']
      note = $null
    }
  }
  catch {
    $statusCode = $null
    $location = $null
    $contentType = $null

    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode
      $location = $_.Exception.Response.Headers['Location']
      $contentType = $_.Exception.Response.Headers['Content-Type']
    }

    return [pscustomobject]@{
      name = $Name
      url = $Url
      ok = $false
      statusCode = $statusCode
      location = $location
      contentType = $contentType
      note = $_.Exception.Message
    }
  }
}

$results = @(
  (Invoke-Check -Name 'localHealth' -Url $LocalHealthUrl),
  (Invoke-Check -Name 'aliasRedirect' -Url $AliasUrl -Method 'HEAD'),
  (Invoke-Check -Name 'canonicalSite' -Url $CanonicalUrl -Method 'HEAD')
)

$result = [ordered]@{
  checks = $results
  summary = [ordered]@{
    localHealthOk = ($results | Where-Object { $_.name -eq 'localHealth' }).ok
    aliasRedirectOk = (($results | Where-Object { $_.name -eq 'aliasRedirect' }).statusCode -in 301, 302, 307, 308)
    canonicalTlsOk = (($results | Where-Object { $_.name -eq 'canonicalSite' }).statusCode -eq 200)
  }
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 5
  exit 0
}

foreach ($check in $results) {
  Write-Host "[$($check.name)] $($check.url)"
  Write-Host "- ok: $($check.ok)"
  Write-Host "- status: $($check.statusCode)"
  if ($check.location) {
    Write-Host "- location: $($check.location)"
  }
  if ($check.contentType) {
    Write-Host "- content-type: $($check.contentType)"
  }
  if ($check.note) {
    Write-Host "- note: $($check.note)"
  }
  Write-Host ""
}

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $repoRoot '.codex-preview'
$frontendScript = Join-Path $repoRoot 'tools\run-frontend-dev.ps1'
$gatewayJar = Join-Path $repoRoot 'gateway\target\gateway-0.0.1-SNAPSHOT.jar'
$javaExe = Join-Path $repoRoot 'tools\runtime\jdk-21\bin\java.exe'
$elevatorApp = Join-Path $repoRoot 'services\elevator-service\app.py'
$dockerExe = 'C:\Users\user\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe'
$python = Get-Command python -ErrorAction SilentlyContinue
$pythonCandidates = @(
  'C:\Program Files\LibreOffice\program\python.exe',
  'C:\Program Files\LibreOffice\program\python-core-3.11.13\bin\python.exe'
)

New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

function Get-ManagedProcess {
  param([string]$PidPath)

  if (-not (Test-Path $PidPath)) {
    return $null
  }

  $pidValue = (Get-Content -LiteralPath $PidPath -Raw -ErrorAction SilentlyContinue).Trim()
  if (-not $pidValue) {
    return $null
  }

  try {
    return Get-Process -Id ([int]$pidValue) -ErrorAction Stop
  } catch {
    return $null
  }
}

function Start-ManagedProcess {
  param(
    [string]$Name,
    [string]$Command,
    [string]$Arguments,
    [string]$WorkingDirectory
  )

  $pidPath = Join-Path $stateDir "$Name.pid"
  $existing = Get-ManagedProcess -PidPath $pidPath
  if ($existing) {
    return [pscustomobject]@{
      Name = $Name
      Action = 'already-running'
      Id = $existing.Id
    }
  }

  $process = Start-Process `
    -FilePath $Command `
    -ArgumentList $Arguments `
    -WorkingDirectory $WorkingDirectory `
    -WindowStyle Hidden `
    -PassThru

  Set-Content -LiteralPath $pidPath -Value $process.Id -Encoding UTF8

  return [pscustomobject]@{
    Name = $Name
    Action = 'started'
    Id = $process.Id
  }
}

function Wait-HttpReady {
  param(
    [string]$Name,
    [string]$Url,
    [int]$TimeoutSeconds = 90
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      return [pscustomobject]@{
        Name = $Name
        Url = $Url
        StatusCode = [int]$response.StatusCode
        Ready = $true
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  return [pscustomobject]@{
    Name = $Name
    Url = $Url
    StatusCode = $null
    Ready = $false
  }
}

function Start-ElevatorContainer {
  param([string]$ServiceDirectory)

  if (-not (Test-Path $dockerExe)) {
    return $null
  }

  & $dockerExe rm -f workaround-elevator-service 2>$null | Out-Null
  & $dockerExe build -t workaround-elevator-service:local $ServiceDirectory | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to build workaround-elevator-service:local"
  }

  $containerId = (& $dockerExe run -d --name workaround-elevator-service -p 8003:8003 workaround-elevator-service:local).Trim()
  if (-not $containerId) {
    throw "Failed to start workaround-elevator-service container"
  }

  return [pscustomobject]@{
    Name = 'elevator-8003'
    Action = 'started-docker'
    Id = $containerId
  }
}

if (-not (Test-Path $javaExe)) {
  throw "Java runtime not found: $javaExe"
}

if (-not (Test-Path $gatewayJar)) {
  throw "Gateway jar not found: $gatewayJar"
}

if (-not (Test-Path $frontendScript)) {
  throw "Frontend dev script not found: $frontendScript"
}

if (-not (Test-Path $elevatorApp)) {
  throw "Elevator service entry not found: $elevatorApp"
}

if (-not $python) {
  $pythonCandidate = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($pythonCandidate) {
    $python = [pscustomobject]@{ Source = $pythonCandidate }
  }
}

if (-not $python -and -not (Test-Path $dockerExe)) {
  throw "Neither a local python runtime nor Docker Desktop docker.exe is available for elevator-service."
}

$results = @()
$elevatorWorkingDirectory = Join-Path $repoRoot 'services\elevator-service'
$results += Start-ManagedProcess -Name 'gateway-8080' -Command $javaExe -Arguments "-jar `"$gatewayJar`"" -WorkingDirectory $repoRoot
$results += Start-ManagedProcess -Name 'frontend-7000' -Command 'powershell.exe' -Arguments "-NoProfile -ExecutionPolicy Bypass -File `"$frontendScript`"" -WorkingDirectory $repoRoot

$elevatorResult = $null
if ($python) {
  $elevatorCommand = "& '$($python.Source)' 'app.py'"
  $elevatorResult = Start-ManagedProcess -Name 'elevator-8003' -Command 'powershell.exe' -Arguments "-NoProfile -Command Set-Location '$elevatorWorkingDirectory'; $elevatorCommand" -WorkingDirectory $repoRoot
}

$elevatorHealth = Wait-HttpReady -Name 'elevator-8003' -Url 'http://127.0.0.1:8003/health' -TimeoutSeconds 12
if (-not $elevatorHealth.Ready -and (Test-Path $dockerExe)) {
  $localElevator = Get-ManagedProcess -PidPath (Join-Path $stateDir 'elevator-8003.pid')
  if ($localElevator) {
    Stop-Process -Id $localElevator.Id -Force -ErrorAction SilentlyContinue
  }
  $elevatorResult = Start-ElevatorContainer -ServiceDirectory $elevatorWorkingDirectory
  $elevatorHealth = Wait-HttpReady -Name 'elevator-8003' -Url 'http://127.0.0.1:8003/health' -TimeoutSeconds 30
}

$health = @()
$health += $elevatorHealth
$health += Wait-HttpReady -Name 'gateway-8080' -Url 'http://127.0.0.1:8080/api/health'
$health += Wait-HttpReady -Name 'frontend-7000' -Url 'http://127.0.0.1:7000'

if ($elevatorResult) {
  $results += $elevatorResult
}

[pscustomobject]@{
  processes = $results
  health = $health
} | ConvertTo-Json -Depth 6

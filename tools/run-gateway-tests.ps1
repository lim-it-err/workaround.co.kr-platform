$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$gatewayDir = Join-Path $repoRoot 'gateway'
$localJavaHome = Join-Path $repoRoot 'tools\runtime\jdk-21'
$localMaven = Join-Path $repoRoot 'tools\runtime\apache-maven-3.9.9\bin\mvn.cmd'

Push-Location $gatewayDir
try {
  $mavenPath = $null
  if (Test-Path $localMaven) {
    $mavenPath = (Resolve-Path $localMaven).Path
  } else {
    $maven = Get-Command mvn -ErrorAction SilentlyContinue
    if ($maven) {
      $mavenPath = $maven.Source
    }
  }

  if (-not $mavenPath) {
    throw "Maven executable not found. Install Java 21 + Maven or use the workspace-local runtime before running gateway tests."
  }

  if ((Test-Path $localJavaHome) -and -not $env:JAVA_HOME) {
    $env:JAVA_HOME = (Resolve-Path $localJavaHome).Path
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
  }

  & $mavenPath -B test jacoco:report
}
finally {
  Pop-Location
}

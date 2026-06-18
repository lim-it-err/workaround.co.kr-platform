param(
    [switch]$Once,
    [int]$IntervalSeconds = 600,
    [string]$LogPath,
    [string]$PythonPath,
    [string]$RepoRoot
)

$ErrorActionPreference = "Stop"

function Resolve-PythonExecutable {
    param([string]$PreferredPath)

    $candidates = @()
    if ($PreferredPath) {
        $candidates += $PreferredPath
    }

    $scriptRoot = $PSScriptRoot
    $bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
    $libreOfficePython = "C:\Program Files\LibreOffice\program\python.exe"

    $candidates += @(
        $bundledPython,
        $libreOfficePython
    )

    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCommand) {
        $candidates += $pythonCommand.Source
    }

    foreach ($candidate in $candidates) {
        if (-not [string]::IsNullOrWhiteSpace($candidate) -and (Test-Path $candidate)) {
            return (Resolve-Path $candidate).Path
        }
    }

    throw "Python executable not found. Use -PythonPath to specify it explicitly."
}

$scriptRoot = $PSScriptRoot
$repoRootPath = if ($RepoRoot) { (Resolve-Path $RepoRoot).Path } else { Split-Path -Parent (Split-Path -Parent $scriptRoot) }
$heartbeatScript = Join-Path $scriptRoot "heartbeat.py"
$pythonExecutable = Resolve-PythonExecutable -PreferredPath $PythonPath

$arguments = @($heartbeatScript, "--repo-root", $repoRootPath, "--interval-seconds", $IntervalSeconds)
if ($Once) {
    $arguments += "--once"
}
if ($LogPath) {
    $arguments += @("--log-path", $LogPath)
}

Write-Host "Using Python: $pythonExecutable"
Write-Host "Repo root: $repoRootPath"
Write-Host "Heartbeat script: $heartbeatScript"

& $pythonExecutable @arguments

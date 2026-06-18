[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('register', 'unregister', 'status')]
    [string]$Action,

    [string]$TaskName = 'workaround-platform-orchestrator-heartbeat',
    [int]$IntervalMinutes = 10,
    [string]$LogPath = 'tmp/orchestrator-heartbeat.ndjson',
    [string]$PythonPath,
    [string]$RepoRoot
)

$ErrorActionPreference = 'Stop'

function Get-PowershellExecutable {
    $candidate = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
    if (Test-Path $candidate) {
        return $candidate
    }

    $command = Get-Command powershell.exe -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    throw 'powershell.exe not found.'
}

function Resolve-RepositoryRoot {
    param([string]$ConfiguredRepoRoot)

    if ($ConfiguredRepoRoot) {
        return (Resolve-Path $ConfiguredRepoRoot).Path
    }

    return (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
}

function Invoke-Schtasks {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'

    try {
        $output = & schtasks.exe @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    return [pscustomobject]@{
        Arguments = $Arguments
        ExitCode = $exitCode
        Output = @($output)
        Success = ($exitCode -eq 0)
    }
}

function Ensure-TaskLauncher {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ResolvedRepoRoot,
        [Parameter(Mandatory = $true)]
        [string]$ResolvedLogPath,
        [string]$PreferredPythonPath
    )

    $launcherPath = Join-Path $ResolvedRepoRoot 'workers\orchestrator-heartbeat\task-run-heartbeat.cmd'
    $runnerPath = Join-Path $ResolvedRepoRoot 'workers\orchestrator-heartbeat\run-heartbeat.ps1'
    if (-not (Test-Path $runnerPath)) {
        throw "Heartbeat runner not found: $runnerPath"
    }

    $escapedRunnerPath = $runnerPath.Replace('"', '""')
    $escapedLogPath = $ResolvedLogPath.Replace('"', '""')
    $launcherLines = @(
        '@echo off',
        'setlocal',
        ('set "RUNNER_PATH={0}"' -f $escapedRunnerPath),
        ('set "LOG_PATH={0}"' -f $escapedLogPath),
        'set "POWERSHELL_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"',
        'if not exist "%POWERSHELL_EXE%" set "POWERSHELL_EXE=powershell.exe"',
        '"%POWERSHELL_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%RUNNER_PATH%" -Once -LogPath "%LOG_PATH%"'
    )

    if ($PreferredPythonPath) {
        $escapedPythonPath = $PreferredPythonPath.Replace('"', '""')
        $launcherLines[-1] = $launcherLines[-1] + (' -PythonPath "{0}"' -f $escapedPythonPath)
    }

    $launcherLines += @(
        'set "EXIT_CODE=%ERRORLEVEL%"',
        'endlocal & exit /b %EXIT_CODE%'
    )

    [System.IO.File]::WriteAllLines($launcherPath, $launcherLines, [System.Text.Encoding]::ASCII)
    return $launcherPath
}

function New-TaskCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ResolvedRepoRoot,
        [Parameter(Mandatory = $true)]
        [string]$ResolvedLogPath,
        [string]$PreferredPythonPath
    )

    $launcherPath = Ensure-TaskLauncher -ResolvedRepoRoot $ResolvedRepoRoot -ResolvedLogPath $ResolvedLogPath -PreferredPythonPath $PreferredPythonPath
    return ('"{0}"' -f $launcherPath)
}

$resolvedRepoRoot = Resolve-RepositoryRoot -ConfiguredRepoRoot $RepoRoot
$resolvedLogPath = if ([System.IO.Path]::IsPathRooted($LogPath)) {
    $LogPath
} else {
    Join-Path $resolvedRepoRoot $LogPath
}

$taskCommand = New-TaskCommand -ResolvedRepoRoot $resolvedRepoRoot -ResolvedLogPath $resolvedLogPath -PreferredPythonPath $PythonPath

switch ($Action) {
    'register' {
        $arguments = @(
            '/Create',
            '/SC', 'MINUTE',
            '/MO', $IntervalMinutes,
            '/TN', $TaskName,
            '/TR', $taskCommand,
            '/F'
        )

        if ($PSCmdlet.ShouldProcess($TaskName, 'Register heartbeat scheduled task')) {
            $result = Invoke-Schtasks -Arguments $arguments
            if (-not $result.Success) {
                throw ("Scheduled task registration failed.`n{0}" -f ($result.Output -join [Environment]::NewLine))
            }

            [pscustomobject]@{
                action = 'register'
                taskName = $TaskName
                intervalMinutes = $IntervalMinutes
                logPath = $resolvedLogPath
                command = $taskCommand
                registered = $true
                output = $result.Output
            }
            return
        }

        [pscustomobject]@{
            action = 'register'
            taskName = $TaskName
            intervalMinutes = $IntervalMinutes
            logPath = $resolvedLogPath
            command = $taskCommand
            registered = $false
            note = 'WhatIf or ShouldProcess declined.'
        }
        return
    }
    'unregister' {
        $arguments = @('/Delete', '/TN', $TaskName, '/F')

        if ($PSCmdlet.ShouldProcess($TaskName, 'Unregister heartbeat scheduled task')) {
            $result = Invoke-Schtasks -Arguments $arguments
            if (-not $result.Success) {
                throw ("Scheduled task removal failed.`n{0}" -f ($result.Output -join [Environment]::NewLine))
            }

            [pscustomobject]@{
                action = 'unregister'
                taskName = $TaskName
                removed = $true
                output = $result.Output
            }
            return
        }

        [pscustomobject]@{
            action = 'unregister'
            taskName = $TaskName
            removed = $false
            note = 'WhatIf or ShouldProcess declined.'
        }
        return
    }
    'status' {
        $arguments = @('/Query', '/TN', $TaskName, '/FO', 'LIST', '/V')

        try {
            $result = Invoke-Schtasks -Arguments $arguments
        }
        catch {
            [pscustomobject]@{
                action = 'status'
                taskName = $TaskName
                registered = $false
                accessible = $false
                note = $_.Exception.Message
            }
            return
        }

        if ($result.Success) {
            [pscustomobject]@{
                action = 'status'
                taskName = $TaskName
                registered = $true
                accessible = $true
                command = $taskCommand
                output = $result.Output
            }
            return
        }

        $joined = $result.Output -join [Environment]::NewLine
        $notRegistered = $joined -match 'cannot find the file specified' -or $joined -match 'cannot find the path specified' -or $joined -match '찾을 수 없습니다' -or $joined -match '경로를 찾을 수 없습니다'
        $accessDenied = $joined -match 'Access is denied' -or $joined -match '액세스가 거부되었습니다'

        [pscustomobject]@{
            action = 'status'
            taskName = $TaskName
            registered = $false
            accessible = (-not $accessDenied)
            command = $taskCommand
            note = if ($notRegistered) { 'Task is not registered.' } elseif ($accessDenied) { 'Task Scheduler query was blocked by the current permission context.' } else { 'Task query failed.' }
            output = $result.Output
            exitCode = $result.ExitCode
        }
        return
    }
}

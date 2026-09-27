param(
    [switch]$RunDockerGpuSmoke,
    [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function New-Check {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Detail,
        $Evidence = $null
    )

    return [ordered]@{
        name = $Name
        status = $Status
        detail = $Detail
        evidence = $Evidence
    }
}

function Invoke-SafeCommand {
    param(
        [string]$FilePath,
        [string[]]$Arguments = @()
    )

    try {
        $command = Get-Command $FilePath -ErrorAction Stop
        $output = & $command.Source @Arguments 2>&1
        return [ordered]@{
            found = $true
            path = $command.Source
            exitCode = $LASTEXITCODE
            output = ($output | Out-String).Trim()
        }
    } catch {
        return [ordered]@{
            found = $false
            path = $null
            exitCode = $null
            output = $_.Exception.Message
        }
    }
}

function Get-SafeCimInstance {
    param(
        [string]$ClassName
    )

    try {
        return [ordered]@{
            ok = $true
            data = Get-CimInstance $ClassName
            error = $null
        }
    } catch {
        return [ordered]@{
            ok = $false
            data = $null
            error = $_.Exception.Message
        }
    }
}

function Add-NextStep {
    param(
        [System.Collections.Generic.List[string]]$List,
        [string]$Message
    )

    if (-not $List.Contains($Message)) {
        $List.Add($Message)
    }
}

$checks = New-Object System.Collections.Generic.List[object]
$nextSteps = New-Object System.Collections.Generic.List[string]

$osInfo = Get-SafeCimInstance -ClassName 'Win32_OperatingSystem'
$gpuInfo = Get-SafeCimInstance -ClassName 'Win32_VideoController'

if ($osInfo.ok) {
    $checks.Add((New-Check -Name 'host-os' -Status 'ok' -Detail 'Host OS information collected.' -Evidence ([ordered]@{
        caption = $osInfo.data.Caption
        version = $osInfo.data.Version
        buildNumber = $osInfo.data.BuildNumber
        lastBootUpTime = $osInfo.data.LastBootUpTime
    })))
} else {
    $checks.Add((New-Check -Name 'host-os' -Status 'skipped' -Detail 'Host OS CIM query could not be read in this environment.' -Evidence $osInfo.error))
}

if ($gpuInfo.ok) {
    $gpuSummary = $gpuInfo.data | Select-Object Name, DriverVersion, AdapterRAM
    $nvidiaGpu = $gpuSummary | Where-Object { $_.Name -match 'NVIDIA' }
    if ($nvidiaGpu) {
        $checks.Add((New-Check -Name 'gpu-detected' -Status 'ok' -Detail 'NVIDIA GPU was detected from Win32_VideoController.' -Evidence $nvidiaGpu))
    } else {
        $checks.Add((New-Check -Name 'gpu-detected' -Status 'missing' -Detail 'NVIDIA GPU was not detected from Win32_VideoController.' -Evidence $gpuSummary))
        Add-NextStep -List $nextSteps -Message 'Verify that the RTX5070 device is visible from Device Manager and the NVIDIA driver is installed.'
    }
} else {
    $checks.Add((New-Check -Name 'gpu-detected' -Status 'skipped' -Detail 'GPU CIM query could not be read in this environment.' -Evidence $gpuInfo.error))
}

$nvidiaSmi = Invoke-SafeCommand -FilePath 'nvidia-smi' -Arguments @('--query-gpu=name,driver_version,memory.total', '--format=csv,noheader')
if (-not $nvidiaSmi.found) {
    $checks.Add((New-Check -Name 'nvidia-smi' -Status 'missing' -Detail 'nvidia-smi command is not available.' -Evidence $nvidiaSmi))
    Add-NextStep -List $nextSteps -Message 'Install the NVIDIA driver or make nvidia-smi available on PATH.'
} elseif ($nvidiaSmi.exitCode -eq 0) {
    $checks.Add((New-Check -Name 'nvidia-smi' -Status 'ok' -Detail 'nvidia-smi responded successfully.' -Evidence $nvidiaSmi))
} else {
    $checks.Add((New-Check -Name 'nvidia-smi' -Status 'degraded' -Detail 'nvidia-smi command exists but did not return success.' -Evidence $nvidiaSmi))
    Add-NextStep -List $nextSteps -Message 'Resolve the nvidia-smi error and rerun the preflight.'
}

$wslStatus = Invoke-SafeCommand -FilePath 'wsl' -Arguments @('--status')
if (-not $wslStatus.found) {
    $checks.Add((New-Check -Name 'wsl2' -Status 'missing' -Detail 'wsl command is not available.' -Evidence $wslStatus))
    Add-NextStep -List $nextSteps -Message 'On Windows, install WSL2 and set the default version to 2.'
} elseif ($wslStatus.exitCode -eq 0) {
    $checks.Add((New-Check -Name 'wsl2' -Status 'ok' -Detail 'wsl --status completed.' -Evidence $wslStatus))
} else {
    $checks.Add((New-Check -Name 'wsl2' -Status 'degraded' -Detail 'wsl command exists but status check failed.' -Evidence $wslStatus))
    Add-NextStep -List $nextSteps -Message 'Check WSL2 status and confirm the Docker Desktop backend is healthy.'
}

$dockerVersion = Invoke-SafeCommand -FilePath 'docker' -Arguments @('version')
if (-not $dockerVersion.found) {
    $checks.Add((New-Check -Name 'docker-cli' -Status 'missing' -Detail 'docker command is not available.' -Evidence $dockerVersion))
    Add-NextStep -List $nextSteps -Message 'Install Docker Desktop or Docker Engine.'
} elseif ($dockerVersion.exitCode -eq 0) {
    $checks.Add((New-Check -Name 'docker-cli' -Status 'ok' -Detail 'docker version completed.' -Evidence $dockerVersion))
} else {
    $checks.Add((New-Check -Name 'docker-cli' -Status 'degraded' -Detail 'docker command exists but version check failed.' -Evidence $dockerVersion))
    Add-NextStep -List $nextSteps -Message 'Check that the Docker daemon is running and the current user has access.'
}

$dockerCompose = Invoke-SafeCommand -FilePath 'docker' -Arguments @('compose', 'version')
if (-not $dockerCompose.found) {
    $checks.Add((New-Check -Name 'docker-compose-plugin' -Status 'missing' -Detail 'docker compose command is not available.' -Evidence $dockerCompose))
    Add-NextStep -List $nextSteps -Message 'Install a Docker version that includes the docker compose plugin.'
} elseif ($dockerCompose.exitCode -eq 0) {
    $checks.Add((New-Check -Name 'docker-compose-plugin' -Status 'ok' -Detail 'docker compose version completed.' -Evidence $dockerCompose))
} else {
    $checks.Add((New-Check -Name 'docker-compose-plugin' -Status 'degraded' -Detail 'docker compose command exists but version check failed.' -Evidence $dockerCompose))
}

try {
    $dockerService = Get-Service -Name 'com.docker.service' -ErrorAction Stop
    $dockerServiceStatus = 'degraded'
    if ($dockerService.Status -eq 'Running') {
        $dockerServiceStatus = 'ok'
    }
    $checks.Add((New-Check -Name 'docker-service' -Status $dockerServiceStatus -Detail 'Windows Docker service status collected.' -Evidence ([ordered]@{
        name = $dockerService.Name
        displayName = $dockerService.DisplayName
        status = $dockerService.Status.ToString()
        startType = $dockerService.StartType.ToString()
    })))
    if ($dockerService.StartType -ne 'Automatic') {
        Add-NextStep -List $nextSteps -Message 'Set com.docker.service to Automatic startup so Docker comes back after reboot.'
    }
} catch {
    $checks.Add((New-Check -Name 'docker-service' -Status 'skipped' -Detail 'com.docker.service was not found. Linux host or alternate install path may be in use.' -Evidence $_.Exception.Message))
}

if ($RunDockerGpuSmoke) {
    $dockerGpuSmoke = Invoke-SafeCommand -FilePath 'docker' -Arguments @('run', '--rm', '--gpus', 'all', 'nvidia/cuda:12.4.1-base-ubuntu22.04', 'nvidia-smi')
    if (-not $dockerGpuSmoke.found) {
        $checks.Add((New-Check -Name 'docker-gpu-smoke' -Status 'missing' -Detail 'docker command is not available, so GPU smoke could not start.' -Evidence $dockerGpuSmoke))
    } elseif ($dockerGpuSmoke.exitCode -eq 0) {
        $checks.Add((New-Check -Name 'docker-gpu-smoke' -Status 'ok' -Detail 'docker run --gpus all ... nvidia-smi completed.' -Evidence $dockerGpuSmoke))
    } else {
        $checks.Add((New-Check -Name 'docker-gpu-smoke' -Status 'degraded' -Detail 'Docker GPU smoke command returned non-zero.' -Evidence $dockerGpuSmoke))
        Add-NextStep -List $nextSteps -Message 'Recheck NVIDIA Container Toolkit or Docker Desktop GPU integration.'
    }
} else {
    $checks.Add((New-Check -Name 'docker-gpu-smoke' -Status 'skipped' -Detail 'Run with -RunDockerGpuSmoke to validate docker --gpus all.' -Evidence $null))
}

$summary = [ordered]@{
    generatedAt = (Get-Date).ToString('o')
    host = [ordered]@{
        machineName = $env:COMPUTERNAME
        userName = $env:USERNAME
    }
    checks = $checks
    recommendedNextSteps = $nextSteps
}

if ($AsJson) {
    $summary | ConvertTo-Json -Depth 8
} else {
    $summary
}

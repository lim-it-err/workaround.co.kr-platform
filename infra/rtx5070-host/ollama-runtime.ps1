param(
    [ValidateSet('status', 'health', 'start', 'stop', 'restart', 'pull-models', 'logs')]
    [string]$Action = 'status',
    [string]$ComposeFile = (Join-Path (Split-Path -Parent $PSScriptRoot) 'docker-compose.gpu.yml'),
    [string]$ServiceName = 'ollama',
    [string]$BaseUrl = 'http://localhost:11434',
    [string]$HealthPath = '/api/tags',
    [string[]]$Models = @('qwen2.5-coder:7b', 'qwen2.5:7b'),
    [int]$HealthTimeoutSeconds = 30,
    [int]$LogTail = 200,
    [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function New-CommandResult {
    param(
        [string]$Name,
        [string]$CommandLine,
        [int]$ExitCode,
        [string]$Output
    )

    return [ordered]@{
        name = $Name
        command = $CommandLine
        exitCode = $ExitCode
        ok = ($ExitCode -eq 0)
        output = $Output
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

function Test-CommandAvailability {
    param(
        [string]$FilePath
    )

    try {
        $command = Get-Command $FilePath -ErrorAction Stop
        return [ordered]@{
            found = $true
            path = $command.Source
            message = $null
        }
    } catch {
        return [ordered]@{
            found = $false
            path = $null
            message = $_.Exception.Message
        }
    }
}

function Invoke-ExternalCommand {
    param(
        [string]$FilePath,
        [string[]]$Arguments = @(),
        [string]$Name = $FilePath
    )

    $attemptedCommandLine = ((@($FilePath) + $Arguments) -join ' ').Trim()

    try {
        $command = Get-Command $FilePath -ErrorAction Stop
    } catch {
        return New-CommandResult -Name $Name -CommandLine $attemptedCommandLine -ExitCode 127 -Output $_.Exception.Message
    }

    $output = & $command.Source @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    if ($null -eq $exitCode) {
        $exitCode = 0
    }

    return New-CommandResult `
        -Name $Name `
        -CommandLine ((@($command.Source) + $Arguments) -join ' ') `
        -ExitCode $exitCode `
        -Output (($output | Out-String).Trim())
}

function Invoke-DockerCompose {
    param(
        [string]$Name,
        [string[]]$Arguments
    )

    $composeArguments = @('compose', '-f', $ComposeFile, '--profile', 'gpu') + $Arguments
    return Invoke-ExternalCommand -FilePath 'docker' -Arguments $composeArguments -Name $Name
}

function Get-HealthUrl {
    return '{0}/{1}' -f $BaseUrl.TrimEnd('/'), $HealthPath.TrimStart('/')
}

function ConvertTo-ModelNames {
    param(
        $ModelsObject
    )

    $names = New-Object System.Collections.Generic.List[string]
    foreach ($item in @($ModelsObject)) {
        if ($null -eq $item) {
            continue
        }

        if ($item.PSObject.Properties.Name -contains 'name' -and $item.name) {
            if (-not $names.Contains([string]$item.name)) {
                $names.Add([string]$item.name)
            }
            continue
        }

        if ($item.PSObject.Properties.Name -contains 'model' -and $item.model) {
            if (-not $names.Contains([string]$item.model)) {
                $names.Add([string]$item.model)
            }
        }
    }

    return $names
}

function Get-OllamaHealthReport {
    $url = Get-HealthUrl

    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec $HealthTimeoutSeconds
        $modelNames = @()
        if ($response -and $response.PSObject.Properties.Name -contains 'models') {
            $modelNames = @(ConvertTo-ModelNames -ModelsObject $response.models)
        }

        return [ordered]@{
            status = 'ok'
            workerStatus = 'ok'
            category = 'healthy'
            detail = 'Ollama health endpoint responded successfully.'
            url = $url
            modelCount = $modelNames.Count
            models = $modelNames
            evidence = $response
        }
    } catch {
        $message = $_.Exception.Message
        $status = 'unavailable'
        $category = 'connection_failed'
        $detail = 'Ollama health endpoint could not be reached.'
        $evidence = [ordered]@{
            message = $message
        }

        if ($_.Exception.Response) {
            $status = 'degraded'
            $category = 'http_error'
            $detail = 'Ollama health endpoint responded with a non-success status.'
            try {
                $statusCode = [int]$_.Exception.Response.StatusCode
            } catch {
                $statusCode = $null
            }
            $evidence.statusCode = $statusCode
        } elseif ($message -match 'timed out' -or $message -match 'Timeout') {
            $status = 'degraded'
            $category = 'timeout'
            $detail = 'Ollama health endpoint timed out.'
        }

        return [ordered]@{
            status = $status
            workerStatus = $status
            category = $category
            detail = $detail
            url = $url
            modelCount = 0
            models = @()
            evidence = $evidence
        }
    }
}

function Wait-ForHealthyOllama {
    $deadline = (Get-Date).AddSeconds($HealthTimeoutSeconds)
    $latestHealth = $null

    do {
        $latestHealth = Get-OllamaHealthReport
        if ($latestHealth.workerStatus -eq 'ok') {
            return $latestHealth
        }

        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)

    return $latestHealth
}

$commands = New-Object System.Collections.Generic.List[object]
$nextSteps = New-Object System.Collections.Generic.List[string]
$health = $null
$dockerAvailability = Test-CommandAvailability -FilePath 'docker'
$composeFileExists = Test-Path -LiteralPath $ComposeFile

if (-not $composeFileExists) {
    Add-NextStep -List $nextSteps -Message "Compose file not found: $ComposeFile"
}

if (-not $dockerAvailability.found) {
    Add-NextStep -List $nextSteps -Message 'Install Docker Desktop or Docker Engine before using the compose-based Ollama runtime.'
}

switch ($Action) {
    'status' {
        $commands.Add((Invoke-DockerCompose -Name 'docker-compose-ps' -Arguments @('ps', $ServiceName)))
        $health = Get-OllamaHealthReport
    }
    'health' {
        $health = Get-OllamaHealthReport
    }
    'start' {
        $commands.Add((Invoke-DockerCompose -Name 'docker-compose-up' -Arguments @('up', '-d', $ServiceName)))
        if ($commands[-1].ok) {
            $health = Wait-ForHealthyOllama
        } else {
            $health = Get-OllamaHealthReport
            Add-NextStep -List $nextSteps -Message 'Fix Docker or compose errors, then rerun start.'
        }
    }
    'stop' {
        $commands.Add((Invoke-DockerCompose -Name 'docker-compose-stop' -Arguments @('stop', $ServiceName)))
        $health = Get-OllamaHealthReport
        if ($commands[-1].ok) {
            Add-NextStep -List $nextSteps -Message 'Use this stop action before gaming or other GPU-heavy work.'
        }
    }
    'restart' {
        $commands.Add((Invoke-DockerCompose -Name 'docker-compose-restart' -Arguments @('restart', $ServiceName)))
        if ($commands[-1].ok) {
            $health = Wait-ForHealthyOllama
        } else {
            $health = Get-OllamaHealthReport
            Add-NextStep -List $nextSteps -Message 'Check container logs before retrying restart.'
        }
    }
    'pull-models' {
        $commands.Add((Invoke-DockerCompose -Name 'docker-compose-up' -Arguments @('up', '-d', $ServiceName)))
        if ($commands[-1].ok) {
            $health = Wait-ForHealthyOllama
            foreach ($model in $Models) {
                $commands.Add((Invoke-DockerCompose -Name "ollama-pull-$model" -Arguments @('exec', '-T', $ServiceName, 'ollama', 'pull', $model)))
            }
            $health = Get-OllamaHealthReport
        } else {
            $health = Get-OllamaHealthReport
            Add-NextStep -List $nextSteps -Message 'Bring the Ollama container up successfully before pulling models.'
        }
    }
    'logs' {
        $commands.Add((Invoke-DockerCompose -Name 'docker-compose-logs' -Arguments @('logs', '--tail', $LogTail, $ServiceName)))
        $health = Get-OllamaHealthReport
    }
}

foreach ($commandResult in $commands) {
    if ($commandResult.exitCode -eq 127) {
        Add-NextStep -List $nextSteps -Message 'Install Docker Desktop or Docker Engine before using the compose-based Ollama runtime.'
    }
}

if ($health.workerStatus -ne 'ok') {
    if ($health.category -eq 'connection_failed') {
        Add-NextStep -List $nextSteps -Message 'Confirm Docker is installed and the Ollama container is running.'
    } elseif ($health.category -eq 'timeout') {
        Add-NextStep -List $nextSteps -Message 'Wait for the model runtime to warm up or reduce concurrent GPU load.'
    } elseif ($health.category -eq 'http_error') {
        Add-NextStep -List $nextSteps -Message 'Inspect the Ollama container logs for a startup or model-loading error.'
    }
}

if ($Action -eq 'pull-models' -and $Models.Count -gt 0) {
    Add-NextStep -List $nextSteps -Message 'After model pull finishes, point containerized workers to OLLAMA_BASE_URL=http://host.docker.internal:11434 on the same machine.'
}

$report = [ordered]@{
    generatedAt = (Get-Date).ToString('o')
    action = $Action
    composeFile = $ComposeFile
    composeFileExists = $composeFileExists
    serviceName = $ServiceName
    baseUrl = $BaseUrl
    healthPath = $HealthPath
    requestedModels = $Models
    runtimePrerequisites = [ordered]@{
        dockerAvailable = $dockerAvailability.found
        dockerPath = $dockerAvailability.path
        dockerMessage = $dockerAvailability.message
    }
    commands = $commands
    health = $health
    nextSteps = $nextSteps
}

if ($AsJson) {
    $report | ConvertTo-Json -Depth 8
} else {
    $report
}

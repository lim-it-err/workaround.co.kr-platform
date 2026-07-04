param(
  [string]$BaseRef = 'origin/main',
  [string]$CompareBranch = 'codex/tkt-011-tkt-020-elevator-preview',
  [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function Resolve-GitExecutable {
  $candidates = @()

  $gitCommand = Get-Command git -ErrorAction SilentlyContinue
  if ($gitCommand) {
    $candidates += $gitCommand.Source
  }

  $candidates += @(
    'C:\Program Files\Git\cmd\git.exe',
    'C:\Program Files\Git\bin\git.exe'
  )

  foreach ($candidate in ($candidates | Where-Object { $_ } | Select-Object -Unique)) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw 'git executable not found.'
}

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [switch]$AllowFailure
  )

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'

  try {
    $output = & $script:GitExecutable @Arguments 2>&1
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if (-not $AllowFailure -and $exitCode -ne 0) {
    throw ("git {0} failed.`n{1}" -f ($Arguments -join ' '), ($output -join [Environment]::NewLine))
  }

  return [pscustomobject]@{
    ExitCode = $exitCode
    Output = @($output)
    Success = ($exitCode -eq 0)
  }
}

function Get-PathBucket {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if ($Path -match '(^|/)(__pycache__|dist|node_modules)(/|$)' -or $Path -match '^tmp/' -or $Path -match '\.(pyc|png|gif)$') {
    return 'generated_noise'
  }

  if ($Path -eq 'README.md' -or $Path -eq 'AGENTS.md' -or $Path -match '(^docs/|^design/|\.md$)') {
    return 'docs_tickets'
  }

  return 'code_config'
}

function Test-PathInRef {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Ref,
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $result = Invoke-Git -Arguments @('cat-file', '-e', "$Ref`:$Path") -AllowFailure
  return $result.Success
}

$script:GitExecutable = Resolve-GitExecutable

$statusResult = Invoke-Git -Arguments @('status', '--porcelain=v1', '--branch', '-uall')
$statusLines = @($statusResult.Output | Where-Object { $_ -ne '' })
$branchHeader = $statusLines[0]
$statusEntries = @($statusLines | Select-Object -Skip 1)

$branchInfo = [ordered]@{
  current = $null
  upstream = $null
  ahead = 0
  behind = 0
}

if ($branchHeader -match '^## (?<current>[^\.\s]+)(?:\.\.\.(?<upstream>[^\s]+))?(?: \[(?<details>[^\]]+)\])?$') {
  $branchInfo.current = $matches.current
  $branchInfo.upstream = $matches.upstream

  if ($matches.details) {
    foreach ($part in ($matches.details -split ',\s*')) {
      if ($part -match '^ahead (?<count>\d+)$') {
        $branchInfo.ahead = [int]$matches.count
      }
      elseif ($part -match '^behind (?<count>\d+)$') {
        $branchInfo.behind = [int]$matches.count
      }
    }
  }
}

$entries = New-Object System.Collections.Generic.List[object]

foreach ($line in $statusEntries) {
  if ($line.Length -lt 4) {
    continue
  }

  $xy = $line.Substring(0, 2)
  $pathPart = $line.Substring(3)

  $oldPath = $null
  $path = $pathPart
  if ($pathPart -match '^(?<from>.+) -> (?<to>.+)$') {
    $oldPath = $matches.from
    $path = $matches.to
  }

  $bucket = Get-PathBucket -Path $path
  $isUntracked = ($xy -eq '??')
  $presentInBaseRef = if ($isUntracked) { Test-PathInRef -Ref $BaseRef -Path $path } else { $false }

  $entries.Add([pscustomobject]@{
    status = $xy
    path = $path
    oldPath = $oldPath
    bucket = $bucket
    untracked = $isUntracked
    presentInBaseRef = $presentInBaseRef
  })
}

$bucketSummary = @{}
foreach ($bucketName in @('docs_tickets', 'code_config', 'generated_noise')) {
  $bucketEntries = @($entries | Where-Object { $_.bucket -eq $bucketName })
  $bucketSummary[$bucketName] = [pscustomobject]@{
    count = $bucketEntries.Count
    sample = @($bucketEntries | Select-Object -First 10 -ExpandProperty path)
  }
}

$remoteGapEntries = @($entries | Where-Object { $_.untracked -and $_.presentInBaseRef })
$untrackedNewEntries = @($entries | Where-Object { $_.untracked -and -not $_.presentInBaseRef })
$deletedEntries = @($entries | Where-Object { $_.status.Trim() -match 'D' })
$modifiedEntries = @($entries | Where-Object { $_.status.Trim() -match 'M|A|R' })

$compareCounts = Invoke-Git -Arguments @('rev-list', '--left-right', '--count', "$($branchInfo.current)...$CompareBranch") -AllowFailure
$compareInfo = [ordered]@{
  branch = $CompareBranch
  reachable = $compareCounts.Success
  ahead = $null
  behind = $null
}

if ($compareCounts.Success -and $compareCounts.Output.Count -gt 0) {
  $parts = ($compareCounts.Output[0] -split '\s+')
  if ($parts.Count -ge 2) {
    $compareInfo.ahead = [int]$parts[0]
    $compareInfo.behind = [int]$parts[1]
  }
}

$recommendations = @(
  'Do not reset or rebase the dirty worktree directly. Create a preservation branch or worktree snapshot first.',
  'Treat files that are untracked locally but already exist on origin/main as a remote baseline gap, not as junk.',
  'tmp/, __pycache__/, .pyc, and captured GIF/PNG files are cleanup candidates, but do not delete them before a snapshot exists.',
  'Rebuild follow-up PR work from a clean worktree based on origin/main or codex/tkt-011-tkt-020-elevator-preview instead of the current local main.'
)

$result = [ordered]@{
  gitExecutable = $script:GitExecutable
  baseRef = $BaseRef
  branch = $branchInfo
  compareBranch = $compareInfo
  totals = [ordered]@{
    trackedChanges = $modifiedEntries.Count
    deletedTracked = $deletedEntries.Count
    untrackedRemoteGap = $remoteGapEntries.Count
    untrackedNew = $untrackedNewEntries.Count
    totalEntries = $entries.Count
  }
  buckets = $bucketSummary
  remoteGapSample = @($remoteGapEntries | Select-Object -First 20 -ExpandProperty path)
  untrackedNewSample = @($untrackedNewEntries | Select-Object -First 20 -ExpandProperty path)
  deletedTrackedSample = @($deletedEntries | Select-Object -First 20 -ExpandProperty path)
  modifiedTrackedSample = @($modifiedEntries | Select-Object -First 20 -ExpandProperty path)
  recommendations = $recommendations
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 6
  exit 0
}

Write-Host "Git executable: $($result.gitExecutable)"
Write-Host "Base ref: $BaseRef"
Write-Host "Current branch: $($branchInfo.current)"
Write-Host "Upstream: $($branchInfo.upstream)"
Write-Host "Ahead/Behind: ahead $($branchInfo.ahead), behind $($branchInfo.behind)"
Write-Host "Compare branch: $CompareBranch"
if ($compareInfo.reachable) {
  Write-Host "Main vs compare branch: ahead $($compareInfo.ahead), behind $($compareInfo.behind)"
}
Write-Host ""
Write-Host "[Totals]"
Write-Host "- tracked changes: $($result.totals.trackedChanges)"
Write-Host "- deleted tracked: $($result.totals.deletedTracked)"
Write-Host "- untracked remote gap: $($result.totals.untrackedRemoteGap)"
Write-Host "- untracked new: $($result.totals.untrackedNew)"
Write-Host "- total entries: $($result.totals.totalEntries)"
Write-Host ""
Write-Host "[Buckets]"
foreach ($bucketName in @('docs_tickets', 'code_config', 'generated_noise')) {
  $bucket = $result.buckets[$bucketName]
  Write-Host "- ${bucketName}: $($bucket.count)"
  foreach ($samplePath in $bucket.sample) {
    Write-Host "  - $samplePath"
  }
}
Write-Host ""
Write-Host "[Recommendations]"
$result.recommendations | ForEach-Object { Write-Host "- $_" }

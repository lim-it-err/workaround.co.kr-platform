param(
  [string]$Title = $env:PR_TITLE,
  [string]$Body = $env:PR_BODY
)

$ErrorActionPreference = 'Stop'

$allowedVersionPattern = 'v\d+\.\d+\.\d+|infra|chore'
$errors = New-Object System.Collections.Generic.List[string]

function Add-Error {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  $script:errors.Add($Message)
}

if ([string]::IsNullOrWhiteSpace($Title)) {
  Add-Error "PR title is required."
}

if ([string]::IsNullOrWhiteSpace($Body)) {
  Add-Error "PR body is required."
}

$titleVersion = $null
$bodyVersion = $null
$themeValue = $null

if (-not [string]::IsNullOrWhiteSpace($Title)) {
  $titleMatch = [regex]::Match($Title, "^\[(?<version>$allowedVersionPattern)\]\s+")
  if (-not $titleMatch.Success) {
    Add-Error "PR title must start with [v0.x.y], [infra], or [chore]."
  }
  else {
    $titleVersion = $titleMatch.Groups['version'].Value
  }
}

if (-not [string]::IsNullOrWhiteSpace($Body)) {
  $bodyVersionPattern = '(?im)^Target Version\s*:\s*`?(?<version>' + $allowedVersionPattern + ')`?\s*$'
  $themePattern = '(?im)^Feature Theme\s*:\s*`?(?<theme>.+?)`?\s*$'

  $bodyVersionMatch = [regex]::Match($Body, $bodyVersionPattern)
  if (-not $bodyVersionMatch.Success) {
    Add-Error "PR body must include a 'Target Version: ...' line from the template."
  }
  else {
    $bodyVersion = $bodyVersionMatch.Groups['version'].Value
  }

  $themeMatch = [regex]::Match($Body, $themePattern)
  if (-not $themeMatch.Success) {
    Add-Error "PR body must include a 'Feature Theme: ...' line from the template."
  }
  else {
    $themeValue = $themeMatch.Groups['theme'].Value.Trim()
    if ([string]::IsNullOrWhiteSpace($themeValue) -or $themeValue -in @('TBD', 'todo', 'Work Manager')) {
      Add-Error "Feature Theme must be filled with the actual feature theme, not a placeholder."
    }
  }

  $requiredChecks = @(
    'single target version or track only',
    'no unrelated feature mixed in'
  )

  foreach ($requiredCheck in $requiredChecks) {
    if ($Body -notmatch "(?im)^- \[[xX]\] $requiredCheck\s*$") {
      Add-Error "Required checklist item is not checked: $requiredCheck"
    }
  }
}

if ($titleVersion -and $bodyVersion -and $titleVersion -ne $bodyVersion) {
  Add-Error "Title version '$titleVersion' does not match body version '$bodyVersion'."
}

if ($errors.Count -gt 0) {
  Write-Host "PR version metadata validation failed." -ForegroundColor Red
  foreach ($errorMessage in $errors) {
    Write-Host "- $errorMessage" -ForegroundColor Red
  }
  exit 1
}

Write-Host "PR version metadata validation passed." -ForegroundColor Green
Write-Host "- title version: $titleVersion"
Write-Host "- body version: $bodyVersion"
Write-Host "- feature theme: $themeValue"

param(
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$utf8Strict = [System.Text.UTF8Encoding]::new($false, $true)
$bom = [byte[]](0xEF, 0xBB, 0xBF)

$targets = @(
  (Join-Path $workspaceRoot 'README.md'),
  (Join-Path $workspaceRoot 'AGENTS.md')
)

$scanRoots = @(
  (Join-Path $workspaceRoot 'docs'),
  (Join-Path $workspaceRoot 'design')
) | Where-Object { Test-Path $_ }

foreach ($root in $scanRoots) {
  $targets += Get-ChildItem -Path $root -Recurse -File -Filter *.md | ForEach-Object { $_.FullName }
}

$targets = $targets | Sort-Object -Unique
$failures = New-Object System.Collections.Generic.List[string]
$checked = 0

foreach ($path in $targets) {
  if (-not (Test-Path $path)) {
    continue
  }

  $checked += 1
  $relative = Resolve-Path -Relative $path
  $bytes = [System.IO.File]::ReadAllBytes($path)

  if ($bytes.Length -lt 3 -or $bytes[0] -ne $bom[0] -or $bytes[1] -ne $bom[1] -or $bytes[2] -ne $bom[2]) {
    $failures.Add("[FAIL] missing UTF-8 BOM :: $relative")
    continue
  }

  try {
    [void]$utf8Strict.GetString($bytes, 3, $bytes.Length - 3)
  } catch {
    $failures.Add("[FAIL] invalid UTF-8 byte sequence :: $relative")
    continue
  }

  if (-not $Quiet) {
    Write-Host "[OK] $relative"
  }
}

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Encoding check failed: $($failures.Count) file(s)"
  $failures | ForEach-Object { Write-Host $_ }
  Write-Host ""
  Write-Host "Expected:"
  Write-Host "- docs/, design/, README.md, AGENTS.md must be UTF-8 with BOM."
  Write-Host "- Always specify UTF-8 explicitly when rewriting documents."
  exit 1
}

Write-Host "Encoding check passed: $($checked) file(s)"

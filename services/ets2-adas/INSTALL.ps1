param(
 [string]$GamePath = 'C:\Program Files (x86)\Steam\steamapps\common\Euro Truck Simulator 2',
 [string]$ProfileConfig = 'C:\Program Files (x86)\Steam\userdata\<STEAM_USER_ID>\227300\remote\profiles\<PROFILE_HEX>\config.cfg'
)
$ErrorActionPreference = 'Stop'
if (Get-Process -Name eurotrucks2 -ErrorAction SilentlyContinue) { throw 'Close ETS2 before installing.' }
$pluginDir = Join-Path $GamePath 'bin\win_x64\plugins'
$pluginPath = Join-Path $pluginDir 'ets2_adas_poc.dll'
$config = [IO.File]::ReadAllText($ProfileConfig)
foreach ($key in @('g_lane_assistant','g_acc')) {
 if ([regex]::Matches($config,'(?m)^uset ' + $key + ' "[^"]*"').Count -ne 1) { throw "Unexpected config: $key" }
}
$backupDir = Join-Path $PSScriptRoot ('backups\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Copy-Item -LiteralPath $ProfileConfig -Destination (Join-Path $backupDir 'config.cfg')
if (Test-Path -LiteralPath $pluginPath) { Copy-Item -LiteralPath $pluginPath -Destination (Join-Path $backupDir 'ets2_adas_poc.dll') }
$manifest = @{ProfileConfig=$ProfileConfig;PluginPath=$pluginPath;PreviousDll=(Test-Path -LiteralPath $pluginPath);OriginalConfigHash=(Get-FileHash -LiteralPath $ProfileConfig).Hash}
$manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $backupDir 'restore-info.json') -Encoding utf8
New-Item -ItemType Directory -Path $pluginDir -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'bin\ets2_adas_poc.dll') -Destination $pluginPath -Force
$modified = [regex]::Replace($config,'(?m)^uset g_lane_assistant "[^"]*"','uset g_lane_assistant "2"')
$modified = [regex]::Replace($modified,'(?m)^uset g_acc "[^"]*"','uset g_acc "40.0"')
[IO.File]::WriteAllText($ProfileConfig,$modified,[Text.UTF8Encoding]::new($false))
if ((Get-FileHash -LiteralPath $pluginPath).Hash -ne (Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'bin\ets2_adas_poc.dll')).Hash) { throw 'DLL verification failed' }
Write-Output "Installed plugin. Native lane assistance mode 2, ACC reference distance 40 m. Backup: $backupDir"

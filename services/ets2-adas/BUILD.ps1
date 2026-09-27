param([Parameter(Mandatory=$true)][string]$Zig)
$ErrorActionPreference = 'Stop'
$buildDir = Join-Path $PSScriptRoot '.build'
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
$env:ZIG_GLOBAL_CACHE_DIR = Join-Path $buildDir 'cache'
$env:TEMP = $buildDir
$env:TMP = $buildDir
& $Zig c++ -target x86_64-windows-gnu -shared -O2 -fno-exceptions -fno-rtti -nostdlib++ -Wno-dll-attribute-on-redeclaration -Wno-macro-redefined -I (Join-Path $PSScriptRoot 'native\sdk') (Join-Path $PSScriptRoot 'native\plugin.cpp') -o (Join-Path $PSScriptRoot 'bin\ets2_adas_poc.dll') -luser32
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }

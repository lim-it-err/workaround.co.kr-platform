param([string]$Zig)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
 & node --test 'tests\controller.test.cjs' 'tests\monitor.test.cjs'
 if ($LASTEXITCODE -ne 0) { throw 'Controller tests failed' }
 if ($Zig) {
  if (Get-Process -Name eurotrucks2 -ErrorAction SilentlyContinue) { throw 'Close ETS2 before native smoke tests.' }
  $testBuild = Join-Path $PSScriptRoot '.build'
  New-Item -ItemType Directory -Path $testBuild -Force | Out-Null
  $env:ZIG_GLOBAL_CACHE_DIR = Join-Path $testBuild 'cache'
  $env:TEMP = $testBuild
  $env:TMP = $testBuild
  & $Zig c++ -target x86_64-windows-gnu -O2 -fno-exceptions -fno-rtti -nostdlib++ -I 'native\sdk' 'tests\native-smoke.cpp' -o (Join-Path $testBuild 'native-smoke.exe') -luser32
  if ($LASTEXITCODE -ne 0) { throw 'Native test compilation failed' }
  & (Join-Path $testBuild 'native-smoke.exe') (Join-Path $PSScriptRoot 'bin\ets2_adas_poc.dll')
  if ($LASTEXITCODE -ne 0) { throw 'Native tests failed' }
 }
} finally { Pop-Location }

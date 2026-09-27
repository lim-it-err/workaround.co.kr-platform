$ErrorActionPreference = 'Stop'
$nodeRuntime = 'C:\Users\<USER>\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $nodeRuntime)) { $nodeRuntime = (Get-Command node -ErrorAction Stop).Source }
$existing = $false
try { $response = Invoke-RestMethod -Uri 'http://127.0.0.1:8765/api/state' -TimeoutSec 2; $existing = $response.version -eq 2 } catch {}
if ($response -and $response.version -ne 2) { throw '이전 PoC가 실행 중입니다. 이전 서버를 종료한 뒤 다시 실행하세요.' }
if (-not $existing) {
 Start-Process -FilePath $nodeRuntime -ArgumentList @('"' + (Join-Path $PSScriptRoot 'server.js') + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'server-error.log')
}
Start-Process 'http://127.0.0.1:8765'

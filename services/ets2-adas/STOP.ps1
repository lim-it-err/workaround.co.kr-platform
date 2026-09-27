$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:8765'
try {
 $state = Invoke-RestMethod -Uri "$base/api/state" -TimeoutSec 3
 if ($state.version -ne 2) { throw '현재 실행 중인 서버가 PoC 02가 아닙니다.' }
 Invoke-RestMethod -Uri "$base/api/action" -Method Post -ContentType 'application/json' -Headers @{ Origin=$base; 'X-Poc-Token'=$state.token } -Body '{"action":"shutdown"}' | Out-Null
 Write-Host '화면 캡처·감시·연결 프로그램을 종료했습니다.'
} catch { Write-Host ('종료 상태 확인: ' + $_.Exception.Message) }

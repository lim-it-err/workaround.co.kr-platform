@echo off
setlocal
set "RUNNER_PATH=C:\project\workaround.co.kr-platform\workers\orchestrator-heartbeat\run-heartbeat.ps1"
set "LOG_PATH=C:\project\workaround.co.kr-platform\tmp\orchestrator-heartbeat.ndjson"
set "POWERSHELL_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%POWERSHELL_EXE%" set "POWERSHELL_EXE=powershell.exe"
"%POWERSHELL_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%RUNNER_PATH%" -Once -LogPath "%LOG_PATH%"
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%

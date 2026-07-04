param(
  [string]$ElevatorServiceBaseUrl = 'http://127.0.0.1:8003',
  [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function Invoke-DispatchJson {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('GET', 'POST')]
    [string]$Method,

    [Parameter(Mandatory = $true)]
    [string]$Path,

    [string]$Body = '{}'
  )

  $uri = $ElevatorServiceBaseUrl.TrimEnd('/') + $Path
  if ($Method -eq 'GET') {
    return Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 5
  }

  return Invoke-RestMethod -Uri $uri -Method Post -ContentType 'application/json' -Body $Body -TimeoutSec 5
}

$null = Invoke-DispatchJson -Method POST -Path '/api/reset'
$demand = Invoke-DispatchJson -Method POST -Path '/api/demand' -Body '{"preset":"normal","intensity":0,"autoMode":false}'
$callDown = Invoke-DispatchJson -Method POST -Path '/api/call' -Body '{"floor":12,"direction":"down"}'
$callUp = Invoke-DispatchJson -Method POST -Path '/api/call' -Body '{"floor":3,"direction":"up"}'
$null = Invoke-DispatchJson -Method POST -Path '/api/step'
$step2 = Invoke-DispatchJson -Method POST -Path '/api/step'
$state = Invoke-DispatchJson -Method GET -Path '/api/state'
$resetAfter = Invoke-DispatchJson -Method POST -Path '/api/reset'

$assignments = @($state.hallCalls | ForEach-Object {
  @{
    floor = $_.floor
    direction = $_.direction
    assignedElevatorId = $_.assignedElevatorId
  }
})

$report = [ordered]@{
  generatedAt = [DateTime]::UtcNow.ToString('o')
  elevatorServiceBaseUrl = $ElevatorServiceBaseUrl
  checks = [ordered]@{
    building = @{
      totalFloors = $state.building.totalFloors
      elevatorCount = @($state.elevators).Count
      ok = ($state.building.totalFloors -eq 23 -and @($state.elevators).Count -eq 4)
    }
    demand = @{
      autoMode = $demand.demand.autoMode
      intensity = $demand.demand.intensity
      ok = ($demand.demand.autoMode -eq $false -and $demand.demand.intensity -eq 0)
    }
    assignments = $assignments
    afterStep2 = @{
      tick = $step2.tick
      movingElevators = $step2.summary.movingElevators
      waitingPassengers = $step2.summary.waitingPassengers
      elevators = @(
        $state.elevators | ForEach-Object {
          @{
            id = $_.id
            currentFloor = $_.currentFloor
            position = $_.position
            nextTarget = $_.nextTarget
            queue = $_.queue
          }
        }
      )
    }
    resetAfter = @{
      elevators = @(
        $resetAfter.elevators | ForEach-Object {
          @{
            id = $_.id
            currentFloor = $_.currentFloor
          }
        }
      )
    }
  }
}

$report.ok = (
  $report.checks.building.ok -and
  $report.checks.demand.ok -and
  $report.checks.afterStep2.movingElevators -ge 1 -and
  $report.checks.assignments.Count -ge 2
)

if ($AsJson) {
  $report | ConvertTo-Json -Depth 8
  exit 0
}

Write-Host "Elevator dispatch baseline"
Write-Host "  service: $ElevatorServiceBaseUrl"
Write-Host ("  building: {0} floors / {1} elevators" -f $report.checks.building.totalFloors, $report.checks.building.elevatorCount)
Write-Host ("  demand  : autoMode={0}, intensity={1}" -f $report.checks.demand.autoMode, $report.checks.demand.intensity)
Write-Host ("  tick    : {0}" -f $report.checks.afterStep2.tick)
Write-Host ("  moving  : {0}" -f $report.checks.afterStep2.movingElevators)
Write-Host ""
Write-Host "Assignments"
foreach ($assignment in $report.checks.assignments) {
  Write-Host ("  {0}F {1} -> {2}" -f $assignment.floor, $assignment.direction, $assignment.assignedElevatorId)
}

Write-Host ""
Write-Host "Elevators after step 2"
foreach ($elevator in $report.checks.afterStep2.elevators) {
  $queueText = if ($elevator.queue.Count -gt 0) { ($elevator.queue -join ', ') } else { 'empty' }
  Write-Host ("  {0}: floor={1}, position={2}, next={3}, queue=[{4}]" -f $elevator.id, $elevator.currentFloor, $elevator.position, $elevator.nextTarget, $queueText)
}

if (-not $report.ok) {
  exit 1
}

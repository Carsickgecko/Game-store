$ErrorActionPreference = 'Stop'
$statePath = Join-Path (Split-Path $PSScriptRoot -Parent) 'artifacts/public-host/hosting-state.json'
if (!(Test-Path -LiteralPath $statePath)) {
  Write-Host 'No saved hosting session.'
  return
}
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
foreach ($kind in @('tunnel', 'backend')) {
  $savedId = $state.("${kind}Pid")
  $started = $state.("${kind}Started")
  $ownedProcess = Get-Process -Id $savedId -ErrorAction SilentlyContinue
  if ($ownedProcess -and $ownedProcess.StartTime.ToUniversalTime().Ticks.ToString() -eq $started) {
    Stop-Process -Id $savedId
    Write-Host "Stopped $kind."
  }
}
Remove-Item -LiteralPath $statePath
Write-Host 'Public hosting stopped. SQL Server and local development processes are unchanged.'

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtimeDir = Join-Path $projectRoot 'artifacts/public-host'
$statePath = Join-Path $runtimeDir 'hosting-state.json'
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$currentProcess = Get-Process -Id $state.backendPid -ErrorAction SilentlyContinue
if ($currentProcess -and $currentProcess.StartTime.ToUniversalTime().Ticks.ToString() -ne $state.backendStarted) {
  throw 'The saved backend PID now belongs to another process. No process was stopped.'
}
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (!$node) { $node = Join-Path $env:ProgramFiles 'nodejs/node.exe' }
$port = if ($state.port) { [int]$state.port } else { 5002 }
$variables = @{
  PORT = "$port"; HOST = '127.0.0.1'; NODE_ENV = 'production'
  APP_URL = "$($state.siteUrl)#"; FRONTEND_URL = $state.siteUrl
  CORS_ORIGINS = ([uri]$state.siteUrl).GetLeftPart([System.UriPartial]::Authority)
  COOKIE_SECURE = 'true'; COOKIE_SAME_SITE = 'none'; COOKIE_PARTITIONED = 'true'
}
$previous = @{}
foreach ($name in $variables.Keys) {
  $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
  [Environment]::SetEnvironmentVariable($name, $variables[$name], 'Process')
}
try {
  if ($currentProcess) { Stop-Process -Id $currentProcess.Id; $currentProcess.WaitForExit(5000) | Out-Null }
  $backend = Start-Process -FilePath $node -ArgumentList 'src/index.js' -WorkingDirectory (Join-Path $projectRoot 'server') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'backend.log') -RedirectStandardError (Join-Path $runtimeDir 'backend-error.log') -PassThru
  $state.backendPid = $backend.Id
  $state.backendStarted = $backend.StartTime.ToUniversalTime().Ticks.ToString()
  $state | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding utf8
  $healthy = $false
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    if ($backend.HasExited) { throw 'Backend stopped. Check artifacts/public-host/backend-error.log.' }
    try {
      if ((Invoke-RestMethod "http://127.0.0.1:$port/api/v1/health" -TimeoutSec 2).ok) { $healthy = $true; break }
    } catch { Start-Sleep -Milliseconds 500 }
  }
  if (!$healthy) { throw 'Backend did not become ready.' }
  Write-Host 'Backend restarted. The public tunnel URL is unchanged.'
} finally {
  foreach ($name in $variables.Keys) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}

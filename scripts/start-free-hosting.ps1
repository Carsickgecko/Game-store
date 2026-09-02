param(
  [string]$Repository = 'Carsickgecko/Game-store',
  [int]$Port = 5002,
  [switch]$UpdateGitHub
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtimeDir = Join-Path $projectRoot 'artifacts/public-host'
$statePath = Join-Path $runtimeDir 'hosting-state.json'
$cloudflared = Join-Path $runtimeDir 'cloudflared.exe'
$gh = Join-Path $runtimeDir 'github-cli/bin/gh.exe'
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (!$node) { $node = Join-Path $env:ProgramFiles 'nodejs/node.exe' }

foreach ($required in @($node, $cloudflared, (Join-Path $projectRoot 'server/node_modules'), (Join-Path $projectRoot 'server/.env'))) {
  if (!(Test-Path -LiteralPath $required)) { throw "Missing dependency: $required. See GITHUB_HOSTING.md." }
}
if (Test-Path -LiteralPath $statePath) {
  throw 'Run scripts/stop-free-hosting.ps1 before starting another tunnel.'
}
if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
  throw "Port $Port is already in use. Stop the previous hosting backend first."
}
if ((Get-Service MSSQLSERVER).Status -ne 'Running') {
  throw 'SQL Server is stopped. Start MSSQLSERVER in Services, then run this script again.'
}
if ($UpdateGitHub) {
  if (!(Test-Path -LiteralPath $gh)) { $gh = (Get-Command gh.exe -ErrorAction Stop).Source }
  & $gh auth status --hostname github.com
  if ($LASTEXITCODE -ne 0) { throw 'Sign in first with: gh auth login --hostname github.com --web' }
}

$owner, $repoName = $Repository.Split('/')
if (!$owner -or !$repoName) { throw 'Repository must have the format owner/name.' }
$siteUrl = "https://$($owner.ToLower()).github.io/$repoName/"
$variables = @{
  PORT = "$Port"; HOST = '127.0.0.1'; NODE_ENV = 'production'
  APP_URL = "${siteUrl}#"; FRONTEND_URL = $siteUrl
  CORS_ORIGINS = "https://$($owner.ToLower()).github.io"
  COOKIE_SECURE = 'true'; COOKIE_SAME_SITE = 'none'; COOKIE_PARTITIONED = 'true'
}
$previous = @{}
foreach ($name in $variables.Keys) {
  $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
  [Environment]::SetEnvironmentVariable($name, $variables[$name], 'Process')
}

$backend = $null
$tunnel = $null
try {
  $backend = Start-Process -FilePath $node -ArgumentList 'src/index.js' -WorkingDirectory (Join-Path $projectRoot 'server') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'backend.log') -RedirectStandardError (Join-Path $runtimeDir 'backend-error.log') -PassThru
  $healthy = $false
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    if ($backend.HasExited) { throw 'Backend stopped. Check artifacts/public-host/backend-error.log.' }
    try {
      $health = Invoke-RestMethod "http://127.0.0.1:$Port/api/v1/health" -TimeoutSec 2
      if ($health.ok) { $healthy = $true; break }
    } catch { Start-Sleep -Milliseconds 500 }
  }
  if (!$healthy) { throw 'Backend did not become ready.' }
  $null = Invoke-RestMethod "http://127.0.0.1:$Port/api/v1/games" -TimeoutSec 20

  Write-Host 'Opening public HTTPS access to the local application backend. SQL Server stays local.'
  $tunnelLog = Join-Path $runtimeDir 'tunnel-error.log'
  $tunnel = Start-Process -FilePath $cloudflared -ArgumentList 'tunnel','--url',"http://127.0.0.1:$Port",'--no-autoupdate' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'tunnel.log') -RedirectStandardError $tunnelLog -PassThru
  $apiUrl = $null
  for ($attempt = 0; $attempt -lt 90; $attempt++) {
    if ($tunnel.HasExited) { throw "Tunnel stopped. Check $tunnelLog" }
    if (Test-Path -LiteralPath $tunnelLog) {
      $logText = Get-Content -LiteralPath $tunnelLog -Raw
      if ($logText) {
        $urlMatch = [regex]::Match($logText, 'https://[a-z0-9-]+\.trycloudflare\.com')
        if ($urlMatch.Success) { $apiUrl = $urlMatch.Value; break }
      }
    }
    Start-Sleep -Seconds 1
  }
  if (!$apiUrl) { throw 'Cloudflare did not return a tunnel URL.' }
  @{
    backendPid = $backend.Id; backendStarted = $backend.StartTime.ToUniversalTime().Ticks.ToString()
    tunnelPid = $tunnel.Id; tunnelStarted = $tunnel.StartTime.ToUniversalTime().Ticks.ToString()
    apiUrl = $apiUrl; siteUrl = $siteUrl; repository = $Repository; port = $Port
  } | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding utf8
} catch {
  foreach ($ownedProcess in @($tunnel, $backend)) {
    if ($ownedProcess -and !$ownedProcess.HasExited) { Stop-Process -Id $ownedProcess.Id }
  }
  throw
} finally {
  foreach ($name in $variables.Keys) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}

Write-Host "Backend: $apiUrl"
Write-Host "Website: $siteUrl"
$stripeResult = & $node (Join-Path $projectRoot 'server/scripts/configure-stripe-webhook.mjs') --api-url $apiUrl
if ($LASTEXITCODE -eq 0) {
  $stripeState = $stripeResult | ConvertFrom-Json
  if ($stripeState.restartRequired) { & (Join-Path $PSScriptRoot 'restart-hosting-backend.ps1') }
  if ($stripeState.status -eq 'configured') { Write-Host 'Stripe sandbox webhook is ready for the current tunnel.' }
} else {
  Write-Warning 'Hosting is running, but Stripe webhook setup failed. Check the local Stripe configuration.'
}
if ($UpdateGitHub) {
  & $gh variable set VITE_API_URL --body $apiUrl --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw 'Hosting is running, but updating VITE_API_URL failed. See GITHUB_HOSTING.md.' }
  & $gh workflow run github-pages.yml --ref main --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw 'Hosting is running, but starting the Pages deployment failed. See GITHUB_HOSTING.md.' }
  Write-Host 'GitHub Pages is rebuilding. Keep this PC awake and connected to the Internet.'
} else {
  Write-Host 'Set the GitHub repository variable VITE_API_URL to the Backend URL, then run the GitHub Pages workflow.'
}

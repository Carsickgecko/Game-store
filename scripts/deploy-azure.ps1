param(
  [string]$ResourceGroup = "gamewebsite-rg",
  [string]$ApiAppName = "neonplay-api-444728",
  [string]$WebAppName = "neonplay-web-444728",
  [string]$ApiUrl = "https://neonplay-api-444728.azurewebsites.net"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$artifacts = Join-Path $root "artifacts"
$backendStage = Join-Path $artifacts "backend-staging"
$backendZip = Join-Path $artifacts "backend-webapp-deploy.zip"
$frontendZip = Join-Path $artifacts "client-webapp-deploy.zip"

New-Item -ItemType Directory -Force -Path $artifacts | Out-Null
if (Test-Path $backendStage) {
  Remove-Item -LiteralPath $backendStage -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $backendStage | Out-Null

Write-Host "Building frontend..."
Push-Location (Join-Path $root "client")
$env:VITE_API_URL = $ApiUrl
npm.cmd ci
npm.cmd run build
Pop-Location

Write-Host "Packaging frontend..."
Push-Location (Join-Path $root "client\dist")
Compress-Archive -Path * -DestinationPath $frontendZip -Force
Pop-Location

Write-Host "Preparing backend staging folder..."
Copy-Item -LiteralPath (Join-Path $root "server\src") -Destination $backendStage -Recurse
Copy-Item -LiteralPath (Join-Path $root "server\package.json") -Destination $backendStage
Copy-Item -LiteralPath (Join-Path $root "server\package-lock.json") -Destination $backendStage
Copy-Item -LiteralPath (Join-Path $root "server\web.config") -Destination $backendStage
Copy-Item -LiteralPath (Join-Path $root "server\bootstrap.cjs") -Destination $backendStage

Write-Host "Installing backend production dependencies in staging..."
Push-Location $backendStage
npm.cmd ci --omit=dev
Pop-Location

Write-Host "Packaging backend..."
Push-Location $backendStage
Compress-Archive -Path * -DestinationPath $backendZip -Force
Pop-Location

Write-Host "Deploying backend to Azure..."
az webapp deploy `
  --resource-group $ResourceGroup `
  --name $ApiAppName `
  --src-path $backendZip `
  --type zip `
  --clean true

Write-Host "Deploying frontend to Azure..."
az webapp deploy `
  --resource-group $ResourceGroup `
  --name $WebAppName `
  --src-path $frontendZip `
  --type zip `
  --clean true

Write-Host "Done."
Write-Host "Frontend: https://$WebAppName.azurewebsites.net"
Write-Host "Backend:  https://$ApiAppName.azurewebsites.net"

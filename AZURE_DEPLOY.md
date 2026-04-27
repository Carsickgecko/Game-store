# Azure Deployment Guide

This project is now deployed on Azure with:

1. `Frontend`: Azure App Service (Windows static site)
2. `Backend`: Azure App Service (Windows, Node.js 20)
3. `Database`: Azure SQL Database

That split works well for a React + Vite frontend and an Express API. The frontend uses an IIS rewrite rule so React Router routes such as `/catalog`, `/cart`, and `/account` work after direct refresh.

Current deployed URLs:

- Frontend: https://neonplay-web-444728.azurewebsites.net
- Backend API: https://neonplay-api-444728.azurewebsites.net
- API docs: https://neonplay-api-444728.azurewebsites.net/api/v1/docs
- OpenAPI JSON: https://neonplay-api-444728.azurewebsites.net/api/v1/openapi.json

## 1. Frontend on Azure App Service

Build the `client` app locally and deploy the generated `dist` folder as a ZIP package to the frontend Web App.

Build command:

```env
VITE_API_URL=https://YOUR_BACKEND_APP.azurewebsites.net
```

Important file for React Router fallback:

- [web.config](F:/Game-website/client/public/web.config)

Deploy command example:

```powershell
Compress-Archive -Path .\client\dist\* -DestinationPath .\artifacts\client-webapp-deploy.zip -Force
az webapp deploy --resource-group gamewebsite-rg --name YOUR_FRONTEND_APP --src-path .\artifacts\client-webapp-deploy.zip --type zip --clean true
```

## 2. Backend on Azure App Service

Create a Windows App Service using Node.js 20 and deploy the `server` folder.

Important files for Azure Windows App Service:

- [web.config](F:/Game-website/server/web.config)
- [bootstrap.cjs](F:/Game-website/server/bootstrap.cjs)

Recommended app settings:

```env
DB_SERVER=YOUR_SQL_SERVER
DB_PORT=1433
DB_NAME=GameStoreDB
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
JWT_SECRET=YOUR_SECRET
RAWG_API_KEY=YOUR_RAWG_KEY
PUBLIC_API_RATE_LIMIT_PER_HOUR=200
PUBLIC_API_BASE_URL=https://YOUR_BACKEND_APP.azurewebsites.net
APP_URL=https://YOUR_BACKEND_APP.azurewebsites.net
FRONTEND_URL=https://YOUR_FRONTEND_APP.azurewebsites.net
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
COOKIE_DOMAIN=
STRIPE_SECRET_KEY=YOUR_STRIPE_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
STRIPE_CURRENCY=usd
```

Important:

- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=none`

These are required when the frontend and backend run on different Azure domains.

## 3. CORS and Login

The backend already supports:

- `localhost`
- `*.azurestaticapps.net`
- `*.azurewebsites.net`
- `*.web.core.windows.net`

The auth cookie logic is Azure-friendly for HTTPS cross-site deployments.

## 4. Public API after deployment

After deploy, these should be reachable online:

- `/api/v1/health`
- `/api/v1/docs`
- `/api/v1/openapi.json`
- `/api/v1/public/games`
- `/api/v1/developers/register`

## 5. Suggested verification checklist

1. Open the frontend URL and confirm the home page loads.
2. Refresh a deep route like `/catalog` or `/wishlist` and confirm it does not 404.
3. Register or log in and confirm the session survives page refresh.
4. Open `https://YOUR_BACKEND_APP.azurewebsites.net/api/v1/health`
5. Open `https://YOUR_BACKEND_APP.azurewebsites.net/api/v1/docs`
6. Call a public endpoint with an API key.

## 6. Automatic Deployment

The project includes a GitHub Actions workflow:

- [.github/workflows/azure-deploy.yml](F:/Game-website/.github/workflows/azure-deploy.yml)

After this workflow is pushed to GitHub, every push to `main` or `master` will:

1. Install backend dependencies.
2. Package and deploy the Express API to `neonplay-api-444728`.
3. Build the React frontend with `VITE_API_URL=https://neonplay-api-444728.azurewebsites.net`.
4. Package and deploy the frontend to `neonplay-web-444728`.

Required GitHub repository secrets:

```text
AZURE_API_PUBLISH_PROFILE
AZURE_WEB_PUBLISH_PROFILE
```

GitHub Actions will fail with `No credentials found` when either secret is missing or empty.

Get each publish profile from Azure Portal:

1. Open the App Service.
2. Click `Get publish profile`.
3. Open the downloaded `.PublishSettings` file in VS Code.
4. Copy the full XML content into the matching GitHub secret.

Secret setup page:

```text
https://github.com/Carsickgecko/Game-store/settings/secrets/actions
```

Use these exact mappings:

```text
neonplay-api-444728  -> AZURE_API_PUBLISH_PROFILE
neonplay-web-444728  -> AZURE_WEB_PUBLISH_PROFILE
```

Manual one-command deployment is also available:

```powershell
.\scripts\deploy-azure.ps1
```

## 7. Notes

- If you deploy the backend from a Windows machine, prefer `bcryptjs` over native `bcrypt` to avoid cross-environment binary issues.
- Azure SQL requires encrypted connections, so `DB_ENCRYPT=true` is required in production.

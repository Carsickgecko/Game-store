# Deployment Guide

This repository is now prepared for cloud deployment with:

- a public Express API in [server](F:/Game-website/server)
- a React + Vite frontend in [client](F:/Game-website/client)
- Dockerfiles for both services
- a public developer registration flow and API docs

## 1. What still needs a real cloud account

The codebase is deployment-ready, but a real online deployment still needs:

- a cloud hosting account such as Azure, AWS, Render, Railway, or similar
- a SQL Server database accessible from the cloud
- environment variables for the database and JWT secret

Those steps cannot be completed from this workspace because they require your own cloud credentials and infrastructure.

## 2. Recommended architecture

For a student project, this is the simplest clean setup:

1. Deploy the backend Express API as a web service or container.
2. Deploy the React frontend as a static site or container.
3. Point the frontend to the backend by setting `VITE_API_URL`.
4. Use your SQL Server instance for persistent storage.

## 3. Required backend environment variables

Create a `.env` file for the backend with values like:

```env
PORT=5001
DB_SERVER=your-sql-server-host
DB_PORT=1433
DB_NAME=GameStoreDB
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=change-this-secret
RAWG_API_KEY=your-rawg-key
PUBLIC_API_RATE_LIMIT_PER_HOUR=200
PUBLIC_API_BASE_URL=https://your-api-domain.example.com
APP_URL=https://your-frontend-domain.example.com
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CURRENCY=usd
```

## 4. Required frontend environment variables

Create a `.env` file for the frontend with:

```env
VITE_API_URL=https://your-api-domain.example.com
```

## 5. Docker build commands

### Backend

```bash
cd server
docker build -t neonplay-api .
docker run --env-file .env -p 5001:5001 neonplay-api
```

### Frontend

```bash
cd client
docker build -t neonplay-client .
docker run -p 8080:80 neonplay-client
```

Then open:

- frontend: `http://localhost:8080`
- backend health: `http://localhost:5001/api/v1/health`
- public docs: `http://localhost:5001/api/v1/docs`

## 6. Public developer API

The project now exposes:

- `POST /api/v1/developers/register`
- `GET /api/v1/public/games`
- `GET /api/v1/public/games/:id`
- `GET /api/v1/public/games/:id/similar`
- `GET /api/v1/public/health`
- `GET /api/v1/docs`
- `GET /api/v1/openapi.json`

Authentication for external developers uses:

- `x-api-key: YOUR_API_KEY`

## 6. Real payments

The checkout flow can now use Stripe Checkout for real payments.

Required backend variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_URL`
- `STRIPE_CURRENCY`

Payment flow:

1. User fills checkout contact details
2. Backend creates a pending order
3. Backend creates a Stripe Checkout Session
4. Frontend redirects the user to Stripe
5. Stripe sends a webhook to `/api/v1/payments/stripe/webhook`
6. The backend completes the order even if the user never returns to the site
7. The frontend `thank-you` page still confirms the session as a user-facing fallback

Local webhook testing with the Stripe CLI:

```bash
stripe listen --forward-to http://localhost:5001/api/v1/payments/stripe/webhook
```

Use the `whsec_...` value printed by Stripe CLI as `STRIPE_WEBHOOK_SECRET`.

## 7. Suggested cloud options

### Option A: Azure

- Azure App Service or Azure Container Apps for the backend
- Azure Static Web Apps or Azure App Service for the frontend
- Azure SQL Database or your SQL Server instance

### Option B: Render / Railway

- one web service for the backend
- one static site or web service for the frontend
- external SQL Server database

## 8. Demo checklist

Before presenting:

1. Confirm `/api/v1/health` returns `{ "ok": true }`
2. Confirm `/api/v1/docs` is publicly reachable
3. Register a developer key from `/developers`
4. Call `/api/v1/public/games` with `x-api-key`
5. Show the OpenAPI JSON at `/api/v1/openapi.json`

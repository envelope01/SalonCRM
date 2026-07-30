# Environment Setup

This project uses environment-specific files so local development and production deployments do not require code changes.

## Backend

Local development values live in `backend/.env.development`.

Required keys:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://postgres:root@localhost:5432/salon_db
CLIENT_URL=http://localhost:3000,http://localhost:5173
JWT_SECRET=development-only-change-me
```

Production values should be configured in the cloud provider dashboard. Keep `backend/.env.production` as a local template only.

Required Render Backend Service environment variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgres://...
CLIENT_URL=https://your-frontend-service.onrender.com
JWT_SECRET=use-a-long-random-production-secret
```

Use Render PostgreSQL's **Internal Database URL** for `DATABASE_URL` when the backend service and database are both on Render. Render also injects its own `PORT`; either leave Render's value alone or set `PORT=5000` only if your service is configured that way.

## Frontend

This app uses Create React App, so frontend environment variables must start with `REACT_APP_`.

Local development values live in `frontend/.env.development`.

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

For production, set this in the hosting provider before building:

```env
REACT_APP_API_BASE_URL=https://your-backend-service.onrender.com/api
```

Set this in the Render Frontend/Static Site environment before running the production build. Local `npm start` reads `frontend/.env.development`, which points to `http://localhost:5000/api`.

## Commands

Backend development:

```powershell
cd backend
npm run dev
```

Frontend development:

```powershell
cd frontend
npm start
```

Generate and apply local Drizzle migrations:

```powershell
cd backend
npm run db:generate
npm run db:migrate
```

Apply production Drizzle migrations:

```powershell
cd backend
npm run db:migrate:prod
```

## Render Deployment

Backend Service:

```text
Root Directory: backend
Build Command: npm install && npm run render:build
Start Command: npm run render:start
```

Do not set the Start Command to plain `npm run`; that only prints the available scripts and exits before the Express server starts.

`render:build` runs `drizzle-kit migrate` against the Render PostgreSQL database using `NODE_ENV=production`. Use `db:push:prod` only for controlled schema syncs when you intentionally want Drizzle Kit to push schema changes directly.

Frontend Service:

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: build
```

Set `REACT_APP_API_BASE_URL` to the Render backend API URL, for example `https://your-backend-service.onrender.com/api`.

## Local Verification Checklist

1. Start PostgreSQL locally and confirm the `salon_db` database exists in pgAdmin.
2. Start the backend with `npm run dev`; the terminal should print `Environment: development`.
3. Start the frontend with `npm start`.
4. Open the browser Network tab and perform an app action such as loading clients or logging in.
5. Confirm API requests go to `http://localhost:5000/api/...`.
6. Confirm there are no requests to hosted backend URLs.
7. In pgAdmin, open `salon_db` and inspect tables such as `clients`, `services`, `visits`, and `expenses`.
8. Insert or update data from the app, then refresh the matching table in pgAdmin to confirm the local PostgreSQL database changed.

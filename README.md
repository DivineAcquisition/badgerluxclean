# BadgerLuxClean Data Command Center

Real-time cleaning business analytics dashboard built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (custom brand theme)
- **Supabase** (Postgres, Auth, Real-time)
- **Recharts** (charts and visualizations)

## Features

- **5 Dashboard Tabs**: Overview, Sales & Leads, Retention, VA Performance, Financial
- **Real-time Updates**: Supabase postgres_changes subscription auto-refreshes all data
- **Google Sheets Sync**: Automated sync from Google Sheets via Apps Script proxy
- **Auth**: Supabase email/password authentication
- **Responsive**: Mobile-friendly layout
- **Month Filtering**: Filter all metrics by month

## Setup

### 1. Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and paste the contents of `supabase/schema.sql`
3. Run it to create tables, materialized views, indexes, RLS policies, and the refresh function
4. Enable Realtime on the `bookings` table (Database > Replication)
5. Create a user in Authentication > Users for dashboard access

### 2. Google Apps Script

Deploy an Apps Script web app inside your Google Sheet that serves data as JSON:

- `GET ?action=readAll&secret=...` returns all tabs
- `GET ?action=read&tab=TabName&secret=...` returns one tab
- `GET ?action=ping&secret=...` health check

### 3. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SHEET_API_URL=https://script.google.com/macros/s/your-deployment-id/exec
SHEET_API_SECRET=blx-sync-2026
SYNC_SECRET=badgerlux-sync-2026
```

### 4. Run Locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy — the `vercel.json` configures a cron job to sync every 5 minutes

## How Syncing Works

1. **Cron/Manual**: `POST /api/sync` is called every 5 min (Vercel cron) or manually via the Sync button
2. **Apps Script Proxy**: The API route fetches all Google Sheets tabs via the deployed Apps Script
3. **Upsert**: Data is upserted into Supabase tables (bookings on booking_id, customers on email, etc.)
4. **Leads**: Full replace — all existing leads are deleted and re-inserted
5. **Materialized Views**: After sync, `refresh_dashboard_views()` refreshes all 6 materialized views
6. **Real-time**: Supabase emits postgres_changes events, and the dashboard re-fetches automatically

## Adding New Users

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" and enter email + password
3. The user can now sign in at the dashboard login page

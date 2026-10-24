# HCM Lite - Frontend (merged Part A + Part B)

Next.js 14 (App Router), plain JavaScript, Tailwind CSS, recharts. Talks to the backend described in `CONTRACT.md` (no mock layer).

## Run
1. `npm install`
2. `.env.local` already contains `NEXT_PUBLIC_API_URL=http://localhost:5000` (edit it if your backend runs elsewhere; `.env.example` is the template).
3. `npm run dev` -> http://localhost:3000
4. Production check: `npm run build && npm start`

Start the backend first (`/api/health` must answer). First visit goes to `/setup` if the backend reports `initialized: false`, otherwise `/login`.

## Environment
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend origin only, e.g. `http://localhost:5000` (no trailing `/api`; the client adds `/api`). |

No secrets belong in the frontend (Supabase secret key / AI key are backend only).

## Roles and what they see
- **admin**: dashboard (company KPIs + charts), employees (read-only), attendance board, organization, users, payroll (view + finalize), payslips, audit log, announcements, AI.
- **hr**: HR dashboard, employees (register/edit/salary/status/CSV export), attendance board, corrections decisions, leave approvals, payroll (create/recalculate), payslips, announcements, AI.
- **employee**: own dashboard, check-in/out, attendance calendar, corrections, leave (apply, smart leave, cancel), own finalized payslips (PDF), profile (phone/address), notifications, AI.
Sidebar is filtered by role (`src/lib/nav.js`). Token: localStorage `hcm_token`; any 401 clears it and redirects to `/login`.

## Done
All routes in CONTRACT section 6 / `nav.js` have a page: setup, login, change-password, dashboard (3 role views), employees (list/new/360), attendance (+board, corrections), leave (+approvals), payroll (+detail), payslips, org, users, audit-log, announcements, notifications, profile, ai.

## Not done / out of scope
- Employee CSV import (out of scope per contract). File uploads UI (`/api/uploads`, optional).
- Never compiled or run against the real backend (no npm/network where it was merged). See PROGRESS.md "Known risks".
- No automated tests.

## Deploy on Vercel
1. Import the repo, set **Root Directory** to this `frontend` folder, framework Next.js (auto).
2. Add env var `NEXT_PUBLIC_API_URL` = your public backend URL (HTTPS), for Production and Preview. It is inlined at build time: redeploy after changing it.
3. On the backend set `CLIENT_ORIGIN` to the Vercel URL (CORS), or login will fail with "Cannot reach the server".
4. Geolocation button in Organization settings needs HTTPS (Vercel is HTTPS).

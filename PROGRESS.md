# PROGRESS - Frontend (merged)

## Merged
- Part A (`frontend-part-a.zip`) used as base; Part B (`frontend-part-b.zip`) copied over it.
- Part B overwrote `src/app/(app)/dashboard/page.js` (Part A placeholder) as intended.
- Duplicates dropped (Part B's version discarded, Part A kept): `PROGRESS.md` (replaced by this merged file), `CONTRACT.md` (byte-identical in both).
- `PART_B_NOTES.md` kept. Part B has no package.json; Part A's already had `recharts@^2.12.7`, so the union is unchanged. `jsconfig.json` already had `@/*` -> `./src/*`.

## Fixed
- **API prefix mismatch (blocking):** Part A called paths without `/api` (e.g. `/auth/login`), Part B with it (`/api/payroll/runs`); the client base is only `NEXT_PUBLIC_API_URL`. `src/lib/apiClient.js` now adds `/api` when missing (`withApi`), so both styles hit `/api/...` per CONTRACT.
- `.env.local` created; `.gitignore` now lists `node_modules` and `.env*.local`.

## Static checks run (TypeScript parser, JSX mode, all 48 .js/.jsx files)
- 0 syntax errors; 0 unresolved imports; 0 missing default/named exports (checked `@/lib/apiClient`, `@/lib/auth`, `@/lib/format`, `@/lib/nav`, `@/lib/helpers`, `@/components/ui/*`, `@/features/*`). The checker was verified against injected errors.
- Every file using hooks or handlers has `'use client'`.
- All 22 CONTRACT section 6 pages and every `nav.js` href have a page file; none had to be created.
- Every API call compared with CONTRACT section 5: method, path, query params and body fields match.

## Known risks
- Not compiled or run: no `npm install` / `next build` / backend available. Run `npm run build` first.
- Response-shape guesses (with fallbacks): corrections employee name (`employeeName` or `employee.name`), announcements `authorName`/`createdAt`, list endpoints as array or `{items}`.
- Part B shows rates (attendanceTrend, absenteeism) as 0-1 fractions; if the backend returns percentages > 1 they show as-is.
- Part A and Part B use separate UI primitives (`components/ui/*` vs `features/common-b/ui.jsx`), so look and feel differs slightly between pages. Left as is (no redesign).
- Employee/payslip dropdowns load only the first 100 employees.
- Geolocation needs HTTPS or localhost.
- `next.config.js` ignores ESLint during builds (eslint not installed).

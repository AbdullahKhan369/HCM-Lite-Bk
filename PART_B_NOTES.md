# Part B notes

## Extra npm packages
None beyond the contract stack. Part B uses only: `next`, `react`, `react-dom`, `tailwindcss` (already Part A) and `recharts` (named in CONTRACT section 0). Make sure `recharts` is in Part A's package.json (`"recharts": "^2.12.7"`); run `npm i recharts` if it is missing.

## How to merge
Unzip over Part A's `frontend/`. Part B only overwrites `src/app/(app)/dashboard/page.js` (the placeholder). All other files are new.

## Shared imports used (from CONTRACT section 6 only)
`@/lib/apiClient` (api.get/post/getPaged/download), `@/lib/auth` (useAuth), `@/lib/format` (fmtDate, fmtTime, fmtMoney).

## Why there is a `src/features/common-b/ui.jsx`
CONTRACT lists the `components/ui/*` file names but not their props. To avoid guessing wrong props, Part B ships its own tiny primitives (Spinner, ErrorBox, Empty, Pill, Btn, Panel, Modal, PageHeader, AiBadge, useFetch) in its own feature folder. Part A files are never imported, so nothing breaks if their props differ.

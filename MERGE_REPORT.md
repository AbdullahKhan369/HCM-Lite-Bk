# MERGE REPORT

Status: **OK** = verified unchanged against CONTRACT; **FIXED** = needed a change. All calls reach `/api/...` through `apiClient.withApi` (the one shared fix, listed per row where it matters).

| Route | Page file | API calls used | Status |
|---|---|---|---|
| `/` | `src/app/page.js` | GET `/api/setup/status` | FIXED (prefix) |
| `/setup` | `(auth)/setup/page.js` | GET `/api/setup/status`, POST `/api/setup` | FIXED (prefix) |
| `/login` | `(auth)/login/page.js` | GET `/api/setup/status`, POST `/api/auth/login`, GET `/api/auth/me` (auth.js) | FIXED (prefix) |
| `/change-password` | `(auth)/change-password/page.js` | POST `/api/auth/change-password` | FIXED (prefix) |
| app shell | `(app)/layout.js` | GET `/api/notifications` | FIXED (prefix) |
| `/dashboard` | `(app)/dashboard/page.js` (Part B overwrote A placeholder) | GET `/api/dashboard/admin\|hr\|me`, `/api/departments`, `/api/announcements`; POST `/api/ai/summary` | OK |
| `/employees` | `(app)/employees/page.js` | GET `/api/employees` (search, departmentId, designationId, status, page, limit), `/api/departments`, `/api/designations`; GET `/api/employees/export.csv` | FIXED (prefix) |
| `/employees/new` | `(app)/employees/new/page.js` | POST `/api/employees`, GET departments/designations | FIXED (prefix) |
| `/employees/[id]` | `(app)/employees/[id]/page.js` | GET `/api/employees/:id`; PUT `/:id`, PUT `/:id/salary`, PATCH `/:id/status` | FIXED (prefix) |
| `/attendance` | `(app)/attendance/page.js` | GET `/api/attendance/today`, `/calendar`, `/api/attendance`, `/api/employees`; POST `/check-in`, `/check-out` | FIXED (prefix) |
| `/attendance/board` | `(app)/attendance/board/page.js` | GET `/api/attendance/board` (date, departmentId), `/api/departments` | FIXED (prefix) |
| `/attendance/corrections` | `(app)/attendance/corrections/page.js` | GET/POST `/api/attendance/corrections`, PATCH `/:id/decision` | FIXED (prefix) |
| `/leave` | `(app)/leave/page.js` | GET `/api/leaves`, `/api/leaves/balance`, `/api/leave-types`; POST `/api/leaves`, `/api/ai/smart-leave`; PATCH `/api/leaves/:id/cancel` | FIXED (prefix) |
| `/leave/approvals` | `(app)/leave/approvals/page.js` | GET `/api/leaves`; PATCH `/api/leaves/:id/decision` | FIXED (prefix) |
| `/payroll` | `(app)/payroll/page.js` | GET/POST `/api/payroll/runs` | OK |
| `/payroll/[id]` | `(app)/payroll/[id]/page.js` | GET `/api/payroll/runs/:id`; POST `/:id/recalculate`, `/:id/finalize` | OK |
| `/payslips` | `(app)/payslips/page.js` | GET `/api/payslips`, `/api/employees`; download `/api/payslips/:id/pdf` | OK |
| `/org` | `(app)/org/page.js` | GET/PUT `/api/settings`; CRUD `/api/departments`, `/designations`, `/leave-types` (no delete), `/holidays` (no edit) | FIXED (prefix) |
| `/users` | `(app)/users/page.js` | GET/POST `/api/users`; PATCH `/:id/activate\|deactivate`; POST `/:id/reset-password` | FIXED (prefix) |
| `/audit-log` | `(app)/audit-log/page.js` | GET `/api/audit-logs` (action, entity, page, limit) | OK |
| `/announcements` | `(app)/announcements/page.js` | GET/POST `/api/announcements` | FIXED (prefix) |
| `/notifications` | `(app)/notifications/page.js` | GET `/api/notifications`; PATCH `/:id/read`; POST `/read-all` | FIXED (prefix) |
| `/profile` | `(app)/profile/page.js` | GET/PATCH `/api/employees/me` (employee role only) | FIXED (prefix) |
| `/ai` | `(app)/ai/page.js` | POST `/api/ai/chat` | OK |

## Files dropped on merge
- `PROGRESS.md` (Part B's) - replaced by merged PROGRESS.md. `CONTRACT.md` (Part B's) - identical to A's, kept A's.
- No other duplicates.

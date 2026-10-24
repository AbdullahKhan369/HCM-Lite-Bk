# CONTRACT.md — HCM Lite (single source of truth. Do NOT rename anything here.)

## 0. Stack & conventions
- Backend: Node 20, Express, Mongoose (MongoDB Atlas), plain JavaScript (CommonJS). No TypeScript, no NestJS.
- Frontend: Next.js 14 App Router, plain JavaScript (.js/.jsx), Tailwind CSS, recharts. No TypeScript.
- Base URL: `{NEXT_PUBLIC_API_URL}` = e.g. `http://localhost:5000` ; every route starts with `/api`.
- Auth: `Authorization: Bearer <JWT>`. JWT payload: `{ sub: userId, role, employeeId }`, expires 7d.
- IDs: Mongo `_id` is returned as string field `id` (toJSON transform; `_id` and `__v` removed).
- Dates: day = `"YYYY-MM-DD"` string. Timestamps = ISO UTC string. Month = `"YYYY-MM"`.
- Business timezone: env `TZ_NAME=Asia/Karachi`. Server decides "today" and times in this timezone.
- Success: `{ "success": true, "data": <any>, "meta": { "page":1,"limit":20,"total":0 } }` (meta only on paged lists)
- Error: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "human text", "details": [{ "field":"email","reason":"..." }] } }`
- Status codes: 200, 201, 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT, 422 UNPROCESSABLE (leave overlap / over-balance), 429 RATE_LIMITED, 500 SERVER_ERROR.
- Paging query: `page` (default 1), `limit` (default 20, max 100).
- Roles: `admin`, `hr`, `employee`. Employee statuses: `probation`, `active`, `inactive`.

## 1. Environment variable names (both sides must use exactly these)
Backend `.env.example`:
```
PORT=5000
MONGODB_URI=
JWT_SECRET=
TZ_NAME=Asia/Karachi
CLIENT_ORIGIN=http://localhost:3000
ADMIN_EMAIL=
ADMIN_PASSWORD=
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_BUCKET=uploads
AI_API_KEY=
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
```
Frontend `.env.example`: `NEXT_PUBLIC_API_URL=http://localhost:5000`
(Supabase secret key is backend only. Never in frontend.)

## 2. Fixed backend folder structure
```
backend/
  package.json  .env.example  .gitignore  README.md  PROGRESS.md  CONTRACT.md
  src/
    server.js            (connect db, listen)
    app.js               (express, cors, json, AUTO-MOUNT: for every folder in src/modules that has routes.js -> app.use('/api/<folderRoutePrefix>', routes). Each routes.js exports an express Router and a string `prefix` as router.prefix)
    config/ env.js db.js
    middlewares/ auth.js  (exports: authRequired, requireRole(...roles))
                 error.js (exports: notFound, errorHandler)
                 validate.js
    utils/ ApiError.js asyncHandler.js response.js (exports: ok(res,data,meta), created(res,data)) dates.js
    modules/<name>/ <name>.model.js <name>.service.js <name>.controller.js routes.js
  modules (folder names): setup, auth, users, settings, org (departments, designations, leaveTypes, holidays), employees, attendance, leave, payroll, dashboard, ai, announcements, notifications, audit, uploads
```
How auto-mount works: `routes.js` does `const router = require('express').Router(); ... router.prefix = '/employees'; module.exports = router;` and app.js mounts `app.use('/api' + router.prefix, router)`. (setup prefix `/setup`, auth `/auth`, users `/users`, settings `/settings`, org module exposes 4 routers via org/routes.js using sub-paths `/departments`, `/designations`, `/leave-types`, `/holidays` with router.prefix = '' so full paths stay as listed below.)

### Shared code every module may import (exact paths & signatures)
- `src/middlewares/auth.js` -> `authRequired` (sets `req.user = { id, role, employeeId }`), `requireRole('admin','hr')`
- `src/utils/ApiError.js` -> `new ApiError(status, code, message, details?)`
- `src/utils/asyncHandler.js` -> `asyncHandler(fn)`
- `src/utils/response.js` -> `ok(res, data, meta?)`, `created(res, data)`
- `src/utils/dates.js` -> `todayStr()`, `nowIso()`, `isWorkingDay(dateStr, settings, holidaysSet)`, `workingDaysBetween(startStr, endStr, settings, holidaysSet)`, `monthRange('YYYY-MM')` -> `{from,to}`
- `src/modules/settings/settings.service.js` -> `getSettings()` (cached singleton doc)
- `src/modules/audit/audit.service.js` -> `log({ actorId, action, entity, entityId, before, after })`
- `src/modules/notifications/notification.service.js` -> `notify(userId, { title, message, type })`
- Models (require path -> exported Mongoose model): `modules/users/user.model.js` (User), `modules/settings/settings.model.js` (Settings), `modules/org/org.models.js` ({Department, Designation, LeaveType, Holiday}), `modules/employees/employee.model.js` (Employee), `modules/attendance/attendance.model.js` ({Attendance, AttendanceCorrection}), `modules/leave/leave.model.js` (LeaveRequest), `modules/payroll/payroll.model.js` ({PayrollRun, Payslip}), `modules/announcements/announcement.model.js`, `modules/notifications/notification.model.js`, `modules/audit/audit.model.js` (AuditLog), `modules/ai/ailog.model.js` (AiLog)

## 3. Data models (field names are fixed)
- User: name, email(unique,lowercase), passwordHash, role, employeeId(ref Employee|null), isActive(bool), mustChangePassword(bool)
- Settings (single doc): initialized(bool), companyName, officeStart("09:00"), graceMinutes(15), halfDayHours(5), weekend([0,6] where 0=Sun,6=Sat), officeLat, officeLng, radiusMeters(150)
- Department: name(unique) | Designation: name, departmentId | LeaveType: code(`annual|sick|casual|unpaid`), name, yearlyQuota(number|null for unpaid) | Holiday: date, name
- Employee: code(unique), name, email(unique), phone, address, gender(`male|female|other`), departmentId, designationId, joinDate, exitDate|null, status, basicSalary(number>0), userId
- Attendance: employeeId, date, checkInAt, checkOutAt|null, status(`present|late|half_day|missing_checkout`), workedHours(number), source(`web`). Unique(employeeId,date). `absent` and `on_leave` are COMPUTED, never stored.
- AttendanceCorrection: employeeId, date, checkIn(ISO|null), checkOut(ISO|null), reason, status(`pending|approved|rejected`), decidedBy, comment
- LeaveRequest: employeeId, leaveTypeId, startDate, endDate, days(working days), reason, status(`pending|approved|rejected|cancelled`), decidedBy, comment
- PayrollRun: month(unique), status(`draft|finalized`), createdBy, finalizedBy, finalizedAt, totals{gross,deductions,tax,net}
- Payslip: runId, employeeId, month, basic, hra, medical, gross, workingDays, absentDays, unpaidDays, halfDays, deduction, monthlyTax, net
- Announcement: title, body, authorId | Notification: userId, title, message, type, read(bool) | AuditLog: actorId, actorName, action, entity, entityId, before(JSON), after(JSON), createdAt | AiLog: userId, question, toolsUsed[], ok(bool), createdAt

## 4. Business rules (server enforces)
- Check-in: server time. Late if after officeStart + graceMinutes. Second check-in same day = 409. Check-out computes workedHours; if workedHours < halfDayHours status = `half_day`. No check-out by end of day => `missing_checkout`.
- Day status (computed for board/dashboards/payroll), for a working day (not weekend, not holiday, on/after joinDate, before exitDate): attendance record -> its status; else approved leave covering day -> `on_leave`; else `absent`.
- Leave: working days only. Quotas from LeaveType.yearlyQuota (annual 14, sick 8, casual 10, unpaid unlimited). Overlap with pending/approved leave or days > remaining => 422. Balance counts approved only (pending also reserved when checking over-balance).
- Payroll: hra=0.4*basic, medical=0.1*basic, gross=1.5*basic. perDay=gross/workingDaysInMonth. deduction = perDay*(absentDays+unpaidDays+0.5*halfDays). Prorate joiners/leavers (count only days employed). Annual=gross*12; annual tax slab: 0–600k:0; 600k–1.2M:5% of excess over 600k; 1.2M–2.4M:30k+15% of excess over 1.2M; 2.4M–3.6M:210k+25% of excess over 2.4M; >3.6M:510k+35% of excess over 3.6M. monthlyTax=annualTax/12. net=gross-deduction-monthlyTax. Finalized runs are locked (edit => 403).
- Employee scope: employee role only ever reads rows where employeeId == their own. Enforced in services, not only routes.
- Every create/update/approve/finalize writes an audit log. Leave decisions, correction decisions, payslip finalization send notifications.

## 5. ENDPOINTS
Legend: roles in [] ; `*`=any logged-in.
### Setup & Auth
- GET `/api/health` -> `{status:"ok"}` (public)
- GET `/api/setup/status` (public) -> `{ initialized: bool }`
- POST `/api/setup` (public, only if not initialized else 409) body `{ companyName, adminName, email, password }` -> `{ token, user }`. Also creates default leave types. Also if ADMIN_EMAIL/ADMIN_PASSWORD env set, backend auto-creates admin at boot when not initialized (setup then only needs companyName; keep both working).
- POST `/api/auth/login` body `{ email, password }` -> `{ token, user }` ; user = `{ id, name, email, role, employeeId, mustChangePassword }`
- GET `/api/auth/me` [*] -> `user`
- POST `/api/auth/change-password` [*] body `{ currentPassword, newPassword }` -> `{ changed:true }` (clears mustChangePassword)
### Users [admin]
- GET `/api/users?role=&page=&limit=` -> list
- POST `/api/users` body `{ name, email, password }` creates an HR user -> user
- PATCH `/api/users/:id/deactivate` | PATCH `/api/users/:id/activate` -> user
- POST `/api/users/:id/reset-password` -> `{ temporaryPassword }` (sets mustChangePassword true)
### Settings & Org
- GET `/api/settings` [*] -> settings ; PUT `/api/settings` [admin] body any of the Settings fields -> settings
- GET/POST `/api/departments`, PUT/DELETE `/api/departments/:id` (GET [*]; write [admin]) body `{ name }`
- GET/POST `/api/designations`, PUT/DELETE `/api/designations/:id` body `{ name, departmentId }`
- GET/POST `/api/leave-types`, PUT `/api/leave-types/:id` body `{ code, name, yearlyQuota }` (no delete)
- GET/POST `/api/holidays`, DELETE `/api/holidays/:id` body `{ date, name }`
### Employees
- GET `/api/employees?search=&departmentId=&designationId=&status=&page=&limit=` [admin,hr] (employee role: 403; they use `/me`)
- POST `/api/employees` [hr] body `{ code, name, email, phone, address, gender, departmentId, designationId, joinDate, basicSalary, status }` -> `{ employee, temporaryPassword }` (creates User role employee, mustChangePassword true)
- GET `/api/employees/me` [employee] -> employee (includes basicSalary of self)
- PATCH `/api/employees/me` [employee] body `{ phone, address }`
- GET `/api/employees/export.csv` [hr] -> text/csv download
- GET `/api/employees/:id` [admin,hr] -> Employee 360: `{ employee, attendanceSummary:{present,late,absent,halfDay}, leaveBalances:[...], lastPayslip|null }`
- PUT `/api/employees/:id` [hr] body any employee fields except basicSalary -> employee
- PUT `/api/employees/:id/salary` [hr] body `{ basicSalary }` -> employee
- PATCH `/api/employees/:id/status` [hr] body `{ status, exitDate? }` -> employee
(CSV import is OUT OF SCOPE.)
### Attendance
- POST `/api/attendance/check-in` [employee] body `{}` -> attendance record ; 409 if already
- POST `/api/attendance/check-out` [employee] body `{}` -> attendance record
- GET `/api/attendance/today` [employee] -> `{ record|null }`
- GET `/api/attendance?employeeId=&from=&to=&page=&limit=` [*] (employee forced to self; admin/hr any) -> list of records
- GET `/api/attendance/calendar?month=YYYY-MM&employeeId=` [*] -> `[{ date, status }]` with computed statuses (`present|late|half_day|missing_checkout|absent|on_leave|weekend|holiday`)
- GET `/api/attendance/board?date=YYYY-MM-DD&departmentId=` [admin,hr] -> `[{ employeeId, name, code, department, status, checkInAt, checkOutAt, workedHours }]`
- POST `/api/attendance/corrections` [employee] body `{ date, checkIn, checkOut, reason }` -> correction
- GET `/api/attendance/corrections?status=` [*] (employee: own) -> list (with employee name)
- PATCH `/api/attendance/corrections/:id/decision` [hr] body `{ decision:"approved"|"rejected", comment }` -> correction (approve applies times to Attendance and recomputes status)
### Leave
- POST `/api/leaves` [employee] body `{ leaveTypeId, startDate, endDate, reason }` -> leave (days computed) ; 422 on overlap/over-balance
- GET `/api/leaves?status=&employeeId=&page=&limit=` [*] (employee: own) -> list (with employeeName, leaveTypeName)
- PATCH `/api/leaves/:id/cancel` [employee, own, pending or future approved] -> leave
- PATCH `/api/leaves/:id/decision` [hr] body `{ decision:"approved"|"rejected", comment }` -> leave
- GET `/api/leaves/balance?employeeId=` [*] (employee: own; hr/admin may pass employeeId) -> `[{ leaveTypeId, code, name, quota, used, remaining }]` (unpaid: quota null, remaining null)
### Payroll
- POST `/api/payroll/runs` [hr] body `{ month }` -> run with items (409 if exists)
- GET `/api/payroll/runs` [admin,hr] -> list ; GET `/api/payroll/runs/:id` [admin,hr] -> `{ run, items:[payslip + employeeName, code] }`
- POST `/api/payroll/runs/:id/recalculate` [hr] (draft only)
- POST `/api/payroll/runs/:id/finalize` [admin] -> run (locks; notifies every employee)
- GET `/api/payslips?month=&employeeId=` [*] (employee: own & finalized only) -> list
- GET `/api/payslips/:id/pdf` [*] (employee: own) -> application/pdf
### Dashboards (all numbers server aggregated; query: `from`, `to` (YYYY-MM-DD), `departmentId` optional)
- GET `/api/dashboard/admin` [admin] -> `{ kpis:{headcount,attritionYtd,payrollCost,avgSalary}, headcountByDept:[{department,count}], payrollCostByDept:[{department,gross,net}], genderSplit:[{gender,count}], tenureBuckets:[{label,count}], auditFeed:[last 10] }`
- GET `/api/dashboard/hr` [hr,admin] -> `{ kpis:{headcount,present,onLeave,lateToday,pendingApprovals}, attendanceTrend:[{date,rate}], absenteeismByDept:[{department,rate}], leaveByType:[{type,days}], topLateComers:[{employeeId,name,lateCount}] }`
- GET `/api/dashboard/me` [employee] -> `{ hoursThisWeek, weeklyTarget:40, lateCount, leaveBalances:[...], lastPayslip|null, todayRecord|null }`
- Metric formulas: attendance rate=(present+late+missing_checkout+0.5*half_day)/(working-day records - on_leave); late%=late/(present+late); absenteeism=absent days/expected working days; headcount = active+probation.
### AI (key on server only, OpenAI-compatible tool calling)
- POST `/api/ai/chat` [*] body `{ message }` -> `{ answer, toolsUsed:[string], label:"AI-generated" }`. Tools (run with caller's scope): get_headcount, get_attendance_summary, get_late_comers, get_leave_summary, get_my_leave_balance, get_payroll_summary, search_employees. Employee asking others' data/salary => polite refusal. System prompt contains the rules of section 4. 15s timeout, friendly fallback, 20 req/user/hour => 429.
- POST `/api/ai/summary` [admin,hr] body `{ kind:"admin"|"hr", filters:{from,to,departmentId} }` -> `{ bullets:[string], label:"AI-generated" }` (3–5 bullets using only the KPI JSON the server computes itself)
- POST `/api/ai/smart-leave` [employee] body `{ text }` -> `{ leaveTypeId, type, startDate, endDate, reason }` (validated JSON; retry once; on failure 422 and the UI shows the normal form). Never saves.
### Comms & Audit
- GET `/api/announcements` [*] ; POST `/api/announcements` [admin,hr] body `{ title, body }`
- GET `/api/notifications` [*] (own) ; PATCH `/api/notifications/:id/read` ; POST `/api/notifications/read-all`
- GET `/api/audit-logs?action=&entity=&page=&limit=` [admin]
### Uploads (optional, low priority)
- POST `/api/uploads` [*] multipart field `file` -> `{ url }` (Supabase Storage, bucket from env). Only if time allows.

## 6. Fixed frontend structure
```
frontend/
  package.json .env.example README.md PROGRESS.md CONTRACT.md tailwind.config.js
  src/
    app/ layout.js globals.css
         (auth)/setup/page.js  (auth)/login/page.js  (auth)/change-password/page.js
         (app)/layout.js              <- sidebar + topbar + auth guard, menu from lib/nav.js
         (app)/dashboard/page.js
         (app)/employees/page.js  employees/new/page.js  employees/[id]/page.js
         (app)/attendance/page.js  attendance/board/page.js  attendance/corrections/page.js
         (app)/leave/page.js  leave/approvals/page.js
         (app)/payroll/page.js  payroll/[id]/page.js  (app)/payslips/page.js
         (app)/org/page.js   (app)/users/page.js   (app)/audit-log/page.js
         (app)/announcements/page.js  notifications/page.js  profile/page.js  ai/page.js
    components/ui/  Button.jsx Input.jsx Select.jsx Card.jsx Table.jsx Modal.jsx Spinner.jsx EmptyState.jsx ErrorBox.jsx Badge.jsx
    lib/ apiClient.js  auth.js  nav.js  format.js
```
### Shared frontend code (exact exports)
- `src/lib/apiClient.js` -> `api.get(path, params?)`, `api.post(path, body?)`, `api.put`, `api.patch`, `api.del`, `api.download(path, filename)`. All return the `data` field (and `{data, meta}` via `api.getPaged(path, params)`). On non-success they throw `Error` with `.status`, `.code`, `.details`. 401 -> clear token and redirect `/login`. Base = `process.env.NEXT_PUBLIC_API_URL`. Token key in localStorage: `hcm_token`.
- `src/lib/auth.js` -> `useAuth()` returns `{ user, loading, login(email,pw), logout(), refresh() }`; `AuthProvider` wraps app.
- `src/lib/nav.js` -> array `{ label, href, roles:['admin','hr','employee'] }`. FULL list (already contains pages built by later parts):
  Dashboard `/dashboard` all; Employees `/employees` admin,hr; Attendance `/attendance` all; Attendance Board `/attendance/board` admin,hr; Corrections `/attendance/corrections` all; Leave `/leave` all (employee: apply; hr: see all); Leave Approvals `/leave/approvals` hr; Payroll `/payroll` admin,hr; Payslips `/payslips` all; Organization `/org` admin; Users `/users` admin; Announcements `/announcements` all; Notifications `/notifications` all; Audit Log `/audit-log` admin; AI Assistant `/ai` all; Profile `/profile` all.
- `src/lib/format.js` -> `fmtDate`, `fmtTime`, `fmtMoney`.
- UI: simple Tailwind. Every page must have loading, empty and error states. Responsive from 375px.
- Page ownership: FE-A builds everything EXCEPT: `dashboard/page.js` (FE-A writes a simple placeholder), `payroll/*`, `payslips/page.js`, `audit-log/page.js`, `ai/page.js`. FE-B builds those and OVERWRITES the placeholder dashboard.

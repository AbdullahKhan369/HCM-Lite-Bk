export const NAV = [
  { label: 'Dashboard', href: '/dashboard', roles: ['admin', 'hr', 'employee'] },
  { label: 'Employees', href: '/employees', roles: ['admin', 'hr'] },
  { label: 'Attendance', href: '/attendance', roles: ['admin', 'hr', 'employee'] },
  { label: 'Attendance Board', href: '/attendance/board', roles: ['admin', 'hr'] },
  { label: 'Corrections', href: '/attendance/corrections', roles: ['admin', 'hr', 'employee'] },
  { label: 'Leave', href: '/leave', roles: ['admin', 'hr', 'employee'] },
  { label: 'Leave Approvals', href: '/leave/approvals', roles: ['hr'] },
  { label: 'Payroll', href: '/payroll', roles: ['admin', 'hr'] },
  { label: 'Payslips', href: '/payslips', roles: ['admin', 'hr', 'employee'] },
  { label: 'Organization', href: '/org', roles: ['admin'] },
  { label: 'Users', href: '/users', roles: ['admin'] },
  { label: 'Announcements', href: '/announcements', roles: ['admin', 'hr', 'employee'] },
  { label: 'Notifications', href: '/notifications', roles: ['admin', 'hr', 'employee'] },
  { label: 'Audit Log', href: '/audit-log', roles: ['admin'] },
  { label: 'AI Assistant', href: '/ai', roles: ['admin', 'hr', 'employee'] },
  { label: 'Profile', href: '/profile', roles: ['admin', 'hr', 'employee'] },
];

export default NAV;

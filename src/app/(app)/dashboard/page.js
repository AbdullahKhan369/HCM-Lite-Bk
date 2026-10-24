'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Spinner, PageHeader } from '@/features/common-b/ui';
import Filters, { defaultRange } from '@/features/dashboard/Filters';
import AiSummary from '@/features/dashboard/AiSummary';
import AdminDashboard from '@/features/dashboard/AdminDashboard';
import HrDashboard from '@/features/dashboard/HrDashboard';
import EmployeeDashboard from '@/features/dashboard/EmployeeDashboard';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [filters, setFilters] = useState(defaultRange());

  if (loading || !user) return <Spinner />;
  const role = user.role;
  const staff = role === 'admin' || role === 'hr';

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome, ${user.name}`} />
      {staff && <Filters value={filters} onChange={setFilters} />}
      {staff && <AiSummary kind={role === 'admin' ? 'admin' : 'hr'} filters={filters} />}
      {role === 'admin' && <AdminDashboard filters={filters} />}
      {role === 'hr' && <HrDashboard filters={filters} />}
      {role === 'employee' && <EmployeeDashboard />}
    </div>
  );
}

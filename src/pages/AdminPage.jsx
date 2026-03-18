/**
 * AdminPage – admin analytics view (summary, active sessions, access logs).
 * When forceAccess is true (e.g. from AdminPopup after password), bypass isAdmin check.
 * Otherwise only accessible to backend admin users.
 */

import { useEffect, useState, useMemo } from 'react';
import { BarChart2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useAccessLogs } from '../hooks/useAccessLogs';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { AccessLogsTable } from '../components/admin/AccessLogsTable';
import { AccessLogsFilters } from '../components/admin/AccessLogsFilters';
import { AdminSummaryCards } from '../components/admin/AdminSummaryCards';
import { ActiveSessionsTable } from '../components/admin/ActiveSessionsTable';
import { AdminUsersTable } from '../components/admin/AdminUsersTable';
import { Card } from '../components/ui/Card';

function toIsoStart(dateStr) {
  if (!dateStr?.trim()) return undefined;
  return `${dateStr.trim()}T00:00:00.000Z`;
}

function toIsoEnd(dateStr) {
  if (!dateStr?.trim()) return undefined;
  return `${dateStr.trim()}T23:59:59.999Z`;
}

const DEFAULT_FILTERS = {
  email: '',
  activeOnly: false,
  dateFrom: '',
  dateTo: '',
  limit: 50,
  offset: 0,
};

export function AdminPage({ forceAccess = false }) {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const setActivePage = useSimulatorStore((s) => s.setActivePage);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const canAccess = forceAccess || isAdmin;

  const apiOptions = useMemo(
    () => ({
      email: filters.email || undefined,
      activeOnly: filters.activeOnly || undefined,
      dateFrom: toIsoStart(filters.dateFrom),
      dateTo: toIsoEnd(filters.dateTo),
      limit: filters.limit,
      offset: filters.offset,
    }),
    [filters.email, filters.activeOnly, filters.dateFrom, filters.dateTo, filters.limit, filters.offset]
  );

  const { logs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useAccessLogs(apiOptions);

  const {
    summary,
    activeSessions,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useAdminDashboard();

  useEffect(() => {
    if (!forceAccess && !isAdmin) {
      setActivePage('dashboard');
    }
  }, [forceAccess, isAdmin, setActivePage]);

  const hasNext = logs.length >= filters.limit;
  const hasPrev = filters.offset > 0;

  function handleNext() {
    setFilters((f) => ({ ...f, offset: f.offset + f.limit }));
  }

  function handlePrev() {
    setFilters((f) => ({ ...f, offset: Math.max(0, f.offset - f.limit) }));
  }

  if (!canAccess) {
    return null;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Access analytics</h1>
          <p className="text-sm text-slate-500">Summary, active sessions, and access logs</p>
        </div>
      </div>

      {/* Summary + Active sessions */}
      <section>
        {dashboardLoading ? (
          <Card className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading dashboard…</p>
          </Card>
        ) : dashboardError ? (
          <Card className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-3" />
            <p className="text-sm text-slate-700 mb-2">{dashboardError}</p>
            <button
              type="button"
              onClick={refetchDashboard}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </Card>
        ) : (
          <>
            <AdminSummaryCards summary={summary} activeSessions={activeSessions} />
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Manage users</h2>
              <p className="text-xs text-slate-500 mb-3">
                Promote or remove admin role for users. Changes apply immediately.
              </p>
              <AdminUsersTable users={summary} onUpdate={refetchDashboard} />
            </div>
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Active sessions</h2>
              <ActiveSessionsTable sessions={activeSessions} />
            </div>
          </>
        )}
      </section>

      {/* Access logs */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Access logs</h2>
        <AccessLogsFilters
          filters={filters}
          onFiltersChange={setFilters}
          onRefresh={refetchLogs}
          loading={logsLoading}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onNext={handleNext}
          onPrev={handlePrev}
        />
        <div className="mt-4">
          <AccessLogsTable
            logs={logs}
            loading={logsLoading}
            error={logsError}
            onRefetch={refetchLogs}
          />
        </div>
      </section>
    </div>
  );
}

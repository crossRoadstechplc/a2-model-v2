/**
 * AccessLogsTable – displays admin access logs.
 * Handles loading, empty, and error states.
 */

import { Loader2, AlertCircle, FileQuestion, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatTimestamp, formatDuration } from '../../lib/admin/format';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'loginAt', label: 'Login time' },
  { key: 'logoutAt', label: 'Logout time' },
  { key: 'lastActivityAt', label: 'Last activity' },
  { key: 'sessionSeconds', label: 'Session duration' },
  { key: 'status', label: 'Status' },
];

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    logged_out: 'bg-slate-50 text-slate-600 border border-slate-200',
    expired: 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  const label = status === 'logged_out' ? 'Logged out' : status ?? '—';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize border ${styles[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}
      data-testid={`status-badge-${status ?? 'unknown'}`}
    >
      {label}
    </span>
  );
}

function formatCell(key, row) {
  switch (key) {
    case 'loginAt':
      return formatTimestamp(row.loginAt);
    case 'logoutAt':
      return row.logoutAt ? formatTimestamp(row.logoutAt) : '—';
    case 'lastActivityAt':
      return formatTimestamp(row.lastActivityAt);
    case 'sessionSeconds':
      return formatDuration(row.sessionSeconds);
    case 'status':
      return <StatusBadge status={row.status} />;
    default:
      return row[key] ?? '—';
  }
}

export function AccessLogsTable({ logs, loading, error, onRefetch }) {
  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading access logs…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-3" />
        <p className="text-sm text-slate-700 mb-2">{error}</p>
        {onRefetch && (
          <button
            type="button"
            onClick={onRefetch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </Card>
    );
  }

  if (!logs?.length) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <FileQuestion className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">No access logs found</p>
      </Card>
    );
  }

  return (
    <Card padding="none" overflow="auto">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {COLUMNS.map(({ key, label }) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((row, i) => (
              <tr
                key={row.sessionId ?? `${row.userId}-${row.loginAt}-${i}`}
                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                {COLUMNS.map(({ key }) => (
                  <td key={key} className="px-4 py-3 text-slate-700">
                    {formatCell(key, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * ActiveSessionsTable – displays currently active sessions.
 * Current duration: estimated from loginAt to now (display only).
 */

import { formatTimestamp, formatDuration } from '../../lib/admin/format';
import { Card } from '../ui/Card';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'loginAt', label: 'Login time' },
  { key: 'lastActivityAt', label: 'Last activity' },
  { key: 'durationSeconds', label: 'Current duration' },
  { key: 'status', label: 'Status' },
];

function currentDurationSeconds(loginAt) {
  if (!loginAt) return null;
  try {
    return Math.floor((Date.now() - new Date(loginAt).getTime()) / 1000);
  } catch {
    return null;
  }
}

function formatCell(key, row) {
  switch (key) {
    case 'loginAt':
      return formatTimestamp(row.loginAt);
    case 'lastActivityAt':
      return formatTimestamp(row.lastActivityAt);
    case 'durationSeconds':
      return formatDuration(currentDurationSeconds(row.loginAt));
    case 'status':
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
          Active
        </span>
      );
    default:
      return row[key] ?? '—';
  }
}

export function ActiveSessionsTable({ sessions = [] }) {
  if (!sessions.length) {
    return (
      <Card className="py-8 text-center">
        <p className="text-sm text-slate-500">No active sessions</p>
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
            {sessions.map((row, i) => (
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

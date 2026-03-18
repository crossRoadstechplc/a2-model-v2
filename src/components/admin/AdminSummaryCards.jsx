/**
 * AdminSummaryCards – aggregate cards for admin dashboard.
 * Totals computed on frontend for display only; not source of truth.
 */

import { Users, LogIn, Clock, Activity } from 'lucide-react';
import { formatUsageHours } from '../../lib/admin/format';

export function AdminSummaryCards({ summary = [], activeSessions = [] }) {
  const totalUsers = summary.length;
  const totalLogins = summary.reduce((acc, u) => acc + (u.loginCount ?? 0), 0);
  const cumulativeSeconds = summary.reduce((acc, u) => acc + (u.totalSessionSeconds ?? 0), 0);
  const usageHours = formatUsageHours(cumulativeSeconds);
  const activeCount = activeSessions.length;

  const cards = [
    { title: 'Total users', value: totalUsers.toLocaleString(), icon: Users, accent: 'blue' },
    { title: 'Total logins', value: totalLogins.toLocaleString(), icon: LogIn, accent: 'emerald' },
    { title: 'Cumulative usage', value: `${usageHours}h`, sub: 'session hours', icon: Clock, accent: 'amber' },
    { title: 'Active sessions', value: activeCount.toLocaleString(), icon: Activity, accent: 'slate' },
  ];

  const accentMap = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    slate: 'bg-slate-50 border-slate-200',
  };

  const iconMap = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, value, sub, icon: Icon, accent }) => (
        <div
          key={title}
          className={`rounded-xl border p-4 flex flex-col gap-2 ${accentMap[accent] ?? accentMap.slate}`}
        >
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            {Icon && (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconMap[accent] ?? iconMap.slate}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
      ))}
    </div>
  );
}

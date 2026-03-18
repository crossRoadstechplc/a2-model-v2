/**
 * AdminUsersTable – user list with promote-to-admin action.
 * Uses access summary data. Calls POST /admin/users/promote with email.
 */

import { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { promoteUser } from '../../lib/api/admin';
import { formatTimestamp } from '../../lib/admin/format';

export function AdminUsersTable({ users = [], onUpdate }) {
  const token = useAuthStore((s) => s.token);
  const [updatingEmail, setUpdatingEmail] = useState(null);
  const [error, setError] = useState(null);

  async function handlePromote(user) {
    if (!token || !user.email) return;
    setUpdatingEmail(user.email);
    setError(null);
    const result = await promoteUser(token, user.email);
    setUpdatingEmail(null);
    if (result.success) {
      onUpdate?.();
    } else {
      const msg = result.status === 404
        ? 'Promote endpoint not found. Ensure backend implements POST /admin/users/promote.'
        : (result.message ?? 'Failed to promote');
      setError(msg);
    }
  }

  if (!users.length) {
    return (
      <p className="text-sm text-slate-500 py-4">No users in access summary.</p>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600" data-testid="admin-users-error">
          {error}
        </p>
      )}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-700">User</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Logins</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Last seen</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Role</th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isUpdating = updatingEmail === u.email;
              const canPromote = !u.isAdmin && u.email;
              return (
                <tr key={u.userId} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-slate-900">{u.name ?? '—'}</p>
                      <p className="text-slate-500 text-xs">{u.email ?? '—'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{u.loginCount ?? 0}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {u.lastSeenAt ? formatTimestamp(u.lastSeenAt) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {canPromote ? (
                      <button
                        type="button"
                        onClick={() => handlePromote(u)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50"
                        title="Promote to admin"
                        data-testid={`admin-promote-${u.userId}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5" />
                            Promote
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

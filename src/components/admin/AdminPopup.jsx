/**
 * AdminPopup – modal overlay with admin analytics.
 * Shown after correct password (CTRL+Shift+A).
 */

import { X, LogOut } from 'lucide-react';
import useAdminStore from '../../store/useAdminStore';
import { AdminPage } from '../../pages/AdminPage';

export function AdminPopup() {
  const showAdminPopup = useAdminStore((s) => s.showAdminPopup);
  const closeAdminPopup = useAdminStore((s) => s.closeAdminPopup);
  const adminLogout = useAdminStore((s) => s.adminLogout);

  if (!showAdminPopup) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      data-testid="admin-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-popup-title"
    >
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between shrink-0 border-b border-slate-100 px-6 py-4">
          <h2 id="admin-popup-title" className="text-lg font-semibold text-slate-900">
            Access analytics
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={adminLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              data-testid="admin-popup-logout"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
            <button
              type="button"
              onClick={closeAdminPopup}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
              data-testid="admin-popup-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <AdminPage forceAccess />
        </div>
      </div>
    </div>
  );
}

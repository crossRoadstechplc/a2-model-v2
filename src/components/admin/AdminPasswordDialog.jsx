/**
 * AdminPasswordDialog – password prompt for admin analytics.
 * Shown when user presses CTRL+Shift+A. Password from VITE_ADMIN_PASS.
 */

import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import useAdminStore from '../../store/useAdminStore';

const EXPECTED_PASS = (import.meta.env.VITE_ADMIN_PASS ?? '').trim();

export function AdminPasswordDialog() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);
  const showPasswordDialog = useAdminStore((s) => s.showPasswordDialog);
  const setShowPasswordDialog = useAdminStore((s) => s.setShowPasswordDialog);
  const unlockAndShowPopup = useAdminStore((s) => s.unlockAndShowPopup);

  useEffect(() => {
    if (showPasswordDialog) {
      setPassword('');
      setError('');
      setShowPassword(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [showPasswordDialog]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const trimmed = (password ?? '').trim();
    if (EXPECTED_PASS && trimmed === EXPECTED_PASS) {
      unlockAndShowPopup();
    } else {
      setError('Incorrect password');
    }
  };

  const handleClose = () => {
    setShowPasswordDialog(false);
    setPassword('');
    setError('');
  };

  if (!showPasswordDialog) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      data-testid="admin-password-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-password-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 id="admin-password-title" className="text-lg font-semibold text-slate-900">
            Admin access
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the admin password to view analytics.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <label htmlFor="admin-password-input" className="sr-only">
              Admin password
            </label>
            <input
              ref={inputRef}
              id="admin-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              data-testid="admin-password-input"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              data-testid="admin-password-toggle"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {error && (
              <p className="mt-2 text-sm text-red-600" data-testid="admin-password-error">
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              data-testid="admin-password-submit"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

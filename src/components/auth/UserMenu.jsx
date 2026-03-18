/**
 * UserMenu – top-right user menu with name/email and logout.
 * Shown in the protected app shell. Uses auth store.
 */

import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logoutLoading = useAuthStore((s) => s.logoutLoading);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const displayName = user?.name ?? ([user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User');
  const displayEmail = user?.email ?? '';

  const initials = (() => {
    if (user?.firstName && user?.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase() || '?';
  })();

  return (
    <div className="relative" ref={menuRef} data-testid="user-menu">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 text-sm transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-slate-600">{initials}</span>
        </div>
        <span className="hidden sm:inline max-w-[120px] truncate text-slate-700">{displayName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-slate-200 bg-white shadow-lg py-2 z-20"
          role="menu"
        >
          {displayEmail && (
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs font-medium text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            disabled={logoutLoading}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            role="menuitem"
            data-testid="user-menu-logout"
          >
            <LogOut className="w-4 h-4" />
            {logoutLoading ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}

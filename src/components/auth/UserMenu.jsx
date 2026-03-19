/**
 * UserMenu – standalone app: local session label only (no API / sign-out).
 */

export function UserMenu() {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 text-sm"
      data-testid="user-menu"
      aria-label="Local session"
    >
      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
        <span className="text-xs font-medium text-slate-600">A2</span>
      </div>
      <span className="hidden sm:inline max-w-[120px] truncate text-slate-700">Local</span>
    </div>
  );
}

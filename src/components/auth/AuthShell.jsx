/**
 * AuthShell – layout for auth/onboarding screens.
 * Mirrors AppShell visual structure (sidebar + header + main) so auth feels
 * embedded in the app. Uses no simulator store.
 */

const CORRIDOR_NAME = 'Corridor A2';

function AuthSidebar() {
  return (
    <aside className="w-60 shrink-0 bg-slate-900 flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">A2</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              Investor Simulator
            </p>
            <p className="text-slate-500 text-xs">{CORRIDOR_NAME}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <p className="text-slate-500 text-xs text-center">
          Sign in to access the simulator
        </p>
      </div>
      <div className="px-4 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600">Confidential</p>
      </div>
    </aside>
  );
}

function AuthHeader({ title, subtitle, stepIndicator }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-400 truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>
      {stepIndicator && (
        <span className="text-xs text-slate-500 shrink-0">{stepIndicator}</span>
      )}
    </header>
  );
}

export function AuthShell({ children, title, subtitle, stepIndicator, 'data-testid': dataTestId }) {
  return (
    <div
      className="flex h-screen overflow-hidden bg-slate-50"
      data-testid={dataTestId ?? 'auth-shell'}
    >
      <AuthSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AuthHeader
          title={title ?? 'Sign in'}
          subtitle={subtitle}
          stepIndicator={stepIndicator}
        />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

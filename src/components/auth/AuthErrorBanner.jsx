/**
 * AuthErrorBanner – displays API/auth errors from useAuthStore.
 * Surfaces backend error or message field per API.md conventions.
 *
 * @param {{ message: string | null; className?: string }} props
 */
export function AuthErrorBanner({ message, className = '' }) {
  if (!message) return null;
  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 ${className}`.trim()}
      role="alert"
      data-testid="auth-error"
    >
      {message}
    </div>
  );
}

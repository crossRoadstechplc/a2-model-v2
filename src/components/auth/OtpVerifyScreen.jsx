/**
 * OtpVerifyScreen – OTP verification step.
 * Shown after successful requestOtp. Calls verifyOtp via auth store.
 * On success: store persists token and updates user/nda/walkthrough; gate advances.
 *
 * @see API.md POST /auth/verify-otp
 */

import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { AuthErrorBanner } from './AuthErrorBanner';

export function OtpVerifyScreen({ email, requestPayload, onBack }) {
  const [otp, setOtp] = useState('');

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const authError = useAuthStore((s) => s.authError);
  const verifyOtpLoading = useAuthStore((s) => s.verifyOtpLoading);
  const requestOtpLoading = useAuthStore((s) => s.requestOtpLoading);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    await verifyOtp({ email, otp });
  };

  const handleResend = async () => {
    if (!requestPayload) return;
    await requestOtp(requestPayload);
  };

  const isResendDisabled = requestOtpLoading || !requestPayload;

  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Enter verification code
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>
            </p>
          </div>
          <form onSubmit={handleVerify} className="p-6">
            <label htmlFor="otp" className="sr-only">
              6-digit verification code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-lg tracking-[0.5em] text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              maxLength={6}
              data-testid="otp-input"
              aria-label="6-digit verification code"
              autoComplete="one-time-code"
            />
            <AuthErrorBanner message={authError} className="mb-4" />
            <button
              type="submit"
              disabled={verifyOtpLoading || otp.length !== 6}
              className="w-full rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="verify-submit"
            >
              {verifyOtpLoading ? 'Verifying…' : 'Verify'}
            </button>
          </form>
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-slate-600 underline hover:text-slate-800"
              data-testid="back-button"
            >
              Use different email
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResendDisabled}
              className="text-sm font-medium text-slate-700 underline hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="resend-button"
            >
              {requestOtpLoading ? 'Sending…' : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

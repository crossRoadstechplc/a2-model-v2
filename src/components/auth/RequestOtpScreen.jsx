/**
 * RequestOtpScreen – request access / send OTP.
 * Collects First Name, Last Name, Email, Company Name per API doc.
 *
 * @see API.md POST /auth/request-otp
 */

import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { AuthErrorBanner } from './AuthErrorBanner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 255;

function validateRequired(value, label) {
  const t = value.trim();
  return !t ? `${label} is required` : t.length > MAX_NAME ? `Must be ${MAX_NAME} characters or less` : null;
}

function validateEmail(value) {
  const t = value.trim();
  if (!t) return 'Email is required';
  if (t.length > MAX_EMAIL) return `Email must be ${MAX_EMAIL} characters or less`;
  if (!EMAIL_RE.test(t)) return 'Please enter a valid email address';
  return null;
}

const COMPANY_ALLOWED = 'EIH';

const inputClass = (hasError) =>
  `w-full rounded-lg border px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 ${
    hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-400' : 'border-slate-300'
  }`;

export function RequestOtpScreen({ onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState({});

  const requestOtp = useAuthStore((s) => s.requestOtp);
  const authError = useAuthStore((s) => s.authError);
  const requestOtpLoading = useAuthStore((s) => s.requestOtpLoading);

  const errors = {
    firstName: validateRequired(firstName, 'First name'),
    lastName: validateRequired(lastName, 'Last name'),
    email: validateEmail(email),
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit =
    !hasErrors &&
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    !requestOtpLoading;

  const handleBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));
  const showError = (field) => touched[field] && errors[field];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true });
    if (hasErrors) return;

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      companyName: COMPANY_ALLOWED,
    };
    const result = await requestOtp(payload);
    if (result.success && onSuccess) onSuccess(payload);
  };

  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Request access
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your details to receive a verification code by email.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-slate-700">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={handleBlur('firstName')}
                    placeholder="First"
                    autoComplete="given-name"
                    aria-invalid={!!showError('firstName')}
                    aria-describedby={showError('firstName') ? 'firstName-error' : undefined}
                    className={inputClass(!!showError('firstName'))}
                    data-testid="first-name"
                  />
                  {showError('firstName') && (
                    <p id="firstName-error" className="mt-1.5 text-sm text-red-600" role="alert">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-slate-700">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={handleBlur('lastName')}
                    placeholder="Last"
                    autoComplete="family-name"
                    aria-invalid={!!showError('lastName')}
                    aria-describedby={showError('lastName') ? 'lastName-error' : undefined}
                    className={inputClass(!!showError('lastName'))}
                    data-testid="last-name"
                  />
                  {showError('lastName') && (
                    <p id="lastName-error" className="mt-1.5 text-sm text-red-600" role="alert">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleBlur('email')}
                  placeholder="you@company.com"
                  autoComplete="email"
                  aria-invalid={!!showError('email')}
                  aria-describedby={showError('email') ? 'email-error' : undefined}
                  className={inputClass(!!showError('email'))}
                  data-testid="email"
                />
                {showError('email') && (
                  <p id="email-error" className="mt-1.5 text-sm text-red-600" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="companyName" className="mb-1 block text-sm font-medium text-slate-700">
                  Company allowed:
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={COMPANY_ALLOWED}
                  readOnly
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-slate-600 cursor-not-allowed"
                  data-testid="company-name"
                  aria-readonly="true"
                />
              </div>
            </div>
            <AuthErrorBanner message={authError} className="mt-4" />
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 w-full rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="request-otp-submit"
            >
              {requestOtpLoading ? 'Sending code…' : 'Send verification code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

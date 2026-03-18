/**
 * NdaScreen – NDA acceptance for first-time authenticated users.
 * Shown only when backend/user state indicates NDA has not yet been accepted.
 * Calls acceptNda through auth store. Backend is source of truth.
 *
 * @see API.md POST /auth/accept-nda
 */

import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { AuthErrorBanner } from './AuthErrorBanner';

const NDA_VERSION = '1.0';

const NDA_CONTENT = `
 Revised Proprietary & NDA Notice
*© 2026 Access Africa. All rights reserved.*

 *Confidential & Proprietary:* This business planning tool, including all source code, financial logic, and simulations, is the exclusive intellectual property of *[Your Name/Company Name]*.

 *NDA Compliance:* Access to and use of this tool is strictly governed by the *Non-Disclosure Agreement (NDA)* executed between *Access Africa* and *EIH, Ethiopian Investment Holdings*. All users are bound by the confidentiality, non-use, and non-disclosure obligations set forth in that Agreement. Unauthorized access, reproduction, or distribution is prohibited.


By clicking *"Accept and continue"* or accessing this tool, you agree to the following:

1. *Authorized Access:* You represent that you are an authorized employee or representative of *EIH* and are using this tool solely for the purposes of our joint planning and investment evaluation.
2. *Strict Confidentiality:* You acknowledge that the underlying models, scenarios, and outputs are "Confidential Information" as defined in our existing NDA.
3. *No Reverse Engineering:* You agree not to attempt to decompile, reverse engineer, or extract the logic or source code of this tool.
4. *No Warranty:* Simulations are based on specific assumptions and are provided for planning purposes only. They do not constitute a guarantee of financial performance.

`.trim();

function renderWithBold(text) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? (
      <strong key={i}>{part.slice(1, -1)}</strong>
    ) : (
      part
    )
  );
}

export function NdaScreen() {
  const [accepted, setAccepted] = useState(false);
  const acceptNda = useAuthStore((s) => s.acceptNda);
  const authError = useAuthStore((s) => s.authError);
  const acceptNdaLoading = useAuthStore((s) => s.acceptNdaLoading);

  const handleAccept = async (e) => {
    e.preventDefault();
    if (!accepted) return;
    await acceptNda(NDA_VERSION);
  };

  return (
    <div className="flex min-h-full items-start justify-center pt-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Non-Disclosure Agreement
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Version {NDA_VERSION}
            </p>
          </div>
          <div className="max-h-[50vh] overflow-y-auto border-b border-slate-100 px-6 py-5">
            <div className="prose prose-sm max-w-none text-slate-700">
              <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {renderWithBold(NDA_CONTENT)}
              </div>
            </div>
          </div>
          <form onSubmit={handleAccept} className="p-6">
            <label className="mb-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
                data-testid="nda-checkbox"
                aria-describedby="nda-checkbox-desc"
              />
              <span id="nda-checkbox-desc" className="text-sm text-slate-700">
                I have read and agree to the terms of this Non-Disclosure Agreement
                and the Simplified Terms of Use. I represent that I am authorized to
                accept these terms on behalf of my organization.
              </span>
            </label>
            <AuthErrorBanner message={authError} className="mb-4" />
            <button
              type="submit"
              disabled={!accepted || acceptNdaLoading}
              className="w-full rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="accept-nda-submit"
            >
              {acceptNdaLoading ? 'Accepting…' : 'Accept and continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

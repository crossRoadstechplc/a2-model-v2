/**
 * WalkthroughModal – shown once until completed; completion persisted locally (no API).
 */

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import useWalkthroughStore from '../../store/useWalkthroughStore';
import { WALKTHROUGH_STEPS } from './WalkthroughSteps';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export function WalkthroughModal({ replay = false }) {
  const [step, setStep] = useState(0);
  const markWalkthroughComplete = useWalkthroughStore((s) => s.markWalkthroughComplete);
  const setShowWalkthroughReplay = useWalkthroughStore((s) => s.setShowWalkthroughReplay);
  const setActivePage = useSimulatorStore((s) => s.setActivePage);
  const setPanelOpen = useSimulatorStore((s) => s.setPanelOpen);
  const setInputsFocusSection = useSimulatorStore((s) => s.setInputsFocusSection);

  const current = WALKTHROUGH_STEPS[step];
  const isLast = step === WALKTHROUGH_STEPS.length - 1;
  const isFirst = step === 0;
  const isDocked = false;

  useEffect(() => {
    const a = current?.action;
    if (!a) return;
    if (typeof a.panelOpen === 'boolean') setPanelOpen(a.panelOpen);
    if (a.activePage) setActivePage(a.activePage);
    if ('focusSection' in a) setInputsFocusSection(a.focusSection ?? null);
  }, [current, setActivePage, setInputsFocusSection, setPanelOpen]);

  const handleNext = () => {
    if (isLast) {
      setInputsFocusSection(null);
      if (replay) {
        setShowWalkthroughReplay(false);
      } else {
        markWalkthroughComplete();
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (isFirst) return;
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSkip = () => {
    setInputsFocusSection(null);
    if (replay) {
      setShowWalkthroughReplay(false);
    } else {
      markWalkthroughComplete();
    }
  };

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 p-4',
        'bg-black/20',
        'flex items-center justify-center',
      )}
      data-testid="walkthrough-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
    >
      <div className="mx-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2
              key={step}
              id="walkthrough-title"
              className="text-lg font-semibold text-slate-900 animate-walkthrough-slide"
            >
              {current.title}
            </h2>
            <span className="text-sm text-slate-500">
              {step + 1} of {WALKTHROUGH_STEPS.length}
            </span>
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-6 py-4 overflow-x-hidden">
          <div
            key={step}
            className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 animate-walkthrough-slide"
          >
            {current.content}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-slate-600 underline hover:text-slate-800 disabled:opacity-50"
            data-testid="walkthrough-skip"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              data-testid="walkthrough-prev"
            >
              Previous
            </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            data-testid="walkthrough-complete"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

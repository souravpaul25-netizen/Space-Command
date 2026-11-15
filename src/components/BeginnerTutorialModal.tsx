import { useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, X } from 'lucide-react';
import { TUTORIAL_STEPS } from '../data/handbookContent';
import type { AppScreen } from '../simulation/types';

interface BeginnerTutorialModalProps {
  onClose: () => void;
  onNavigateScreen: (screen: AppScreen) => void;
}

export function BeginnerTutorialModal({
  onClose,
  onNavigateScreen,
}: BeginnerTutorialModalProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const current = TUTORIAL_STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === TUTORIAL_STEPS.length - 1;

  const handleJump = () => {
    if (current.recommendedTargetScreen) {
      onNavigateScreen(current.recommendedTargetScreen);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="w-full max-w-xl rounded-lg border border-slate-700 bg-[#0B1120] text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 truncate">
              Commander Briefing · Step {current.step} of {TUTORIAL_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip tutorial"
            className="min-h-[44px] sm:min-h-0 px-2 text-xs text-slate-400 hover:text-slate-100 inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Skip</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="h-1 w-full bg-slate-800">
          <div
            className="h-full bg-cyan-400 transition-all"
            style={{ width: `${((stepIdx + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <h2 id="tutorial-title" className="text-lg font-semibold text-slate-100">
            {current.title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">{current.summary}</p>
          <div className="p-3.5 rounded-md border border-slate-800 bg-slate-900/60">
            <p className="text-xs font-semibold text-cyan-300">What to Look For</p>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {current.whatToLookFor}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 px-4 sm:px-6 py-4 border-t border-slate-800 bg-[#080D19]">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded border border-slate-700 text-slate-300 hover:text-slate-100 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {current.recommendedTargetScreen && (
              <button
                type="button"
                onClick={handleJump}
                className="min-h-[44px] sm:min-h-0 px-3.5 py-2 text-xs font-medium rounded border border-cyan-500/40 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-900/40 cursor-pointer"
              >
                Open This View
              </button>
            )}

            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300 cursor-pointer"
              >
                Finish Tutorial
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIdx((i) => Math.min(TUTORIAL_STEPS.length - 1, i + 1))}
                className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

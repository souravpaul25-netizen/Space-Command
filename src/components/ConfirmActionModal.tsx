import { AlertTriangle, X } from 'lucide-react';

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  tone = 'warning',
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  if (!open) return null;

  const confirmClasses =
    tone === 'danger'
      ? 'bg-rose-500 text-slate-950 hover:bg-rose-400'
      : tone === 'warning'
      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
      : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300';

  const iconColor =
    tone === 'danger'
      ? 'text-rose-400'
      : tone === 'warning'
      ? 'text-amber-400'
      : 'text-cyan-400';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#0B1120] text-slate-100 overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-800">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <h2
              id="confirm-modal-title"
              className="text-sm sm:text-base font-semibold text-slate-100 leading-snug"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] -mr-2 -mt-2 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 rounded cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{description}</p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 px-4 sm:px-5 py-3.5 border-t border-slate-800 bg-[#080D19]">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[46px] sm:min-h-[38px] px-4 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[46px] sm:min-h-[38px] px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-transform active:scale-[0.98] ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import type { HandbookSectionId } from '../data/handbookContent';

interface InfoTooltipProps {
  title: string;
  explanation: string;
  handbookSection?: HandbookSectionId;
  onOpenHandbook?: (section: HandbookSectionId) => void;
}

export function InfoTooltip({
  title,
  explanation,
  handbookSection,
  onOpenHandbook,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={`Information about ${title}`}
        aria-expanded={open}
        className="p-2 sm:p-1 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center rounded text-slate-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
      >
        <Info className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      {open && (
        <span
          role="dialog"
          aria-label={title}
          className="block fixed inset-x-4 bottom-20 sm:bottom-auto sm:inset-x-auto sm:absolute sm:left-0 sm:top-full sm:mt-1.5 z-50 sm:w-72 p-4 sm:p-3.5 rounded-md border border-slate-700 bg-[#0B1120] text-left shadow-2xl"
        >
          <span className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-cyan-300">{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="sm:hidden text-[11px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 cursor-pointer"
            >
              Close
            </button>
          </span>
          <span className="block text-xs text-slate-300 leading-relaxed mt-1">{explanation}</span>
          {handbookSection && onOpenHandbook && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenHandbook(handbookSection);
              }}
              className="mt-2.5 min-h-[40px] sm:min-h-0 inline-flex items-center text-xs font-medium text-cyan-400 hover:underline cursor-pointer"
            >
              Read full guide in Handbook →
            </button>
          )}
        </span>
      )}
    </span>
  );
}

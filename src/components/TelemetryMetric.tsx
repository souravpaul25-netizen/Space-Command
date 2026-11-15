import { StatusIndicator } from './StatusIndicator';

interface TelemetryMetricProps {
  label: string;
  value: string;
  unit: string;
  delta?: string;
  statusLevel?: 'nominal' | 'warning' | 'critical' | 'info';
  statusLabel?: string;
  progressPct?: number;
}

export function TelemetryMetric({
  label,
  value,
  unit,
  delta,
  statusLevel,
  statusLabel,
  progressPct,
}: TelemetryMetricProps) {
  const clampedPct =
    typeof progressPct === 'number'
      ? Math.max(0, Math.min(100, progressPct))
      : null;

  const barColor =
    statusLevel === 'critical'
      ? 'bg-rose-500'
      : statusLevel === 'warning'
      ? 'bg-amber-400'
      : statusLevel === 'info'
      ? 'bg-cyan-400'
      : 'bg-emerald-400';

  return (
    <div className="p-3 sm:p-4 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] sm:text-xs font-medium tracking-wide text-slate-400 truncate">
            {label}
          </span>
          {statusLevel && statusLabel && (
            <StatusIndicator level={statusLevel} label={statusLabel} />
          )}
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-baseline">
          <span className="text-xl sm:text-2xl font-mono font-semibold tabular-nums text-slate-100">
            {value}
          </span>
          {unit && (
            <span className="text-[11px] sm:text-xs font-mono text-slate-400 ml-1.5">
              {unit}
            </span>
          )}
        </div>
      </div>

      {clampedPct !== null && (
        <div className="mt-2 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all ${barColor}`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
      )}

      {delta && (
        <p className="mt-1.5 text-[11px] sm:text-xs font-mono tabular-nums text-slate-400 leading-snug">
          {delta}
        </p>
      )}
    </div>
  );
}

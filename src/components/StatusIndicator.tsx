interface StatusIndicatorProps {
  level: 'nominal' | 'warning' | 'critical' | 'info';
  label: string;
}

export function StatusIndicator({ level, label }: StatusIndicatorProps) {
  const styles =
    level === 'nominal'
      ? 'text-emerald-400'
      : level === 'warning'
      ? 'text-amber-400'
      : level === 'critical'
      ? 'text-rose-400'
      : 'text-cyan-400';

  const glyph =
    level === 'nominal'
      ? '●'
      : level === 'warning'
      ? '▲'
      : level === 'critical'
      ? '✖'
      : '◆';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${styles}`}>
      <span aria-hidden="true" className="text-[11px] leading-none">
        {glyph}
      </span>
      <span>{label}</span>
    </span>
  );
}

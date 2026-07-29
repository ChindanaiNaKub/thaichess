import type { ReactNode } from 'react';

export function AccountStatTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'primary' | 'danger';
}) {
  const valueClassName = tone === 'primary'
    ? 'text-primary'
    : tone === 'danger'
      ? 'text-danger'
      : 'text-text-bright';

  return (
    <div className="rounded-2xl border border-surface-hover/70 bg-surface/80 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-dim">{label}</div>
      <div className={`mt-3 text-2xl font-bold tracking-tight ${valueClassName}`}>{value}</div>
    </div>
  );
}
import type { ReactNode } from 'react';

interface PuzzleCoachSectionProps {
  label: string;
  title?: string | null;
  body: string;
  tone?: 'surface' | 'accent' | 'primary' | 'danger';
  children?: ReactNode;
}

export function PuzzleCoachSection({
  label,
  title,
  body,
  tone = 'surface',
  children,
}: PuzzleCoachSectionProps) {
  const toneClasses = {
    surface: 'border-surface-hover bg-surface-alt',
    accent: 'border-accent/30 bg-accent/10',
    primary: 'border-primary/30 bg-primary/10',
    danger: 'border-danger/30 bg-danger/10',
  }[tone];

  return (
    <section className={`rounded-2xl border p-4 ${toneClasses}`}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80">{label}</p>
      {title && <h3 className="mt-2 text-base font-semibold text-text-bright">{title}</h3>}
      <p className="mt-2 text-sm leading-6 text-text-dim">{body}</p>
      {children && <div className="mt-3 border-t border-surface-hover/70 pt-3">{children}</div>}
    </section>
  );
}

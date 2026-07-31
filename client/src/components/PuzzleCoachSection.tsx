import type { ReactNode } from 'react';

interface PuzzleCoachSectionProps {
  label: string;
  title?: string | null;
  body: string;
  tone?: 'surface' | 'accent' | 'primary' | 'danger' | 'gold';
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
    surface: 'border-surface-hover/70 bg-surface-alt/70',
    accent: 'border-accent/30 bg-accent/10',
    primary: 'border-surface-hover/70 bg-surface-alt/70',
    danger: 'border-danger/30 bg-danger/10',
    gold: 'border-gold/35 bg-gold/10',
  }[tone];

  return (
    <section className={`rounded-[0.9rem] border p-4 ${toneClasses}`}>
      {title ? (
        <>
          <h3 className="text-base font-semibold text-text-bright">{title}</h3>
          <p className="mt-1 text-sm text-text-dim">{label}</p>
        </>
      ) : (
        <h3 className="text-base font-semibold text-text-bright">{label}</h3>
      )}
      <p className="mt-2 text-sm leading-relaxed text-text-dim">{body}</p>
      {children && <div className="mt-3 border-t border-surface-hover/70 pt-3">{children}</div>}
    </section>
  );
}

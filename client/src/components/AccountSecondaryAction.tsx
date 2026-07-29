import type { ReactNode } from 'react';

export function AccountSecondaryAction({
  children,
  danger = false,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className={danger
        ? 'w-full rounded-xl border border-danger/40 px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/8'
        : 'w-full rounded-xl border border-surface-hover/70 bg-surface/70 px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60'}
    >
      {children}
    </button>
  );
}
import { useEffect, useState, type ReactNode } from 'react';
import type { TranslateFn } from './gamePageHelpers';

type CountingLeaveDisclosureProps = {
  t: TranslateFn;
  /** When the player's clock is critical, auto-expand Draw/Resign for discovery. */
  leaveUrgent?: boolean;
  children: ReactNode;
  className?: string;
  exitsClassName?: string;
  toggleTestId?: string;
  exitsTestId?: string;
};

/**
 * Collapses Draw/Resign behind a leave toggle during counting.
 * Shared by the mobile board strip and desktop side-panel high-stakes lane.
 */
export default function CountingLeaveDisclosure({
  t,
  leaveUrgent = false,
  children,
  className = 'border-t border-surface-hover/60 pt-2',
  exitsClassName = 'mt-2 flex gap-2',
  toggleTestId = 'counting-leave-toggle',
  exitsTestId = 'counting-leave-exits',
}: CountingLeaveDisclosureProps) {
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => {
    if (leaveUrgent) setLeaveOpen(true);
  }, [leaveUrgent]);

  return (
    <div className={className || undefined}>
      <button
        type="button"
        data-testid={toggleTestId}
        aria-expanded={leaveOpen}
        data-urgent={leaveUrgent ? 'true' : 'false'}
        onClick={() => setLeaveOpen((open) => !open)}
        className={`text-xs font-semibold underline-offset-4 transition-colors hover:underline ${
          leaveUrgent
            ? 'text-danger hover:text-danger'
            : 'text-text-dim hover:text-text-bright'
        }`}
      >
        {leaveOpen ? t('game.counting_hide_leave') : t('game.counting_leave_options')}
      </button>
      {leaveOpen ? (
        <div data-testid={exitsTestId} className={exitsClassName}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

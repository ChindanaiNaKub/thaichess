import { useEffect, useState, type ReactNode } from 'react';
import type { TranslateFn } from './gamePageHelpers';

type CountingStartDetailsDisclosureProps = {
  t: TranslateFn;
  /** Auto-open when clock-critical leave must surface during the Start decision. */
  leaveUrgent?: boolean;
  children: ReactNode;
  toggleTestId?: string;
  detailsTestId?: string;
};

/**
 * Nests help (and leave, on the board strip) behind one disclosure while Start is the primary act.
 */
export default function CountingStartDetailsDisclosure({
  t,
  leaveUrgent = false,
  children,
  toggleTestId = 'counting-start-details-toggle',
  detailsTestId = 'counting-start-details',
}: CountingStartDetailsDisclosureProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (leaveUrgent) setOpen(true);
  }, [leaveUrgent]);

  return (
    <div className="mt-2 border-t border-surface-hover/60 pt-2">
      <button
        type="button"
        data-testid={toggleTestId}
        aria-expanded={open}
        data-urgent={leaveUrgent ? 'true' : 'false'}
        onClick={() => setOpen((value) => !value)}
        className={`text-xs font-semibold underline-offset-4 transition-colors hover:underline ${
          leaveUrgent
            ? 'text-danger hover:text-danger'
            : 'text-text-dim hover:text-text-bright'
        }`}
      >
        {open ? t('game.counting_hide_start_details') : t('game.counting_start_details')}
      </button>
      {open ? (
        <div data-testid={detailsTestId}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

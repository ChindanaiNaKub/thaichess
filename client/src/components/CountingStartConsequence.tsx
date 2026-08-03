import type { TranslateFn } from './gamePageHelpers';

/** One-line Makruk consequence shown whenever Start Count is available. */
export default function CountingStartConsequence({ t }: { t: TranslateFn }) {
  return (
    <p
      data-testid="counting-start-consequence"
      className="mt-1.5 text-xs leading-5 text-text-dim"
    >
      {t('game.counting_start_consequence')}
    </p>
  );
}

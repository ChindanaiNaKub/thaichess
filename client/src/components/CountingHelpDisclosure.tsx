import { useState } from 'react';
import { routes } from '../lib/routes';
import type { TranslateFn } from './gamePageHelpers';

/** Progressive “what is counting?” help for in-game Operate side panels. */
export default function CountingHelpDisclosure({ t }: { t: TranslateFn }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="text-xs font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
      >
        {open ? t('game.counting_what_hide') : t('game.counting_what')}
      </button>
      {open ? (
        <div className="mt-2 space-y-2 rounded-lg border border-surface-hover/70 bg-surface/50 px-3 py-2 text-xs leading-5 text-text-dim">
          <p>{t('game.counting_explain')}</p>
          <a
            href={routes.howToPlayMakruk}
            target="_blank"
            rel="noreferrer"
            className="inline-flex font-semibold text-text underline-offset-4 hover:text-text-bright hover:underline"
          >
            {t('game.counting_learn_more')}
          </a>
        </div>
      ) : null}
    </div>
  );
}

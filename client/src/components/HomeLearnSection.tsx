import type { PieceType } from '@shared/types';
import { useTranslation } from '../lib/i18n';
import PieceSVG from './PieceSVG';

const LEARN_PIECES: PieceType[] = ['K', 'M', 'R'];

export interface HomeLearnSectionProps {
  learnCards: Array<{ href: string; title: string; desc: string }>;
}

export function HomeLearnSection({ learnCards }: HomeLearnSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="deferred-section">
      <p className="ui-eyebrow">{t('home.learn_eyebrow')}</p>
      <h2 className="ui-title font-display mt-2 text-2xl">{t('home.learn_title')}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-text-dim">
        {t('home.learn_desc')}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {learnCards.map((card, i) => (
          <a
            key={card.href}
            href={card.href}
            className="group overflow-hidden rounded-xl border border-surface-hover/70 bg-surface-alt/80 transition-colors hover:border-accent/35 hover:bg-surface-hover/40"
          >
            <div className="flex items-center gap-3 border-b border-surface-hover/60 px-4 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface">
                <PieceSVG
                  type={LEARN_PIECES[i] ?? 'K'}
                  color="white"
                  size={40}
                />
              </div>
              <span className="font-display text-xs font-semibold uppercase tracking-wider text-accent">
                0{i + 1}
              </span>
            </div>
            <div className="px-4 py-3">
              <div className="text-base font-semibold text-text-bright">
                {card.title}
              </div>
              <div className="mt-1 text-sm leading-6 text-text-dim">
                {card.desc}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

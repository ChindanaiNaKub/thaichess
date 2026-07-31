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
      <h2 className="ui-title font-display text-2xl">{t('home.learn_title')}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-text-dim">
        {t('home.learn_desc')}
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {learnCards.map((card, i) => (
          <a
            key={card.href}
            href={card.href}
            className="group flex items-start gap-4 rounded-xl border border-surface-hover/70 bg-surface-alt/80 px-4 py-3 transition-colors hover:border-accent/35 hover:bg-surface-hover/40"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface">
              <PieceSVG
                type={LEARN_PIECES[i] ?? 'K'}
                color="white"
                size={40}
              />
            </div>
            <div className="min-w-0 pt-0.5">
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

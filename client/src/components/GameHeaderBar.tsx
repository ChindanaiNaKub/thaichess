import type { ReactNode } from 'react';
import { useTranslation } from '../lib/i18n';
import PieceSVG from './PieceSVG';

interface GameHeaderBarProps {
  meta: ReactNode;
  onHome: () => void;
}

export default function GameHeaderBar({ meta, onHome }: GameHeaderBarProps) {
  const { t } = useTranslation();

  return (
    <header className="bg-surface-alt/95 border-b border-surface-hover shrink-0">
      <div className="max-w-[1240px] mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        <button onClick={onHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
          <PieceSVG type="K" color="white" size={26} />
          <h1 className="text-base font-bold text-text-bright tracking-tight">{t('app.name')}</h1>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-text-dim flex-wrap justify-end">
          {meta}
        </div>
      </div>
    </header>
  );
}

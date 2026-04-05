import type { ReactNode } from 'react';
import { useTranslation } from '../lib/i18n';

interface GameScreenLayoutProps {
  topPanel: ReactNode;
  board: ReactNode;
  bottomPanel: ReactNode;
  sidePanel: ReactNode;
  statusText: ReactNode;
  moveCount: number;
  isViewingHistory?: boolean;
  showCheckBadge?: boolean;
  toolbar?: ReactNode;
}

export default function GameScreenLayout({
  topPanel,
  board,
  bottomPanel,
  sidePanel,
  statusText,
  moveCount,
  isViewingHistory = false,
  showCheckBadge = false,
  toolbar = null,
}: GameScreenLayoutProps) {
  const { t } = useTranslation();

  return (
    <main id="main-content" className="flex-1 min-h-0 px-3 py-2 sm:px-4 sm:py-3">
      <div className="mx-auto grid h-full w-full max-w-[1240px] items-start gap-3 lg:grid-cols-[minmax(0,1fr)_272px] xl:grid-cols-[minmax(0,1fr)_288px]">
        <div className="flex min-h-0 flex-col items-center gap-1.5 w-full">
          {topPanel}

          <div className="w-full lg:w-[min(100%,calc(100dvh-15.4rem))] xl:w-[min(100%,calc(100dvh-14.8rem))]">
            <div className="mb-1 flex items-center justify-between gap-2 px-1">
              <div className="text-sm font-semibold text-text-bright">
                {isViewingHistory ? t('game.reviewing_history') : statusText}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim flex-wrap justify-end">
                {toolbar}
                <span className="rounded-full border border-surface-hover bg-surface-alt px-2.5 py-1">
                  {t('moves.title')} {moveCount}
                </span>
                {showCheckBadge && !isViewingHistory && (
                  <span className="rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-danger">
                    {t('game.check_status')}
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-accent/25 bg-[radial-gradient(circle_at_top,rgba(173,130,53,0.12),transparent_40%),linear-gradient(180deg,rgba(58,45,31,0.88),rgba(24,20,18,0.96))] p-1.5 shadow-[0_26px_70px_rgba(0,0,0,0.24)]">
              {board}
            </div>
          </div>

          {bottomPanel}
        </div>

        <aside
          className="flex w-full max-w-[720px] flex-col gap-2.5 lg:max-h-full lg:max-w-none lg:overflow-auto lg:pr-1"
          style={{ overflowAnchor: 'none' }}
        >
          {sidePanel}
        </aside>
      </div>
    </main>
  );
}

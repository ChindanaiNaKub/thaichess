import type { ReactNode } from 'react';
import { useTranslation } from '../lib/i18n';

/** Felt plane under the board — soft lift off cloth, not a SaaS card shell. */
export const GAME_BOARD_FRAME_CLASS =
  'rounded-xl border border-surface-hover/35 bg-surface/45 p-1 shadow-[0_10px_24px_oklch(0.10_0.02_65_/_0.14)]';

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
  /** Board-adjacent notice (e.g. mobile counting strip). */
  boardNotice?: ReactNode;
  /** Actions under the player clock (e.g. mobile draw/resign). */
  boardActions?: ReactNode;
  /** Optional status-lane help (e.g. Piece Guide on check). */
  statusHelp?: ReactNode;
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
  boardNotice = null,
  boardActions = null,
  statusHelp = null,
}: GameScreenLayoutProps) {
  const { t } = useTranslation();

  return (
    <main id="main-content" className="flex-1 min-h-0 px-3 py-2 sm:px-4 sm:py-3">
      <div className="mx-auto grid h-full w-full min-w-0 max-w-[1240px] items-start gap-3 lg:grid-cols-[minmax(0,1fr)_272px] xl:grid-cols-[minmax(0,1fr)_288px]">
        <div className="flex min-h-0 min-w-0 flex-col items-center gap-1.5 w-full">
          {topPanel}

          <div className="w-full lg:w-[min(100%,calc(100dvh-15.4rem))] xl:w-[min(100%,calc(100dvh-14.8rem))]">
            {/* One quiet lane: status truncates; meta never wraps into stacked chips. */}
            <div
              data-testid="game-status-row"
              className="mb-1 flex min-w-0 items-center gap-2 px-1"
            >
              <div className="min-w-0 flex-1 truncate text-sm font-semibold text-text-bright">
                {isViewingHistory ? t('game.reviewing_history') : statusText}
                {showCheckBadge && !isViewingHistory ? (
                  <span className="ml-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold">
                    {t('game.check_status')}
                  </span>
                ) : null}
                {statusHelp && !isViewingHistory ? (
                  <span className="ml-2 inline-flex align-middle">{statusHelp}</span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                {toolbar}
                <span data-testid="game-move-count" className="tabular-nums text-text-dim">
                  {t('moves.title')} {moveCount}
                </span>
              </div>
            </div>
            {boardNotice}
            <div data-testid="game-board-frame" className={GAME_BOARD_FRAME_CLASS}>
              {board}
            </div>
          </div>

          {bottomPanel}
          {boardActions ? <div className="w-full">{boardActions}</div> : null}
        </div>

        <aside
          className="flex min-w-0 w-full max-w-[720px] flex-col gap-2.5 lg:max-h-full lg:max-w-none lg:overflow-auto lg:pr-1"
          style={{ overflowAnchor: 'none' }}
        >
          {sidePanel}
        </aside>
      </div>
    </main>
  );
}

import type { ClientGameState, PieceColor } from '@shared/types';
import Header from './Header';
import type { TranslateFn } from './gamePageHelpers';

export type GamePageWaitingViewProps = {
  t: TranslateFn;
  gameState: ClientGameState;
  playerColor: PieceColor | null;
  waitingPlayerName: string;
  waitingPlayerRating: number | null;
  spectatorPath: string;
  copied: boolean;
  onCopyGameLink: () => void;
  onNewGame: () => void;
};

export function GamePageWaitingView({
  t,
  gameState,
  playerColor,
  waitingPlayerName,
  waitingPlayerRating,
  spectatorPath,
  copied,
  onCopyGameLink,
  onNewGame,
}: GamePageWaitingViewProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 max-w-md w-full text-center animate-slideUp">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <h2 className="text-xl sm:text-2xl font-bold text-text-bright mb-2">{t('game.waiting_title')}</h2>
          <p className="text-text-dim mb-6 text-sm sm:text-base">{t('game.waiting_desc')}</p>

          <div className="mb-4 rounded-xl border border-surface-hover bg-surface px-4 py-3 text-left">
            <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('game.playing_as_label')}</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-text-bright">{waitingPlayerName}</div>
                <div className="text-xs text-text-dim">{playerColor ? t(`common.${playerColor}`) : t('common.you')}</div>
              </div>
              {typeof waitingPlayerRating === 'number' && (
                <span className="rounded-full border border-surface-hover bg-surface-alt px-3 py-1 text-xs font-semibold text-text-bright">
                  {t('leaderboard.col_rating')} {waitingPlayerRating}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface rounded-lg p-2 mb-4">
            <input
              type="text"
              readOnly
              aria-label={t('game.share')}
              value={window.location.href}
              className="flex-1 bg-transparent text-text-bright text-sm px-2 focus:outline-none font-mono"
            />
            <button type="button"
              onClick={onCopyGameLink}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                copied
                  ? 'button-accent-contrast'
                  : 'bg-surface-hover text-text-bright hover:bg-accent/15'
              }`}
            >
              {copied ? t('game.copied') : t('game.copy')}
            </button>
          </div>

          <a
            href={spectatorPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-surface-hover bg-surface px-4 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover"
          >
            {t('game.open_spectator')}
          </a>

          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            gameState.rated ? 'bg-accent/15 text-accent' : 'bg-surface text-text-dim border border-surface-hover'
          }`}>
            {gameState.rated ? t('game.rated') : t('game.casual')}
          </div>
          <button type="button"
            onClick={onNewGame}
            className="mt-4 px-5 py-2 rounded-lg bg-surface hover:bg-surface-hover text-text-bright border border-surface-hover font-semibold transition-colors"
          >
            {t('common.back_home')}
          </button>
        </div>
      </main>
    </div>
  );
}

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
  onPlayBot: () => void;
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
  onPlayBot,
}: GamePageWaitingViewProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md animate-slideUp rounded-xl border border-surface-hover bg-surface-alt p-6 text-center sm:p-8">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <h2 className="mb-2 text-xl font-bold text-text-bright sm:text-2xl">{t('game.waiting_title')}</h2>
          <p className="mb-4 text-sm text-text-dim sm:text-base">{t('game.waiting_desc')}</p>
          <p className="mb-6 text-xs leading-5 text-text-dim">{t('game.waiting_help')}</p>

          <div className="mb-4 rounded-xl border border-surface-hover bg-surface px-4 py-3 text-left">
            <div className="text-[0.7rem] uppercase tracking-[0.18em] text-text-dim">{t('game.playing_as_label')}</div>
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

          <div className="mb-4 flex items-center gap-2 rounded-lg bg-surface p-2">
            <input
              type="text"
              readOnly
              aria-label={t('game.share')}
              value={window.location.href}
              className="flex-1 bg-transparent px-2 font-mono text-sm text-text-bright focus:outline-none"
            />
            <button
              type="button"
              onClick={onCopyGameLink}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                copied
                  ? 'button-accent-contrast'
                  : 'bg-surface-hover text-text-bright hover:bg-surface'
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
            gameState.rated
              ? 'border border-primary/25 bg-primary/10 text-primary-light'
              : 'border border-surface-hover bg-surface text-text-dim'
          }`}>
            {gameState.rated ? t('game.rated') : t('game.casual')}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onPlayBot}
              className="button-accent-contrast w-full rounded-xl px-5 py-3 text-sm font-bold"
            >
              {t('game.waiting_play_bot')}
            </button>
            <button
              type="button"
              onClick={onNewGame}
              className="w-full rounded-xl border border-surface-hover bg-surface px-5 py-2.5 font-semibold text-text-bright transition-colors hover:bg-surface-hover"
            >
              {t('common.back_home')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

import Header from './Header';
import type { TranslateFn } from './gamePageHelpers';

type GamePageLoadingViewProps = {
  t: TranslateFn;
};

export function GamePageLoadingView({ t }: GamePageLoadingViewProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-dim text-sm sm:text-base">{t('game.connecting')}</p>
        </div>
      </div>
    </div>
  );
}

type GamePageErrorViewProps = {
  t: TranslateFn;
  error: string;
  onRetry: () => void;
  onBackHome: () => void;
};

export function GamePageErrorView({ t, error, onRetry, onBackHome }: GamePageErrorViewProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 max-w-md w-full text-center">
          <h2 className="text-lg sm:text-xl font-bold text-danger mb-2">{t('game.error')}</h2>
          <p className="text-text-dim mb-4 text-sm sm:text-base">{error}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="button-accent-contrast rounded-lg px-6 py-2 text-sm font-bold sm:text-base"
            >
              {t('game.retry')}
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="rounded-lg border border-surface-hover bg-surface-alt px-6 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover sm:text-base"
            >
              {t('common.back_home')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

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
  onBackHome: () => void;
};

export function GamePageErrorView({ t, error, onBackHome }: GamePageErrorViewProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg sm:text-xl font-bold text-danger mb-2">{t('game.error')}</h2>
          <p className="text-text-dim mb-4 text-sm sm:text-base">{error}</p>
          <button type="button" onClick={onBackHome} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold text-sm sm:text-base">
            {t('common.back_home')}
          </button>
        </div>
      </main>
    </div>
  );
}

import Header from './Header';
import type { TranslateFn } from './analysisPageHelpers';

type AnalysisLoadingViewProps = {
  t: TranslateFn;
};

export function AnalysisLoadingView({ t }: AnalysisLoadingViewProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div data-testid="analysis-loading" className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-dim">{t('analysis.loading')}</p>
        </div>
      </div>
    </div>
  );
}

type AnalysisErrorViewProps = {
  t: TranslateFn;
  error: string;
  onBackHome: () => void;
};

export function AnalysisErrorView({ t, error, onBackHome }: AnalysisErrorViewProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center p-4">
        <div data-testid="analysis-error" className="bg-surface-alt border border-surface-hover rounded-xl p-6 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 data-testid="analysis-error-title" className="text-lg font-bold text-danger mb-2">{t('game.error')}</h2>
          <p data-testid="analysis-error-message" className="text-text-dim mb-4">{error}</p>
          <button type="button" data-testid="analysis-back-home" onClick={onBackHome} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold">
            {t('common.back_home')}
          </button>
        </div>
      </main>
    </div>
  );
}

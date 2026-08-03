import { useTranslation } from '../lib/i18n';
import { formatSearchTime, type QuickPlayTimePreset } from './quickPlayTimePresets';

type QuickPlaySearchingPanelProps = {
  selectedTime: QuickPlayTimePreset;
  searchTime: number;
  queueSize: number;
  showBotFallback: boolean;
  onPlayBot: () => void;
  onKeepSearching: () => void;
  onCancel: () => void;
};

export default function QuickPlaySearchingPanel({
  selectedTime,
  searchTime,
  queueSize,
  showBotFallback,
  onPlayBot,
  onKeepSearching,
  onCancel,
}: QuickPlaySearchingPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="ui-card w-full max-w-md p-6 text-center animate-slideUp sm:p-8">
      <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-accent/45 border-t-transparent" />
      <h2 className="text-2xl font-bold text-text-bright mb-2">{t('quick.searching')}</h2>
      <p className="text-text-dim mb-1">
        {selectedTime.label} {t(selectedTime.nameKey)}
      </p>
      <p className="text-text-dim text-sm mb-1">
        {t('quick.search_time', { time: formatSearchTime(searchTime) })}
      </p>
      {queueSize > 0 && (
        <p className="text-text-dim text-xs mb-4">
          {t('quick.queue', { count: queueSize })}
        </p>
      )}
      {showBotFallback && (
        <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-left">
          <h3 className="text-sm font-semibold text-text-bright">{t('quick.fallback_title')}</h3>
          <p className="mt-1 text-xs leading-5 text-text-dim">{t('quick.fallback_desc')}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onPlayBot}
              className="button-accent-contrast rounded-lg px-4 py-2 text-sm font-bold"
            >
              {t('quick.play_bot_now')}
            </button>
            <button
              type="button"
              onClick={onKeepSearching}
              className="ui-btn-secondary px-4 py-2 text-sm"
            >
              {t('quick.keep_searching')}
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="ui-btn-secondary flex-1 px-6 py-3 hover:bg-danger/20 hover:text-danger"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import {
  getTimePaceGroup,
  groupTimePresetsByPace,
  type QuickPlayTimePreset,
  type TimePaceGroup,
} from './quickPlayTimePresets';

type QuickPlayLobbyPanelProps = {
  user: AuthUser | null;
  ratedEligible: boolean;
  selectedTime: QuickPlayTimePreset;
  visiblePresets: QuickPlayTimePreset[];
  hasHiddenPresets: boolean;
  showAllTimes: boolean;
  requestPending: boolean;
  error: string | null;
  onSelectTime: (preset: QuickPlayTimePreset) => void;
  onToggleAllTimes: () => void;
  onFindGame: () => void;
  onBackHome: () => void;
};

function TimePresetButton({
  preset,
  selected,
  onSelect,
  label,
}: {
  preset: QuickPlayTimePreset;
  selected: boolean;
  onSelect: (preset: QuickPlayTimePreset) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(preset)}
      className={`ui-choice rounded-lg px-3 py-2 text-sm font-medium ${
        selected ? 'ui-choice-selected' : ''
      }`}
    >
      <div className="font-bold">{preset.label}</div>
      <div className="text-xs opacity-70">{label}</div>
    </button>
  );
}

export default function QuickPlayLobbyPanel({
  user,
  ratedEligible,
  selectedTime,
  visiblePresets,
  hasHiddenPresets,
  showAllTimes,
  requestPending,
  error,
  onSelectTime,
  onToggleAllTimes,
  onFindGame,
  onBackHome,
}: QuickPlayLobbyPanelProps) {
  const { t } = useTranslation();
  const paceGroups = useMemo(
    () => (showAllTimes ? groupTimePresetsByPace(visiblePresets) : []),
    [showAllTimes, visiblePresets],
  );
  const [openPace, setOpenPace] = useState<TimePaceGroup>(() => getTimePaceGroup(selectedTime));
  const selectedPace = getTimePaceGroup(selectedTime);

  useEffect(() => {
    if (!showAllTimes) return;
    setOpenPace(selectedPace);
  }, [showAllTimes, selectedPace]);

  return (
    <div className="ui-card w-full max-w-lg p-5 animate-slideUp sm:p-6">
      <h2 className="text-2xl font-bold text-text-bright mb-2 text-center">{t('quick.title')}</h2>
      <p className="text-text-dim text-center mb-6 text-sm">{t('quick.desc')}</p>
      <div className="mb-6 rounded-xl border border-surface-hover bg-surface px-4 py-3 text-center">
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
          user && ratedEligible
            ? 'border border-primary/25 bg-primary/10 text-primary-light'
            : user
              ? 'border border-danger/30 bg-danger/10 text-danger'
              : 'border border-primary/25 bg-primary/10 text-primary-light'
        }`}>
          {user
            ? ratedEligible
              ? t('quick.rated_available')
              : t('quick.rated_unavailable')
            : t('quick.casual_only')}
        </div>
        <p className="mt-2 text-xs text-text-dim">
          {user
            ? ratedEligible
              ? t('quick.rated_signed_in')
              : t('quick.rated_restricted')
            : t('quick.rated_sign_in')}
        </p>
      </div>

      <fieldset className="mb-5 min-w-0 border-0 p-0">
        <legend className="text-sm text-text-dim mb-2 block">{t('home.time_control')}</legend>
        {showAllTimes ? (
          <div className="space-y-2">
            {paceGroups.map((group) => {
              const isOpen = openPace === group.pace;
              return (
                <div key={group.pace} className="rounded-xl border border-surface-hover/80 bg-surface/40">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenPace(group.pace)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${
                      isOpen ? 'text-text-bright' : 'text-text-dim hover:text-text-bright'
                    }`}
                  >
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
                      {t(group.nameKey)}
                    </span>
                    <span className="text-xs font-medium tabular-nums text-text-dim">
                      {group.presets.length}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="grid grid-cols-2 gap-2 border-t border-surface-hover/70 p-2 sm:grid-cols-3">
                      {group.presets.map((preset) => (
                        <TimePresetButton
                          key={preset.label}
                          preset={preset}
                          selected={selectedTime.label === preset.label}
                          onSelect={onSelectTime}
                          label={t(preset.nameKey)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {visiblePresets.map((preset) => (
              <TimePresetButton
                key={preset.label}
                preset={preset}
                selected={selectedTime.label === preset.label}
                onSelect={onSelectTime}
                label={t(preset.nameKey)}
              />
            ))}
          </div>
        )}
        {hasHiddenPresets && (
          <button
            type="button"
            onClick={onToggleAllTimes}
            className="mt-2 text-xs font-semibold text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
          >
            {showAllTimes ? t('home.fewer_times') : t('home.more_times')}
          </button>
        )}
      </fieldset>

      <button
        type="button"
        onClick={onFindGame}
        disabled={requestPending}
        className="button-accent-contrast w-full rounded-lg px-6 py-3 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-70"
      >
        {requestPending ? t('common.sending') : t('quick.find')}
      </button>

      {error && (
        <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onBackHome}
        className="ui-btn-secondary mt-3 w-full px-6 py-2"
      >
        {t('common.back_home')}
      </button>
    </div>
  );
}

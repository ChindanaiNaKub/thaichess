import { useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import PieceSVG from './PieceSVG';
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
    <div
      data-testid="quick-play-lobby"
      className="w-full max-w-lg animate-slideUp overflow-hidden rounded-2xl border border-surface-hover/80 bg-surface-alt/90 p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-col items-center text-center">
        <div
          data-testid="quick-play-makruk-mark"
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-surface-hover/70 bg-surface/70 text-text-bright"
          aria-hidden
        >
          <PieceSVG type="K" color="white" size={28} />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-text-bright sm:text-3xl">
          {t('quick.title')}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-text-dim">{t('quick.desc')}</p>
      </div>

      <div className="mb-6 rounded-xl border border-surface-hover/70 bg-surface/55 px-4 py-3 text-center">
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
          user && ratedEligible
            ? 'border border-surface-hover bg-surface-hover text-text-bright'
            : user
              ? 'border border-danger/30 bg-danger/10 text-danger'
              : 'border border-surface-hover bg-surface-hover text-text-dim'
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
        <legend className="mb-2 block text-sm text-text-dim">{t('home.time_control')}</legend>
        {showAllTimes ? (
          <div className="space-y-3" data-testid="quick-play-pace-picker">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label={t('home.time_control')}
            >
              {paceGroups.map((group) => {
                const selected = openPace === group.pace;
                return (
                  <button
                    key={group.pace}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setOpenPace(group.pace)}
                    className={`ui-choice px-3 py-1.5 text-xs font-semibold ${
                      selected ? 'ui-choice-selected' : 'bg-surface-alt/85 text-text-dim hover:text-text-bright'
                    }`}
                  >
                    {t(group.nameKey)}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(paceGroups.find((group) => group.pace === openPace)?.presets ?? []).map((preset) => (
                <TimePresetButton
                  key={preset.label}
                  preset={preset}
                  selected={selectedTime.label === preset.label}
                  onSelect={onSelectTime}
                  label={t(preset.nameKey)}
                />
              ))}
            </div>
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

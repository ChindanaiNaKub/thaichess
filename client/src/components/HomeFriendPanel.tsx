import type { PrivateGameColorPreference } from '@shared/types';
import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from '../lib/i18n';

type TimePreset = {
  label: string;
  nameKey: string;
  initial: number;
  increment: number;
};

const FEATURED_TIME_LABELS = new Set(['3+0', '5+0', '10+0', '15+10']);

export interface HomeFriendPanelProps {
  selectedTime: TimePreset;
  setSelectedTime: (preset: TimePreset) => void;
  selectedColor: PrivateGameColorPreference;
  setSelectedColor: (color: PrivateGameColorPreference) => void;
  isCreating: boolean;
  createError: string | null;
  privatePanel: 'create' | 'join';
  joinId: string;
  setJoinId: (value: string) => void;
  joinError: string | null;
  timePresets: TimePreset[];
  openCreatePanel: () => void;
  openJoinPanel: () => void;
  closePrivatePanel: () => void;
  handleCreateGame: () => void;
  handleJoinGame: () => void;
}

export function HomeFriendPanel({
  selectedTime,
  setSelectedTime,
  selectedColor,
  setSelectedColor,
  isCreating,
  createError,
  privatePanel,
  joinId,
  setJoinId,
  joinError,
  timePresets,
  openCreatePanel,
  openJoinPanel,
  closePrivatePanel,
  handleCreateGame,
  handleJoinGame,
}: HomeFriendPanelProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [showAllTimes, setShowAllTimes] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePrivatePanel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closePrivatePanel]);

  const visiblePresets = useMemo(() => {
    if (showAllTimes) return timePresets;
    return timePresets.filter(
      (preset) =>
        FEATURED_TIME_LABELS.has(preset.label) || preset.label === selectedTime.label,
    );
  }, [selectedTime.label, showAllTimes, timePresets]);

  const hasHiddenPresets = timePresets.length > visiblePresets.length || showAllTimes;

  return (
    <div
      className="mt-6 max-w-md space-y-4 rounded-xl border border-surface-hover/70 bg-surface-alt/90 p-4 backdrop-blur-sm"
      role="region"
      aria-labelledby={titleId}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-3">
          <h2 id={titleId} className="text-base font-semibold text-text-bright">
            {t('home.play_friend')}
          </h2>
          <div className="grid max-w-xs grid-cols-2 rounded-lg border border-surface-hover/70 bg-surface p-1">
            <button
              type="button"
              onClick={openCreatePanel}
              aria-pressed={privatePanel === 'create'}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                privatePanel === 'create'
                  ? 'bg-surface-hover text-text-bright'
                  : 'text-text-dim hover:text-text-bright'
              }`}
            >
              {t('home.create_private')}
            </button>
            <button
              type="button"
              onClick={openJoinPanel}
              aria-pressed={privatePanel === 'join'}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                privatePanel === 'join'
                  ? 'bg-surface-hover text-text-bright'
                  : 'text-text-dim hover:text-text-bright'
              }`}
            >
              {t('home.join_title')}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={closePrivatePanel}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
        >
          {t('common.close')}
        </button>
      </div>

      {privatePanel === 'create' ? (
        <>
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="mb-2 block text-sm text-text-dim">
              {t('home.time_control')}
            </legend>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {visiblePresets.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setSelectedTime(preset)}
                  className={`ui-choice min-h-10 rounded-md px-2 py-2 text-xs font-semibold ${
                    selectedTime.label === preset.label
                      ? 'ui-choice-selected'
                      : 'text-text-dim hover:text-text-bright'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {hasHiddenPresets && (
              <button
                type="button"
                onClick={() => setShowAllTimes((open) => !open)}
                className="mt-2 text-xs font-semibold text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
              >
                {showAllTimes ? t('home.fewer_times') : t('home.more_times')}
              </button>
            )}
          </fieldset>

          <fieldset className="min-w-0 border-0 p-0">
            <legend className="mb-2 block text-sm text-text-dim">
              {t('home.choose_color')}
            </legend>
            <div className="grid grid-cols-3 gap-1.5">
              {(['random', 'white', 'black'] as const).map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`ui-choice min-h-10 rounded-md px-2 py-2 text-xs font-semibold ${
                    selectedColor === color
                      ? 'ui-choice-selected'
                      : 'text-text-dim hover:text-text-bright'
                  }`}
                >
                  {t(`home.color_${color}`)}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleCreateGame}
            disabled={isCreating}
            className="button-accent-contrast w-full rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {isCreating ? t('home.creating') : t('home.play_with_friend')}
          </button>

          {createError && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
              {createError}
            </p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
              placeholder={t('home.join_placeholder')}
              className="min-h-10 flex-1 rounded-lg border border-surface-hover/80 bg-surface px-3 py-2 text-sm text-text-bright"
              autoFocus
              aria-invalid={Boolean(joinError)}
              aria-describedby={joinError ? 'home-join-error' : undefined}
            />
            <button
              type="button"
              onClick={handleJoinGame}
              className="button-accent-contrast rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {t('home.join')}
            </button>
          </div>
          {joinError && (
            <p id="home-join-error" className="text-sm text-danger" role="alert">
              {joinError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import type { PrivateGameColorPreference } from '@shared/types';
import { useTranslation } from '../lib/i18n';

type TimePreset = {
  label: string;
  nameKey: string;
  initial: number;
  increment: number;
};

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
  timePresets: TimePreset[];
  openCreatePanel: () => void;
  openJoinPanel: () => void;
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
  timePresets,
  openCreatePanel,
  openJoinPanel,
  handleCreateGame,
  handleJoinGame,
}: HomeFriendPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 max-w-md space-y-4 rounded-xl border border-surface-hover/70 bg-surface-alt/90 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-text-bright">
          {t('home.play_friend')}
        </h2>
        <div className="grid grid-cols-2 rounded-lg border border-surface-hover/70 bg-surface p-1">
          <button
            type="button"
            onClick={openCreatePanel}
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

      {privatePanel === 'create' ? (
        <>
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="mb-2 block text-sm text-text-dim">
              {t('home.time_control')}
            </legend>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {timePresets.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setSelectedTime(preset)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${
                    selectedTime.label === preset.label
                      ? 'border-accent/40 bg-accent/12 text-accent'
                      : 'border-surface-hover/70 bg-surface text-text-dim hover:text-text-bright'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
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
                  className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${
                    selectedColor === color
                      ? 'border-accent/40 bg-accent/12 text-accent'
                      : 'border-surface-hover/70 bg-surface text-text-dim hover:text-text-bright'
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
            className="button-primary-contrast w-full rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {isCreating ? t('home.creating') : t('home.play_with_friend')}
          </button>

          {createError && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {createError}
            </p>
          )}
        </>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
            placeholder={t('home.join_placeholder')}
            className="flex-1 rounded-lg border border-surface-hover/80 bg-surface px-3 py-2 text-sm text-text-bright"
            autoFocus
          />
          <button
            type="button"
            onClick={handleJoinGame}
            className="rounded-lg border border-primary/35 bg-primary/12 px-4 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/18"
          >
            {t('home.join')}
          </button>
        </div>
      )}
    </div>
  );
}

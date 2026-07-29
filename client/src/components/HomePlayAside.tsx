import type { NavigateFunction } from 'react-router-dom';
import type { PrivateGameColorPreference } from '@shared/types';
import { routes } from '../lib/routes';
import {
  loadBotGameRoute,
  loadLocalGameRoute,
} from '../lib/routePrefetch';
import { useTranslation } from '../lib/i18n';
import FriendSVG from './FriendSVG';
import BotSVG from './BotSVG';
import PuzzleSVG from './PuzzleSVG';
import QuickPlaySVG from './QuickPlaySVG';

type TimePreset = {
  label: string;
  nameKey: string;
  initial: number;
  increment: number;
};

export interface HomePlayAsideProps {
  navigate: NavigateFunction;
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

export function HomePlayAside(props: HomePlayAsideProps) {
  const { t } = useTranslation();
  const {
    navigate, selectedTime, setSelectedTime, selectedColor, setSelectedColor,
    isCreating, createError, privatePanel, joinId, setJoinId, timePresets,
    openCreatePanel, openJoinPanel, handleCreateGame, handleJoinGame,
  } = props;

  return (
            <aside className="grid content-start gap-3">
              <div className="ui-card p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <FriendSVG size={22} className="text-text-bright flex-shrink-0" />
                  <h2 className="text-base font-semibold text-text-bright">{t('home.create_private')}</h2>
                </div>

                <div className="mb-4 grid grid-cols-2 rounded-lg border border-surface-hover/70 bg-surface p-1">
                  <button
                    type="button"
                    onClick={openCreatePanel}
                    className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${privatePanel === 'create' ? 'bg-surface-hover text-text-bright' : 'text-text-dim hover:text-text-bright'}`}
                  >
                    {t('home.create_private')}
                  </button>
                  <button
                    type="button"
                    onClick={openJoinPanel}
                    className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${privatePanel === 'join' ? 'bg-surface-hover text-text-bright' : 'text-text-dim hover:text-text-bright'}`}
                  >
                    {t('home.join_title')}
                  </button>
                </div>

                {privatePanel === 'create' ? (
                  <>
                    <fieldset className="mb-4 min-w-0 border-0 p-0">
                      <legend className="mb-2 block text-sm text-text-dim">{t('home.time_control')}</legend>
                      <div className="grid grid-cols-3 gap-1.5">
                        {timePresets.map((preset) => (
                          <button type="button"
                            key={preset.label}
                            onClick={() => setSelectedTime(preset)}
                            className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${selectedTime.label === preset.label ? 'border-primary/40 bg-primary/12 text-primary-light' : 'border-surface-hover/70 bg-surface text-text-dim hover:text-text-bright'}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className="mb-4 min-w-0 border-0 p-0">
                      <legend className="mb-2 block text-sm text-text-dim">{t('home.choose_color')}</legend>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['random', 'white', 'black'] as const).map((color) => (
                          <button type="button"
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${selectedColor === color ? 'border-primary/40 bg-primary/12 text-primary-light' : 'border-surface-hover/70 bg-surface text-text-dim hover:text-text-bright'}`}
                          >
                            {t(`home.color_${color}`)}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <button type="button"
                      onClick={handleCreateGame}
                      disabled={isCreating}
                      className="button-primary-contrast w-full rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60"
                    >
                      {isCreating ? t('home.creating') : t('home.play_with_friend')}
                    </button>

                    {createError && (
                      <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
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
                    <button type="button"
                      onClick={handleJoinGame}
                      className="rounded-lg border border-primary/35 bg-primary/12 px-4 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/18"
                    >
                      {t('home.join')}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(routes.puzzleStreak)}
                aria-label={`${t('home.puzzles')} ${t('home.puzzles_desc')}`}
                className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3.5 text-left transition-colors hover:bg-primary/12"
              >
                <div className="flex items-start gap-3">
                  <PuzzleSVG size={22} className="mt-0.5 flex-shrink-0 text-primary-light" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-light">{t('home.streak_start')}</div>
                    <div className="mt-1 text-sm font-semibold text-text-bright">{t('home.streak_title')}</div>
                    <div className="mt-1 text-xs text-text-dim">{t('home.puzzles_desc')}</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate(routes.bot)}
                onMouseEnter={() => void loadBotGameRoute()}
                onFocus={() => void loadBotGameRoute()}
                className="ui-card px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <BotSVG size={22} className="text-text-bright flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-text-bright">{t('home.play_bot')}</div>
                      <div className="text-xs text-text-dim">{t('home.play_bot_desc')}</div>
                    </div>
                  </div>
                  <span className="rounded-full border border-primary/25 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary-light">Lv 1-12</span>
                </div>
              </button>

              <div className="ui-card p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-dim">{t('home.learn_eyebrow')}</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <button
                    type="button"
                    onClick={() => navigate(routes.lessons)}
                    className="ui-btn-secondary flex items-center gap-2 px-3 py-2 text-left text-sm"
                  >
                    <PuzzleSVG size={18} className="text-text-dim" />
                    {t('home.lessons')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(routes.watch)}
                    className="ui-btn-secondary flex items-center gap-2 px-3 py-2 text-left text-sm"
                  >
                    <QuickPlaySVG size={18} className="text-text-dim" />
                    {t('home.watch_live')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(routes.local)}
                    onMouseEnter={() => void loadLocalGameRoute()}
                    onFocus={() => void loadLocalGameRoute()}
                    className="ui-btn-secondary px-3 py-2 text-left text-sm"
                  >
                    {t('home.play_local')}
                  </button>
                </div>
              </div>
            </aside>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PUZZLES } from '@shared/puzzlesRuntime';
import { useTranslation } from '../lib/i18n';
import { usePuzzleProgress, usePuzzleProgressSummary } from '../lib/puzzleProgress';
import { puzzleRoute, routes } from '../lib/routes';
import Header from './Header';
import {
  PUZZLE_FILTERS,
  formatPuzzleTag,
  getDifficultyBadgeClasses,
  getPublicPuzzleTitle,
  getPuzzleOriginBadgeClasses,
  getPuzzleOriginLabel,
  getPuzzleSourceLabel,
  puzzlesForFilter,
  type PuzzleListFilter,
} from './PuzzleShared';

export function PuzzleLessonsPage() {
  return usePuzzleLessonsPageScreen();
}

function usePuzzleLessonsPageScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PuzzleListFilter>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const { completedPuzzleIds, completedPuzzleSet } = usePuzzleProgress();
  const puzzleSummary = usePuzzleProgressSummary();

  const difficultyFilteredPuzzles = puzzlesForFilter(filter);
  const availableThemes = Array.from(
    difficultyFilteredPuzzles.reduce((themes, puzzle) => {
      themes.set(puzzle.theme, (themes.get(puzzle.theme) ?? 0) + 1);
      return themes;
    }, new Map<string, number>()),
  )
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });

  useEffect(() => {
    if (themeFilter === 'all') return;
    const themeStillVisible = availableThemes.some(([theme]) => theme === themeFilter);
    if (!themeStillVisible) {
      setThemeFilter('all');
    }
  }, [availableThemes, themeFilter]);

  const filteredPuzzles = themeFilter === 'all'
    ? difficultyFilteredPuzzles
    : difficultyFilteredPuzzles.filter(puzzle => puzzle.theme === themeFilter);
  const completedInFilter = filteredPuzzles.filter(puzzle => completedPuzzleSet.has(puzzle.id));
  const unsolvedInFilter = filteredPuzzles.filter(puzzle => !completedPuzzleSet.has(puzzle.id));
  const sortedFilteredPuzzles = [...unsolvedInFilter, ...completedInFilter];
  const recommendedPuzzle = puzzleSummary.nextPuzzle && filteredPuzzles.some(candidate => candidate.id === puzzleSummary.nextPuzzle?.id)
    ? puzzleSummary.nextPuzzle
    : unsolvedInFilter[0] ?? filteredPuzzles[0] ?? null;
  const filterCompletionPercent = filteredPuzzles.length > 0
    ? Math.round((completedInFilter.length / filteredPuzzles.length) * 100)
    : 0;

  const filterThemeSummary = Array.from(
    filteredPuzzles.reduce((themes, puzzle) => {
      themes.set(puzzle.theme, (themes.get(puzzle.theme) ?? 0) + 1);
      return themes;
    }, new Map<string, number>()),
  )
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 3);

  const filterLabels: Record<PuzzleListFilter, string> = {
    all: t('puzzle.all_lessons'),
    beginner: t('puzzle.beginner'),
    intermediate: t('puzzle.intermediate'),
    advanced: t('puzzle.advanced'),
  };

  const filterDescriptions: Record<PuzzleListFilter, string> = {
    all: t('puzzle.filter_all_desc'),
    beginner: t('puzzle.filter_beginner_desc'),
    intermediate: t('puzzle.filter_intermediate_desc'),
    advanced: t('puzzle.filter_advanced_desc'),
  };

  const selectionLabel = themeFilter === 'all'
    ? filterLabels[filter]
    : `${filterLabels[filter]} · ${t(`theme.${themeFilter}`)}`;

  const emptyTitle = themeFilter === 'all'
    ? t('puzzle.empty_title')
    : t('puzzle.empty_theme_title', { theme: t(`theme.${themeFilter}`) });

  const emptyDesc = themeFilter === 'all'
    ? t('puzzle.empty_desc')
    : t('puzzle.empty_theme_desc', { theme: t(`theme.${themeFilter}`), track: filterLabels[filter] });

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:h-screen lg:overflow-hidden">
      <Header
        active="puzzles"
        subtitle={t('puzzle.lessons_nav')}
      />

      <main id="main-content" className="flex-1 px-4 py-6 sm:py-8 max-w-5xl mx-auto w-full">
        <div className="grid gap-4 mb-6 sm:mb-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
          <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-alt to-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary/80 mb-2">{t('puzzle.lessons_eyebrow')}</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-bright mb-2">{t('puzzle.lessons_title')}</h2>
                <p className="text-text-dim text-sm sm:text-base max-w-2xl">
                  {t('puzzle.lessons_desc')}
                </p>
              </div>
              <div className="rounded-xl border border-primary/25 bg-surface/80 px-4 py-3 min-w-[168px]">
                <p className="text-xs uppercase tracking-[0.18em] text-text-dim mb-1">{t('puzzle.completed_summary')}</p>
                <p className="text-xl font-semibold text-text-bright">
                  {t('puzzle.completed', { done: completedPuzzleIds.length, total: PUZZLES.length })}
                </p>
                <p className="text-xs text-text-dim mt-1">{t('puzzle.progress_hint')}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-text-bright font-medium">
                  {t('puzzle.track_progress', { track: selectionLabel })}
                </p>
                <p className="text-text-dim">
                  {t('puzzle.track_completed', { done: completedInFilter.length, total: filteredPuzzles.length })}
                </p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${filterCompletionPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-surface-hover bg-surface/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-dim mb-1">{t('puzzle.filter_label')}</p>
                <p className="font-semibold text-text-bright">{selectionLabel}</p>
                <p className="text-xs text-text-dim mt-1">{filterDescriptions[filter]}</p>
              </div>
              <div className="rounded-xl border border-surface-hover bg-surface/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-dim mb-1">{t('puzzle.remaining_label')}</p>
                <p className="font-semibold text-text-bright">{unsolvedInFilter.length}</p>
                <p className="text-xs text-text-dim mt-1">{t('puzzle.remaining_desc')}</p>
              </div>
              <div className="rounded-xl border border-surface-hover bg-surface/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-dim mb-1">{t('puzzle.focus_label')}</p>
                <p className="font-semibold text-text-bright">
                  {filterThemeSummary.length > 0
                    ? filterThemeSummary.map(([theme]) => t(`theme.${theme}`)).join(' · ')
                    : t('puzzle.focus_empty')}
                </p>
                <p className="text-xs text-text-dim mt-1">{t('puzzle.focus_desc')}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-surface-hover bg-surface-alt p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80 mb-2">{t('puzzle.next_up')}</p>
            {recommendedPuzzle ? (
              <>
                <h3 className="text-xl font-semibold text-text-bright">
                  #{recommendedPuzzle.id} · {getPublicPuzzleTitle(recommendedPuzzle.title)}
                </h3>
                <p className="text-sm text-text-dim mt-2">{recommendedPuzzle.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`text-xs px-2 py-1 rounded border ${getDifficultyBadgeClasses(recommendedPuzzle.difficulty)}`}>
                    {t(`puzzle.${recommendedPuzzle.difficulty}`)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-surface border border-surface-hover text-text-dim">
                    {t(`theme.${recommendedPuzzle.theme}`)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-surface border border-surface-hover text-text-dim">
                    {t('puzzle.rating_short', { score: recommendedPuzzle.difficultyScore })}
                  </span>
                </div>
                <p className="text-xs text-text-dim mt-4">
                  {completedPuzzleSet.has(recommendedPuzzle.id)
                    ? t('puzzle.next_up_review')
                    : t('puzzle.next_up_fresh')}
                </p>
                <button type="button"
                  onClick={() => navigate(puzzleRoute(String(recommendedPuzzle.id)))}
                  className="mt-4 w-full rounded-xl bg-primary hover:bg-primary-light text-white font-semibold px-4 py-3 transition-colors"
                >
                  {completedPuzzleSet.has(recommendedPuzzle.id) ? t('common.retry') : t('puzzle.start_here')}
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-surface-hover bg-surface/70 px-4 py-4">
                <h3 className="text-lg font-semibold text-text-bright">{emptyTitle}</h3>
                <p className="text-sm text-text-dim mt-2">{emptyDesc}</p>
              </div>
            )}
          </aside>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-text-bright">{t('puzzle.lessons_tracks_title')}</h3>
            <p className="text-sm text-text-dim mt-1">{t('puzzle.lessons_tracks_desc')}</p>
          </div>
          <button type="button"
            onClick={() => navigate(routes.puzzleStreak)}
            className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/15"
          >
            {t('puzzle.play_streak')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-4">
          {PUZZLE_FILTERS.map(f => (
            <button type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                filter === f
                  ? 'bg-primary/15 border-primary/40 text-text-bright shadow-lg shadow-primary/10'
                  : 'bg-surface-alt hover:bg-surface-hover text-text border-surface-hover'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{filterLabels[f]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  filter === f ? 'border-primary/40 text-primary-light' : 'border-surface-hover text-text-dim'
                }`}>
                  {puzzlesForFilter(f).length}
                </span>
              </div>
              <p className={`mt-1 text-xs ${filter === f ? 'text-text' : 'text-text-dim'}`}>
                {filterDescriptions[f]}
              </p>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-text-bright">{t('puzzle.theme_drill_title')}</h3>
              <p className="text-sm text-text-dim mt-1">{t('puzzle.theme_drill_desc')}</p>
            </div>
            <p className="text-sm text-text-dim">
              {t('puzzle.theme_drill_count', { count: availableThemes.length })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button"
              onClick={() => setThemeFilter('all')}
              className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                themeFilter === 'all'
                  ? 'bg-primary/15 border-primary/40 text-text-bright'
                  : 'bg-surface-alt border-surface-hover text-text hover:bg-surface-hover'
              }`}
            >
              {t('puzzle.theme_all')}
            </button>
            {availableThemes.map(([theme, count]) => (
              <button type="button"
                key={theme}
                onClick={() => setThemeFilter(theme)}
                className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                  themeFilter === theme
                    ? 'bg-primary/15 border-primary/40 text-text-bright'
                    : 'bg-surface-alt border-surface-hover text-text hover:bg-surface-hover'
                }`}
              >
                {t(`theme.${theme}`)} <span className="text-text-dim">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-text-bright">{t('puzzle.practice_title')}</h3>
            <p className="text-sm text-text-dim mt-1">{t('puzzle.practice_desc')}</p>
          </div>
          {filteredPuzzles.length > 0 && (
            <p className="text-sm text-text-dim">
              {t('puzzle.track_completed', { done: completedInFilter.length, total: filteredPuzzles.length })}
            </p>
          )}
        </div>

        {filteredPuzzles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-hover bg-surface-alt p-8 text-center">
            <h3 className="text-xl font-semibold text-text-bright">{emptyTitle}</h3>
            <p className="text-sm text-text-dim mt-2">{emptyDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedFilteredPuzzles.map((puzzle, index) => {
              const isCompleted = completedPuzzleSet.has(puzzle.id);
              const isRecommended = recommendedPuzzle?.id === puzzle.id && !isCompleted && index === 0;

              return (
                <button type="button"
                  key={puzzle.id}
                  onClick={() => navigate(puzzleRoute(String(puzzle.id)))}
                  className={`rounded-2xl p-4 sm:p-5 text-left transition-colors group border ${
                    isRecommended
                      ? 'bg-primary/10 border-primary/35 hover:border-primary/55 shadow-lg shadow-primary/10'
                      : isCompleted
                        ? 'bg-surface-alt/80 border-surface-hover hover:border-primary/35'
                        : 'bg-surface-alt border-surface-hover hover:border-primary/50 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {isRecommended && (
                          <span className="text-[11px] uppercase tracking-[0.18em] text-primary-light bg-primary/15 border border-primary/30 rounded-full px-2 py-1">
                            {t('puzzle.start_here')}
                          </span>
                        )}
                        <span className={`text-[11px] uppercase tracking-[0.18em] rounded-full px-2 py-1 border ${
                          isCompleted
                            ? 'text-primary border-primary/30 bg-primary/10'
                            : 'text-text-dim border-surface-hover bg-surface'
                        }`}>
                          {isCompleted ? t('puzzle.solved_badge') : t('puzzle.new_badge')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-text-bright group-hover:text-primary-light transition-colors text-sm sm:text-base">
                        #{puzzle.id} · {getPublicPuzzleTitle(puzzle.title)}
                      </h3>
                    </div>
                    {isCompleted && (
                      <span className="text-primary text-sm font-bold">✓</span>
                    )}
                  </div>
                  <p className="text-text-dim text-xs sm:text-sm mb-3">{puzzle.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${getDifficultyBadgeClasses(puzzle.difficulty)}`}>
                      {t(`puzzle.${puzzle.difficulty}`)}
                    </span>
                    <span className="text-xs text-text-dim px-2 py-0.5 rounded bg-surface border border-surface-hover">
                      {t(`theme.${puzzle.theme}`)}
                    </span>
                    <span className="text-xs text-text-dim px-2 py-0.5 rounded bg-surface border border-surface-hover">
                      {t('puzzle.rating_short', { score: puzzle.difficultyScore })}
                    </span>
                    {puzzle.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs text-text-dim px-2 py-0.5 rounded bg-surface border border-surface-hover">
                        {formatPuzzleTag(tag)}
                      </span>
                    ))}
                    <span className={`text-xs px-2 py-0.5 rounded border ${getPuzzleOriginBadgeClasses(puzzle.origin)}`}>
                      {getPuzzleOriginLabel(puzzle, t)}
                    </span>
                    <span className="text-xs text-text-dim px-2 py-0.5 rounded bg-surface border border-surface-hover">
                      {getPuzzleSourceLabel(puzzle.source, t)}
                    </span>
                    <span className="text-xs text-text-dim ml-auto">
                      {t('puzzle.to_move', { color: puzzle.sideToMove === 'white' ? t('common.white') : t('common.black') })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

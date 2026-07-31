import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { usePuzzleProgress, usePuzzleProgressSummary } from '../lib/puzzleProgress';
import { puzzleRoute, routes } from '../lib/routes';
import Header from './Header';
import {
  PUZZLE_FILTERS,
  getPublicPuzzleTitle,
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
  const { completedPuzzleSet } = usePuzzleProgress();
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
    : difficultyFilteredPuzzles.filter((puzzle) => puzzle.theme === themeFilter);
  const completedInFilter = filteredPuzzles.filter((puzzle) => completedPuzzleSet.has(puzzle.id));
  const unsolvedInFilter = filteredPuzzles.filter((puzzle) => !completedPuzzleSet.has(puzzle.id));
  const sortedFilteredPuzzles = [...unsolvedInFilter, ...completedInFilter];
  const recommendedPuzzle = puzzleSummary.nextPuzzle && filteredPuzzles.some((candidate) => candidate.id === puzzleSummary.nextPuzzle?.id)
    ? puzzleSummary.nextPuzzle
    : unsolvedInFilter[0] ?? filteredPuzzles[0] ?? null;

  const filterLabels: Record<PuzzleListFilter, string> = {
    all: t('puzzle.all_lessons'),
    beginner: t('puzzle.beginner'),
    intermediate: t('puzzle.intermediate'),
    advanced: t('puzzle.advanced'),
  };

  const emptyTitle = themeFilter === 'all'
    ? t('puzzle.empty_title')
    : t('puzzle.empty_theme_title', { theme: t(`theme.${themeFilter}`) });

  const emptyDesc = themeFilter === 'all'
    ? t('puzzle.empty_desc')
    : t('puzzle.empty_theme_desc', { theme: t(`theme.${themeFilter}`), track: filterLabels[filter] });

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        active="puzzles"
        subtitle={t('puzzle.lessons_nav')}
        right={(
          <button
            type="button"
            onClick={() => navigate(routes.puzzleStreak)}
            className="text-sm text-text-dim transition-colors hover:text-text-bright"
          >
            {t('puzzle.play_streak')}
          </button>
        )}
      />

      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-text-bright sm:text-4xl">
            {t('puzzle.lessons_title')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-dim sm:text-base">
            {t('puzzle.lessons_desc')}
          </p>
          <p className="mt-4 text-sm text-text-dim">
            {t('puzzle.track_completed', {
              done: completedInFilter.length,
              total: filteredPuzzles.length,
            })}
          </p>
        </header>

        {recommendedPuzzle && (
          <section className="ui-card mt-8 p-5 sm:p-6">
            <h2 className="text-xl font-bold tracking-tight text-text-bright">
              #{recommendedPuzzle.id} · {getPublicPuzzleTitle(recommendedPuzzle.title)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-dim">
              {recommendedPuzzle.description}
            </p>
            <p className="mt-3 text-sm text-text-dim">
              {t(`puzzle.${recommendedPuzzle.difficulty}`)}
              {' · '}
              {t(`theme.${recommendedPuzzle.theme}`)}
              {' · '}
              {t('puzzle.rating_short', { score: recommendedPuzzle.difficultyScore })}
            </p>
            <button
              type="button"
              onClick={() => navigate(puzzleRoute(String(recommendedPuzzle.id)))}
              className="button-accent-contrast mt-5 rounded-[0.6rem] px-5 py-3 text-sm font-bold"
            >
              {completedPuzzleSet.has(recommendedPuzzle.id) ? t('common.retry') : t('puzzle.start_here')}
            </button>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label={t('puzzle.filter_label')}>
          {PUZZLE_FILTERS.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-[0.6rem] px-3 py-2 text-sm font-medium transition-colors ${
                filter === f
                  ? 'border border-accent/40 bg-accent/15 text-text-bright'
                  : 'ui-btn-secondary'
              }`}
            >
              {filterLabels[f]}
              <span className="ml-2 text-text-dim">{puzzlesForFilter(f).length}</span>
            </button>
          ))}
        </div>

        {availableThemes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('puzzle.theme_drill_title')}>
            <button
              type="button"
              onClick={() => setThemeFilter('all')}
              className={`rounded-[0.6rem] px-3 py-1.5 text-sm transition-colors ${
                themeFilter === 'all'
                  ? 'border border-accent/40 bg-accent/15 text-text-bright'
                  : 'border border-surface-hover bg-surface text-text-dim hover:bg-surface-hover hover:text-text-bright'
              }`}
            >
              {t('puzzle.theme_all')}
            </button>
            {availableThemes.map(([theme, count]) => (
              <button
                type="button"
                key={theme}
                onClick={() => setThemeFilter(theme)}
                className={`rounded-[0.6rem] px-3 py-1.5 text-sm transition-colors ${
                  themeFilter === theme
                    ? 'border border-accent/40 bg-accent/15 text-text-bright'
                    : 'border border-surface-hover bg-surface text-text-dim hover:bg-surface-hover hover:text-text-bright'
                }`}
              >
                {t(`theme.${theme}`)}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            ))}
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight text-text-bright">
            {t('puzzle.practice_title')}
          </h2>

          {filteredPuzzles.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-surface-hover/80 px-5 py-8 text-center">
              <p className="text-lg font-semibold text-text-bright">{emptyTitle}</p>
              <p className="mt-2 text-sm text-text-dim">{emptyDesc}</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-surface-hover/70 border-y border-surface-hover/70">
              {sortedFilteredPuzzles.map((puzzle) => {
                const isCompleted = completedPuzzleSet.has(puzzle.id);
                const isRecommended = recommendedPuzzle?.id === puzzle.id && !isCompleted;

                return (
                  <li key={puzzle.id}>
                    <button
                      type="button"
                      onClick={() => navigate(puzzleRoute(String(puzzle.id)))}
                      className="flex w-full flex-col gap-1 py-4 text-left transition-colors hover:bg-surface-hover/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text-bright">
                          #{puzzle.id} · {getPublicPuzzleTitle(puzzle.title)}
                          {isRecommended && (
                            <span className="ml-2 text-sm font-medium text-accent">
                              {t('puzzle.start_here')}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-text-dim">{puzzle.description}</p>
                        <p className="mt-1 text-xs text-text-dim">
                          {t(`puzzle.${puzzle.difficulty}`)}
                          {' · '}
                          {t(`theme.${puzzle.theme}`)}
                          {' · '}
                          {t('puzzle.rating_short', { score: puzzle.difficultyScore })}
                          {' · '}
                          {t('puzzle.to_move', {
                            color: puzzle.sideToMove === 'white' ? t('common.white') : t('common.black'),
                          })}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm font-medium ${
                        isCompleted ? 'text-accent' : 'text-text-dim'
                      }`}>
                        {isCompleted ? t('puzzle.solved_badge') : t('puzzle.new_badge')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

import { Fragment, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '../lib/routes';
import { useTranslation } from '../lib/i18n';
import * as puzzleProgress from '../lib/puzzleProgress';
import PuzzleSVG from './PuzzleSVG';

function getPublicPuzzleTitle(title: string): string {
  return title
    .replace(/\s*\([0-9a-f]{8}\s*@\s*ply\s*\d+\)$/i, '')
    .replace(/^Real-Game\s+/i, '')
    .trim();
}

function HomePuzzleProgressCardContent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const summary = puzzleProgress.usePuzzleProgressSummary();
  const latestSolvedPuzzle = summary.recentCompleted[0]?.puzzle ?? null;
  const lastPlayedPuzzle = summary.lastPlayed?.puzzle ?? null;

  return (
    <button
      type="button"
      onClick={() => navigate(routes.puzzles)}
      aria-label={`${t('home.puzzles')} ${t('home.puzzles_desc')}`}
      className="bg-primary/10 border border-primary/25 rounded-xl px-4 py-4 text-left transition-colors hover:bg-primary/15"
    >
      <div className="flex items-start gap-3">
        <PuzzleSVG size={24} className="text-primary-light flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-light">
            {summary.attemptCount > 0 ? t('home.streak_continue') : t('home.streak_start')}
          </div>
          <div className="mt-1 text-text-bright text-[1rem] font-semibold">
            {t('home.streak_title')}
          </div>
          <div className="mt-1 text-text-dim text-xs sm:text-sm">
            {t('home.streak_progress', {
              done: summary.completedCount,
              total: summary.totalCount,
            })}
          </div>
          {summary.favoriteTheme && (
            <div className="mt-2 text-text-dim text-xs sm:text-sm">
              {t('home.streak_focus', { theme: t(`theme.${summary.favoriteTheme}`) })}
            </div>
          )}
          {lastPlayedPuzzle && summary.lastPlayed?.completedAt === null && (
            <div className="mt-2 text-text-dim text-xs sm:text-sm">
              {t('home.streak_resume', { title: getPublicPuzzleTitle(lastPlayedPuzzle.title) })}
            </div>
          )}
          {latestSolvedPuzzle && (
            <div className="mt-2 text-text-dim text-xs sm:text-sm">
              {t('home.streak_recent', { title: getPublicPuzzleTitle(latestSolvedPuzzle.title) })}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function HomePuzzleProgressCard() {
  let Provider: typeof Fragment | ((props: { children: ReactNode }) => ReactNode) = Fragment;

  try {
    Provider = puzzleProgress.PuzzleProgressProvider ?? Fragment;
  } catch {
    Provider = Fragment;
  }

  return (
    <Provider>
      <HomePuzzleProgressCardContent />
    </Provider>
  );
}

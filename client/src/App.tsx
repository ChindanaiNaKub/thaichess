import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import { scheduleOnUserIntent } from './lib/defer';
import { ensureEnglishExtraTranslations } from './lib/i18n';
import { routes } from './lib/routes';
import { SeoHeadManager } from './lib/seo';

function lazyRoute<TModule extends { default: ComponentType<any> }>(
  loader: () => Promise<TModule>,
) {
  return lazy(async () => {
    const [module] = await Promise.all([loader(), ensureEnglishExtraTranslations()]);
    return module;
  });
}

function lazyNamedRoute<TModule, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey,
) {
  return lazy(async () => {
    const [module] = await Promise.all([loader(), ensureEnglishExtraTranslations()]);
    return { default: module[exportName] as ComponentType<any> };
  });
}

// Lazy load route components for code splitting
const GamePage = lazyRoute(() => import('./components/GamePage'));
const SpectatorPage = lazyRoute(() => import('./components/SpectatorPage'));
const LiveGamesPage = lazyRoute(() => import('./components/LiveGamesPage'));
const LocalGame = lazyRoute(() => import('./components/LocalGame'));
const BotGame = lazyRoute(() => import('./components/BotGame'));
const PuzzleStreakPage = lazyNamedRoute(() => import('./routes/PuzzleRoutes'), 'PuzzleStreakRoute');
const LessonCoursePage = lazyNamedRoute(() => import('./routes/LessonsRoutes'), 'LessonCourseRoute');
const LessonPlayerPage = lazyNamedRoute(() => import('./routes/LessonsRoutes'), 'LessonPlayerRoute');
const PuzzlePlayer = lazyNamedRoute(() => import('./routes/PuzzleRoutes'), 'PuzzlePlayerRoute');
const QuickPlay = lazyRoute(() => import('./components/QuickPlay'));
const AboutPage = lazyRoute(() => import('./components/AboutPage'));
const GamesPage = lazyRoute(() => import('./components/GamesPage'));
const LeaderboardPage = lazyRoute(() => import('./components/LeaderboardPage'));
const GuidePage = lazyRoute(() => import('./components/GuidePage'));
const AnalysisPage = lazyRoute(() => import('./components/AnalysisPage'));
const FeedbackMessagesPage = lazyRoute(() => import('./components/FeedbackMessagesPage'));
const FairPlayCasesPage = lazyRoute(() => import('./components/FairPlayCasesPage'));
const LoginPage = lazyRoute(() => import('./components/LoginPage'));
const AccountPage = lazyRoute(() => import('./routes/AccountRoute'));
const AppearanceSettingsPage = lazyRoute(() => import('./components/AppearanceSettingsPage'));
const FeedbackWidget = lazyRoute(() => import('./components/FeedbackWidget'));

// Shared loading fallback component
function RouteFallback() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-text-dim text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [showFeedbackWidget, setShowFeedbackWidget] = useState(import.meta.env.MODE === 'test');

  useEffect(() => {
    if (showFeedbackWidget || typeof window === 'undefined') {
      return;
    }

    return scheduleOnUserIntent(() => setShowFeedbackWidget(true), 12_000);
  }, [showFeedbackWidget]);

  return (
    <div className="min-h-screen bg-surface">
      <SeoHeadManager />
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path={routes.home} element={<HomePage />} />
          <Route path={routes.liveGamePattern} element={<GamePage />} />
          <Route path={routes.spectatorGamePattern} element={<SpectatorPage />} />
          <Route path={routes.watch} element={<LiveGamesPage />} />
          <Route path={routes.local} element={<LocalGame />} />
          <Route path={routes.bot} element={<BotGame />} />
          <Route path={routes.puzzles} element={<PuzzleStreakPage />} />
          <Route path={routes.lessons} element={<LessonCoursePage />} />
          <Route path={routes.course} element={<LessonCoursePage />} />
          <Route path={routes.coursePath} element={<LessonCoursePage />} />
          <Route path={routes.legacyLearn} element={<LessonCoursePage />} />
          <Route path={routes.lessonPattern} element={<LessonPlayerPage />} />
          <Route path={routes.coursePattern} element={<LessonPlayerPage />} />
          <Route path={routes.legacyLessonPattern} element={<LessonPlayerPage />} />
          <Route path={routes.puzzlePattern} element={<PuzzlePlayer />} />
          <Route path={routes.quickPlay} element={<QuickPlay />} />
          <Route path={routes.about} element={<AboutPage />} />
          <Route path={routes.games} element={<GamesPage />} />
          <Route path={routes.leaderboard} element={<LeaderboardPage />} />
          <Route path={routes.whatIsMakruk} element={<GuidePage slug="what-is-makruk" />} />
          <Route path={routes.howToPlayMakruk} element={<GuidePage slug="how-to-play-makruk" />} />
          <Route path={routes.playMakrukOnline} element={<GuidePage slug="play-makruk-online" />} />
          <Route path={routes.analysisPattern} element={<AnalysisPage />} />
          <Route path={routes.analysisRoot} element={<AnalysisPage />} />
          <Route path={routes.feedback} element={<FeedbackMessagesPage />} />
          <Route path={routes.fairPlay} element={<FairPlayCasesPage />} />
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.account} element={<AccountPage />} />
          <Route path={routes.appearanceSettings} element={<AppearanceSettingsPage />} />
        </Routes>
      </Suspense>
      {showFeedbackWidget ? (
        <Suspense fallback={null}>
          <FeedbackWidget />
        </Suspense>
      ) : null}
    </div>
  );
}

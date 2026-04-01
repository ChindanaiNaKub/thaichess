import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import FeedbackWidget from './components/FeedbackWidget';
import { routes } from './lib/routes';
import { SeoHeadManager } from './lib/seo';

// Lazy load route components for code splitting
const GamePage = lazy(() => import('./components/GamePage'));
const SpectatorPage = lazy(() => import('./components/SpectatorPage'));
const LiveGamesPage = lazy(() => import('./components/LiveGamesPage'));
const LocalGame = lazy(() => import('./components/LocalGame'));
const BotGame = lazy(() => import('./components/BotGame'));
const PuzzleStreakPage = lazy(() => import('./components/PuzzlePage').then(m => ({ default: m.PuzzleStreakPage })));
const LessonCoursePage = lazy(() => import('./components/LessonsPage').then(m => ({ default: m.LessonCoursePage })));
const LessonPlayerPage = lazy(() => import('./components/LessonsPage').then(m => ({ default: m.LessonPlayerPage })));
const PuzzlePlayer = lazy(() => import('./components/PuzzlePage').then(m => ({ default: m.PuzzlePlayer })));
const QuickPlay = lazy(() => import('./components/QuickPlay'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const GamesPage = lazy(() => import('./components/GamesPage'));
const LeaderboardPage = lazy(() => import('./components/LeaderboardPage'));
const GuidePage = lazy(() => import('./components/GuidePage'));
const AnalysisPage = lazy(() => import('./components/AnalysisPage'));
const FeedbackMessagesPage = lazy(() => import('./components/FeedbackMessagesPage'));
const FairPlayCasesPage = lazy(() => import('./components/FairPlayCasesPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const AccountPage = lazy(() => import('./components/AccountPage'));
const AppearanceSettingsPage = lazy(() => import('./components/AppearanceSettingsPage'));

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
      <FeedbackWidget />
    </div>
  );
}

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import FeedbackWidget from './components/FeedbackWidget';
import { SeoHeadManager } from './lib/seo';

// Lazy load route components for code splitting
const GamePage = lazy(() => import('./components/GamePage'));
const LocalGame = lazy(() => import('./components/LocalGame'));
const BotGame = lazy(() => import('./components/BotGame'));
const PuzzleListPage = lazy(() => import('./components/PuzzlePage').then(m => ({ default: m.PuzzleListPage })));
const PuzzlePlayer = lazy(() => import('./components/PuzzlePage').then(m => ({ default: m.PuzzlePlayer })));
const QuickPlay = lazy(() => import('./components/QuickPlay'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const GamesPage = lazy(() => import('./components/GamesPage'));
const LeaderboardPage = lazy(() => import('./components/LeaderboardPage'));
const AnalysisPage = lazy(() => import('./components/AnalysisPage'));
const FeedbackMessagesPage = lazy(() => import('./components/FeedbackMessagesPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const AccountPage = lazy(() => import('./components/AccountPage'));

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
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/local" element={<LocalGame />} />
          <Route path="/bot" element={<BotGame />} />
          <Route path="/puzzles" element={<PuzzleListPage />} />
          <Route path="/puzzle/:id" element={<PuzzlePlayer />} />
          <Route path="/quick-play" element={<QuickPlay />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/analysis/:gameId" element={<AnalysisPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/feedback" element={<FeedbackMessagesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </Suspense>
      <FeedbackWidget />
    </div>
  );
}

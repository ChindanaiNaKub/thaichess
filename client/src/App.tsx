import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';
import LocalGame from './components/LocalGame';
import BotGame from './components/BotGame';
import { PuzzleListPage, PuzzlePlayer } from './components/PuzzlePage';
import QuickPlay from './components/QuickPlay';
import AboutPage from './components/AboutPage';
import GamesPage from './components/GamesPage';
import AnalysisPage from './components/AnalysisPage';
import FeedbackMessagesPage from './components/FeedbackMessagesPage';
import FeedbackWidget from './components/FeedbackWidget';

export default function App() {
  return (
    <div className="min-h-screen bg-surface">
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
        <Route path="/analysis/:gameId" element={<AnalysisPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/feedback" element={<FeedbackMessagesPage />} />
      </Routes>
      <FeedbackWidget />
    </div>
  );
}

import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';
import LocalGame from './components/LocalGame';
import AboutPage from './components/AboutPage';
import GamesPage from './components/GamesPage';
import FeedbackWidget from './components/FeedbackWidget';

export default function App() {
  return (
    <div className="min-h-screen bg-surface">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/local" element={<LocalGame />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/games" element={<GamesPage />} />
      </Routes>
      <FeedbackWidget />
    </div>
  );
}

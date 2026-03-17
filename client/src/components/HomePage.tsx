import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket, connectSocket } from '../lib/socket';
import PieceSVG from './PieceSVG';
import type { PieceType, PieceColor } from '@shared/types';

const TIME_PRESETS = [
  { label: '1+0', name: 'Bullet', initial: 60, increment: 0 },
  { label: '3+0', name: 'Blitz', initial: 180, increment: 0 },
  { label: '3+2', name: 'Blitz', initial: 180, increment: 2 },
  { label: '5+0', name: 'Blitz', initial: 300, increment: 0 },
  { label: '5+3', name: 'Rapid', initial: 300, increment: 3 },
  { label: '10+0', name: 'Rapid', initial: 600, increment: 0 },
  { label: '10+5', name: 'Rapid', initial: 600, increment: 5 },
  { label: '15+10', name: 'Classical', initial: 900, increment: 10 },
  { label: '30+0', name: 'Classical', initial: 1800, increment: 0 },
];

const SHOWCASE_PIECES: { type: PieceType; color: PieceColor }[] = [
  { type: 'R', color: 'white' },
  { type: 'N', color: 'white' },
  { type: 'S', color: 'white' },
  { type: 'M', color: 'white' },
  { type: 'K', color: 'white' },
  { type: 'P', color: 'white' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState(TIME_PRESETS[3]); // 5+0 default
  const [isCreating, setIsCreating] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleCreateGame = () => {
    setIsCreating(true);
    connectSocket();

    const handleCreated = ({ gameId }: { gameId: string }) => {
      socket.off('game_created', handleCreated);
      navigate(`/game/${gameId}`);
    };

    socket.on('game_created', handleCreated);

    socket.once('connect', () => {
      socket.emit('create_game', {
        timeControl: { initial: selectedTime.initial, increment: selectedTime.increment },
      });
    });

    if (socket.connected) {
      socket.emit('create_game', {
        timeControl: { initial: selectedTime.initial, increment: selectedTime.increment },
      });
    }
  };

  const handleJoinGame = () => {
    if (!joinId.trim()) return;
    navigate(`/game/${joinId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-surface-alt border-b border-surface-hover">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <PieceSVG type="K" color="white" size={36} />
              <h1 className="text-xl font-bold text-text-bright tracking-tight">Makruk</h1>
            </div>
            <span className="text-text-dim text-sm hidden sm:inline">Thai Chess Online</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <span className="text-primary font-medium">Play</span>
            <button onClick={() => navigate('/games')} className="text-text-dim hover:text-text-bright transition-colors">Games</button>
            <button onClick={() => navigate('/about')} className="text-text-dim hover:text-text-bright transition-colors">About</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-1 mb-4">
            {SHOWCASE_PIECES.map((p, i) => (
              <div key={i} className="opacity-80 hover:opacity-100 transition-opacity">
                <PieceSVG type={p.type} color={p.color} size={48} />
              </div>
            ))}
          </div>
          <h2 className="text-4xl font-bold text-text-bright mb-2">Play Makruk Online</h2>
          <p className="text-text-dim text-lg max-w-md mx-auto">
            The ancient Thai game of chess. Free, no registration required.
            Create a game and share the link with a friend.
          </p>
        </div>

        {/* Create Game Card */}
        <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 w-full max-w-lg mb-6 animate-slideUp">
          <h3 className="text-lg font-semibold text-text-bright mb-4">Create a Game</h3>

          {/* Time Control */}
          <div className="mb-5">
            <label className="text-sm text-text-dim mb-2 block">Time Control</label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setSelectedTime(preset)}
                  className={`
                    py-2 px-3 rounded-lg text-sm font-medium transition-all
                    ${selectedTime.label === preset.label
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface hover:bg-surface-hover text-text border border-surface-hover'
                    }
                  `}
                >
                  <div className="font-bold">{preset.label}</div>
                  <div className="text-xs opacity-70">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateGame}
            disabled={isCreating}
            className="w-full py-3 px-6 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-lg text-lg transition-colors shadow-md"
          >
            {isCreating ? 'Creating...' : 'Play with a Friend'}
          </button>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-hover" />
            <span className="text-text-dim text-xs">or</span>
            <div className="flex-1 h-px bg-surface-hover" />
          </div>

          <button
            onClick={() => navigate('/local')}
            className="w-full mt-3 py-2 px-6 bg-surface hover:bg-surface-hover text-text border border-surface-hover font-medium rounded-lg transition-colors"
          >
            Play Locally (Same Screen)
          </button>
        </div>

        {/* Join Game */}
        <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 w-full max-w-lg animate-slideUp">
          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full text-center text-text-dim hover:text-text-bright transition-colors text-sm"
            >
              Have a game code? <span className="underline">Join a game</span>
            </button>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-text-bright mb-3">Join a Game</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                  placeholder="Enter game code..."
                  className="flex-1 bg-surface border border-surface-hover rounded-lg px-4 py-2 text-text-bright focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
                <button
                  onClick={handleJoinGame}
                  className="px-6 py-2 bg-accent hover:bg-accent/80 text-white font-semibold rounded-lg transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rules Section */}
        <div className="mt-10 max-w-lg w-full">
          <details className="bg-surface-alt border border-surface-hover rounded-xl overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer text-text-bright font-semibold hover:bg-surface-hover transition-colors">
              📜 How to Play Makruk
            </summary>
            <div className="px-6 pb-5 text-text-dim text-sm space-y-3">
              <p>Makruk (Thai Chess) is the traditional chess of Thailand, closely related to the original Indian game of chess.</p>

              <div>
                <strong className="text-text-bright">Pieces:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Khun (King)</strong> – Moves 1 square in any direction</li>
                  <li><strong>Met (Queen)</strong> – Moves 1 square diagonally</li>
                  <li><strong>Khon (Bishop)</strong> – Moves 1 square diagonally or 1 forward</li>
                  <li><strong>Rua (Rook)</strong> – Moves any distance horizontally/vertically</li>
                  <li><strong>Ma (Knight)</strong> – Moves in an L-shape (like chess)</li>
                  <li><strong>Bia (Pawn)</strong> – Moves 1 forward, captures diagonally</li>
                </ul>
              </div>

              <div>
                <strong className="text-text-bright">Special Rules:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Pawns start on the 3rd rank (not 2nd)</li>
                  <li>Pawns promote to Met when reaching the 6th rank</li>
                  <li>No castling, no en passant, no double pawn step</li>
                  <li>Checkmate wins the game</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-alt border-t border-surface-hover py-4 text-center text-text-dim text-sm">
        Makruk Online — Free & Open Source — Inspired by{' '}
        <a href="https://lichess.org" target="_blank" rel="noopener" className="text-primary hover:text-primary-light">
          Lichess
        </a>
      </footer>
    </div>
  );
}

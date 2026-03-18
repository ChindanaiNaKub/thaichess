import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket, connectSocket } from '../lib/socket';
import { useTranslation } from '../lib/i18n';
import PieceSVG from './PieceSVG';
import Header from './Header';
import type { PieceType, PieceColor } from '@shared/types';

const TIME_PRESETS = [
  { label: '1+0', nameKey: 'time.bullet', initial: 60, increment: 0 },
  { label: '3+0', nameKey: 'time.blitz', initial: 180, increment: 0 },
  { label: '3+2', nameKey: 'time.blitz', initial: 180, increment: 2 },
  { label: '5+0', nameKey: 'time.blitz', initial: 300, increment: 0 },
  { label: '5+3', nameKey: 'time.rapid', initial: 300, increment: 3 },
  { label: '10+0', nameKey: 'time.rapid', initial: 600, increment: 0 },
  { label: '10+5', nameKey: 'time.rapid', initial: 600, increment: 5 },
  { label: '15+10', nameKey: 'time.classical', initial: 900, increment: 10 },
  { label: '30+0', nameKey: 'time.classical', initial: 1800, increment: 0 },
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
  const { t } = useTranslation();
  const [selectedTime, setSelectedTime] = useState(TIME_PRESETS[3]);
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
      <Header active="play" subtitle={t('app.tagline')} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-1 mb-4">
            {SHOWCASE_PIECES.map((p, i) => (
              <div key={i} className="opacity-80 hover:opacity-100 transition-opacity">
                <PieceSVG type={p.type} color={p.color} size={48} />
              </div>
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-bright mb-2">{t('home.hero_title')}</h2>
          <p className="text-text-dim text-base sm:text-lg max-w-md mx-auto">
            {t('home.hero_desc')}
          </p>
        </div>

        {/* Quick Play */}
        <div className="bg-surface-alt border border-accent/30 rounded-xl p-5 sm:p-6 w-full max-w-lg mb-4 animate-slideUp">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="text-lg font-semibold text-text-bright">{t('home.quick_play')}</h3>
              <p className="text-text-dim text-xs">{t('home.quick_play_desc')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/quick-play')}
            className="w-full py-3 px-6 bg-accent hover:bg-accent/80 text-white font-bold rounded-lg text-lg transition-colors shadow-md"
          >
            {t('home.find_opponent')}
          </button>
        </div>

        {/* Play Options Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-lg mb-4">
          <button
            onClick={handleCreateGame}
            disabled={isCreating}
            className="bg-surface-alt border border-surface-hover rounded-xl p-4 sm:p-5 text-center hover:border-primary/50 transition-all hover:shadow-lg group"
          >
            <div className="text-2xl sm:text-3xl mb-2">🤝</div>
            <h3 className="font-semibold text-text-bright text-xs sm:text-sm group-hover:text-primary-light transition-colors">
              {isCreating ? t('home.creating') : t('home.play_friend')}
            </h3>
            <p className="text-text-dim text-xs mt-1 hidden sm:block">{t('home.play_friend_desc')}</p>
          </button>

          <button
            onClick={() => navigate('/bot')}
            className="bg-surface-alt border border-surface-hover rounded-xl p-4 sm:p-5 text-center hover:border-primary/50 transition-all hover:shadow-lg group"
          >
            <div className="text-2xl sm:text-3xl mb-2">🤖</div>
            <h3 className="font-semibold text-text-bright text-xs sm:text-sm group-hover:text-primary-light transition-colors">
              {t('home.play_bot')}
            </h3>
            <p className="text-text-dim text-xs mt-1 hidden sm:block">{t('home.play_bot_desc')}</p>
          </button>

          <button
            onClick={() => navigate('/puzzles')}
            className="bg-surface-alt border border-surface-hover rounded-xl p-4 sm:p-5 text-center hover:border-primary/50 transition-all hover:shadow-lg group"
          >
            <div className="text-2xl sm:text-3xl mb-2">🧩</div>
            <h3 className="font-semibold text-text-bright text-xs sm:text-sm group-hover:text-primary-light transition-colors">
              {t('home.puzzles')}
            </h3>
            <p className="text-text-dim text-xs mt-1 hidden sm:block">{t('home.puzzles_desc')}</p>
          </button>
        </div>

        {/* Time Control + Create Game */}
        <div className="bg-surface-alt border border-surface-hover rounded-xl p-5 sm:p-6 w-full max-w-lg mb-4 animate-slideUp">
          <h3 className="text-lg font-semibold text-text-bright mb-4">{t('home.create_private')}</h3>

          <div className="mb-5">
            <label className="text-sm text-text-dim mb-2 block">{t('home.time_control')}</label>
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
                  <div className="text-xs opacity-70">{t(preset.nameKey)}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateGame}
            disabled={isCreating}
            className="w-full py-3 px-6 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-lg text-lg transition-colors shadow-md"
          >
            {isCreating ? t('home.creating') : t('home.play_with_friend')}
          </button>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-hover" />
            <span className="text-text-dim text-xs">{t('home.or')}</span>
            <div className="flex-1 h-px bg-surface-hover" />
          </div>

          <button
            onClick={() => navigate('/local')}
            className="w-full mt-3 py-2 px-6 bg-surface hover:bg-surface-hover text-text border border-surface-hover font-medium rounded-lg transition-colors"
          >
            {t('home.play_local')}
          </button>
        </div>

        {/* Join Game */}
        <div className="bg-surface-alt border border-surface-hover rounded-xl p-5 sm:p-6 w-full max-w-lg animate-slideUp">
          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full text-center text-text-dim hover:text-text-bright transition-colors text-sm"
            >
              {t('home.join_prompt')} <span className="underline">{t('home.join_link')}</span>
            </button>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-text-bright mb-3">{t('home.join_title')}</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                  placeholder={t('home.join_placeholder')}
                  className="flex-1 bg-surface border border-surface-hover rounded-lg px-4 py-2 text-text-bright focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
                <button
                  onClick={handleJoinGame}
                  className="px-6 py-2 bg-accent hover:bg-accent/80 text-white font-semibold rounded-lg transition-colors"
                >
                  {t('home.join')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="mt-8 sm:mt-10 max-w-lg w-full">
          <details className="bg-surface-alt border border-surface-hover rounded-xl overflow-hidden">
            <summary className="px-5 sm:px-6 py-4 cursor-pointer text-text-bright font-semibold hover:bg-surface-hover transition-colors">
              {t('home.rules_title')}
            </summary>
            <div className="px-5 sm:px-6 pb-5 text-text-dim text-sm space-y-3">
              <p>{t('home.rules_intro')}</p>
              <div>
                <strong className="text-text-bright">{t('home.rules_pieces')}</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>{t('home.piece_king')}</li>
                  <li>{t('home.piece_queen')}</li>
                  <li>{t('home.piece_bishop')}</li>
                  <li>{t('home.piece_rook')}</li>
                  <li>{t('home.piece_knight')}</li>
                  <li>{t('home.piece_pawn')}</li>
                </ul>
              </div>
              <div>
                <strong className="text-text-bright">{t('home.rules_special')}</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>{t('home.rule_pawn_rank')}</li>
                  <li>{t('home.rule_promote')}</li>
                  <li>{t('home.rule_no_special')}</li>
                  <li>{t('home.rule_checkmate')}</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
      </main>

      <footer className="bg-surface-alt border-t border-surface-hover py-4 text-center text-text-dim text-sm">
        {t('footer.tagline')} — {t('footer.inspired')}{' '}
        <a href="https://lichess.org" target="_blank" rel="noopener" className="text-primary hover:text-primary-light">
          Lichess
        </a>
      </footer>
    </div>
  );
}

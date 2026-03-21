import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { socket, connectSocket } from '../lib/socket';

import { useTranslation } from '../lib/i18n';

import PieceSVG from './PieceSVG';

import Header from './Header';

import FriendSVG from './FriendSVG';

import BotSVG from './BotSVG';

import PuzzleSVG from './PuzzleSVG';

import QuickPlaySVG from './QuickPlaySVG';

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
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinId, setJoinId] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const gameCreatedHandlerRef = useRef<((payload: { gameId: string }) => void) | null>(null);
  const connectHandlerRef = useRef<(() => void) | null>(null);
  const errorHandlerRef = useRef<((payload: { message: string }) => void) | null>(null);

  const cleanupCreateHandlers = () => {
    if (gameCreatedHandlerRef.current) {
      socket.off('game_created', gameCreatedHandlerRef.current);
      gameCreatedHandlerRef.current = null;
    }

    if (connectHandlerRef.current) {
      socket.off('connect', connectHandlerRef.current);
      connectHandlerRef.current = null;
    }

    if (errorHandlerRef.current) {
      socket.off('error', errorHandlerRef.current);
      errorHandlerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupCreateHandlers();
    };
  }, []);

  const handleCreateGame = () => {
    setIsCreating(true);
    setCreateError(null);
    connectSocket();
    cleanupCreateHandlers();

    const handleCreated = ({ gameId }: { gameId: string }) => {
      setIsCreating(false);
      cleanupCreateHandlers();
      navigate(`/game/${gameId}`);
    };

    const handleError = ({ message }: { message: string }) => {
      setIsCreating(false);
      setCreateError(message);
      cleanupCreateHandlers();
    };

    gameCreatedHandlerRef.current = handleCreated;
    errorHandlerRef.current = handleError;
    socket.on('game_created', handleCreated);
    socket.on('error', handleError);

    const emitCreateGame = () => {
      connectHandlerRef.current = null;
      socket.emit('create_game', {
        timeControl: { initial: selectedTime.initial, increment: selectedTime.increment },
      });
    };

    connectHandlerRef.current = emitCreateGame;
    socket.once('connect', emitCreateGame);

    if (socket.connected) {
      socket.off('connect', emitCreateGame);
      connectHandlerRef.current = null;
      emitCreateGame();
    }
  };

  const handleJoinGame = () => {
    if (!joinId.trim()) return;
    navigate(`/game/${joinId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="play" subtitle={t('app.tagline')} />

      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-1 mb-4">
            {SHOWCASE_PIECES.map((p, i) => (
              <div key={i} className="opacity-80 hover:opacity-100 transition-opacity">
                <PieceSVG type={p.type} color={p.color} size={48} />
              </div>
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl display text-text-bright mb-2">{t('home.hero_title')}</h2>
          <p className="text-text-dim text-base sm:text-lg max-w-md mx-auto">
            {t('home.hero_desc')}
          </p>
        </div>

        {/* Quick Play */}
        <div className="bg-surface-alt border border-accent/30 rounded-xl p-5 sm:p-6 w-full max-w-lg mb-4 animate-slideUp">
          <div className="flex items-center gap-3 mb-3">
            <QuickPlaySVG size={32} className="text-text-bright" />
            <div>
              <h3 className="display text-lg text-text-bright">{t('home.quick_play')}</h3>
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

        {/* Play Options */}
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl mb-4">
          <div className="flex-1 bg-surface-alt border border-accent/30 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
            <BotSVG size={60} className="mx-auto mb-4 text-text-bright" />
            <h3 className="display text-xl text-text-bright mb-2">{t('home.play_bot')}</h3>
            <p className="text-text-dim text-sm mb-4">{t('home.play_bot_desc')}</p>
            <p className="text-text-dim text-sm mb-4">Challenge our AI opponent with varying difficulty levels. Perfect for practice and improvement.</p>
            <button
              onClick={() => navigate('/bot')}
              className="w-full py-3 px-6 bg-primary hover:bg-primary-light text-white font-bold rounded-lg transition-colors"
            >
              {t('home.play_bot')}
            </button>
          </div>
          <div className="flex-1 bg-surface-alt border border-surface-hover rounded-xl p-6 text-center hover:shadow-lg transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(45deg, var(--color-text) 25%, transparent 25%), linear-gradient(-45deg, var(--color-text) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-text) 75%), linear-gradient(-45deg, transparent 75%, var(--color-text) 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}
            />
            <div className="relative z-10">
              <PuzzleSVG size={60} className="mx-auto mb-4 text-text-bright" />
              <h3 className="display text-xl text-text-bright mb-2">{t('home.puzzles')}</h3>
              <p className="text-text-dim text-sm mb-4">{t('home.puzzles_desc')}</p>
              <p className="text-text-dim text-sm mb-4">Sharpen your tactical skills with curated puzzles from real games.</p>
              <button
                onClick={() => navigate('/puzzles')}
                className="w-full py-3 px-6 bg-accent hover:bg-accent/80 text-white font-bold rounded-lg transition-colors"
              >
                {t('home.puzzles')}
              </button>
            </div>
          </div>
        </div>

        {/* Time Control + Create Game */}
        <div className="bg-surface-alt border border-surface-hover rounded-xl p-5 sm:p-6 w-full max-w-lg mb-4 animate-slideUp">
          <h3 className="display text-lg font-semibold text-text-bright mb-4">{t('home.create_private')}</h3>
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
          {createError && (
            <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {createError}
            </p>
          )}
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
              <h3 className="display text-lg font-semibold text-text-bright mb-3">{t('home.join_title')}</h3>
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
            <summary className="px-5 sm:px-6 py-4 cursor-pointer text-text-bright display font-semibold hover:bg-surface-hover transition-colors">
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

      <footer className="bg-surface-alt border-t border-surface-hover py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-6">
            {/* Play */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('nav.play')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/quick-play" className="hover:text-primary transition-colors">{t('home.quick_play')}</a></li>
                <li><a href="/local" className="hover:text-primary transition-colors">{t('home.play_local')}</a></li>
                <li><a href="/bot" className="hover:text-primary transition-colors">{t('home.play_bot')}</a></li>
              </ul>
            </div>
            {/* Puzzles */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('nav.puzzles')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/puzzles" className="hover:text-primary transition-colors">{t('puzzle.title')}</a></li>
              </ul>
            </div>
            {/* About */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('nav.about')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/games" className="hover:text-primary transition-colors">{t('games.title')}</a></li>
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="hover:text-primary transition-colors">GitHub</a></li>
              </ul>
            </div>
            {/* Community */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">Community</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="hover:text-primary transition-colors">Star on GitHub</a></li>
                <li><a href="/feedback" className="hover:text-primary transition-colors">{t('feedback.button')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-surface-hover text-center">
            <p className="text-text-dim text-xs">{t('footer.tagline')} — {t('footer.inspired')}{' '}
              <a href="https://lichess.org" target="_blank" rel="noopener" className="text-primary hover:text-primary-light">
                Lichess
              </a>
              {' '}and{' '}
              <a href="https://chess.com" target="_blank" rel="noopener" className="text-primary hover:text-primary-light">
                Chess.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { socket, connectSocket } from '../lib/socket';
import { liveGameRoute, routes } from '../lib/routes';

import { useTranslation } from '../lib/i18n';

import PieceSVG from './PieceSVG';

import Header from './Header';

import FriendSVG from './FriendSVG';

import BotSVG from './BotSVG';

import PuzzleSVG from './PuzzleSVG';

import QuickPlaySVG from './QuickPlaySVG';

import type { PieceType, PieceColor, PrivateGameColorPreference } from '@shared/types';

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

interface HomeStats {
  totalGames: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [selectedTime, setSelectedTime] = useState(TIME_PRESETS[3]);
  const [selectedColor, setSelectedColor] = useState<PrivateGameColorPreference>('random');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinId, setJoinId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [stats, setStats] = useState<HomeStats | null>(null);
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

  useEffect(() => {
    if (typeof fetch !== 'function') return;

    fetch('/api/stats')
      .then((response) => response.json())
      .then((data) => {
        if (typeof data?.totalGames === 'number') {
          setStats({ totalGames: data.totalGames });
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateGame = () => {
    setIsCreating(true);
    setCreateError(null);
    connectSocket();
    cleanupCreateHandlers();

    const handleCreated = ({ gameId }: { gameId: string }) => {
      setIsCreating(false);
      cleanupCreateHandlers();
      navigate(liveGameRoute(gameId));
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
        colorPreference: selectedColor,
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
    navigate(liveGameRoute(joinId.trim()));
  };

  const openCreatePanel = () => {
    setShowCreate(true);
    setShowJoin(false);
  };

  const openJoinPanel = () => {
    setShowJoin(true);
    setShowCreate(false);
  };

  const learnCards = lang === 'th'
    ? [
      {
        href: routes.whatIsMakruk,
        title: 'หมากรุกไทยคืออะไร',
        desc: 'ดูภาพรวมของเกมก่อน ว่าทำไมหมากรุกไทยถึงต่างจากหมากรุกสากล',
      },
      {
        href: routes.howToPlayMakruk,
        title: 'วิธีเล่นหมากรุกไทย',
        desc: 'เรียนการเดินหมาก การหงาย และกฎการนับแบบเข้าใจง่าย',
      },
      {
        href: routes.playMakrukOnline,
        title: 'เล่นหมากรุกไทยออนไลน์',
        desc: 'ดูว่าเริ่มจากบอท โจทย์ หรือเกมคนจริงแบบไหนเหมาะที่สุด',
      },
    ]
    : [
      {
        href: routes.whatIsMakruk,
        title: 'What Is Makruk?',
        desc: 'Get the big picture first and see why Thai chess feels different from western chess.',
      },
      {
        href: routes.howToPlayMakruk,
        title: 'How to Play Makruk',
        desc: 'Learn piece movement, promotion, and the counting rule without the usual confusion.',
      },
      {
        href: routes.playMakrukOnline,
        title: 'Play Makruk Online',
        desc: 'See whether bot games, puzzles, or live play make the best first step for you.',
      },
    ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="play" subtitle={t('app.tagline')} />

      <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_320px] xl:grid-cols-[minmax(0,1.55fr)_340px]">
            <div className="bg-surface-alt border border-accent/30 rounded-2xl p-6 sm:p-8 lg:p-10 animate-slideUp">
              <div className="flex items-center justify-center gap-1 mb-4 sm:mb-5">
                {SHOWCASE_PIECES.map((p, i) => (
                  <div key={i} className="opacity-80 hover:opacity-100 transition-opacity">
                    <PieceSVG type={p.type} color={p.color} size={40} />
                  </div>
                ))}
              </div>

              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-[3.35rem] display text-text-bright mb-3">
                  {t('home.hero_title')}
                </h2>
                <p className="text-text-dim text-base sm:text-lg max-w-2xl mx-auto">
                  {t('home.hero_desc')}
                </p>
              </div>

              <div className="mt-8 sm:mt-10 rounded-2xl border border-accent/20 bg-surface/75 p-5 sm:p-6 lg:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-2">
                      {t('nav.play')}
                    </p>
                    <h3 className="display text-3xl text-text-bright">{t('home.quick_play')}</h3>
                    <p className="text-text-dim text-sm sm:text-base mt-2 max-w-lg">{t('home.quick_play_desc')}</p>
                  </div>
                  <QuickPlaySVG size={46} className="text-text-bright flex-shrink-0" />
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-6">
                  <span className="rounded-full border border-surface-hover bg-surface px-3 py-1 text-xs font-semibold text-text-dim">
                    {t('home.no_signup')}
                  </span>
                  <span className="rounded-full border border-surface-hover bg-surface px-3 py-1 text-xs font-semibold text-text-dim">
                    {t('home.free_to_play')}
                  </span>
                  {stats && stats.totalGames > 0 && (
                    <span className="rounded-full border border-surface-hover bg-surface px-3 py-1 text-xs font-semibold text-text-dim">
                      {t('home.games_played', { count: stats.totalGames })}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
                  <button
                    onClick={() => navigate(routes.quickPlay)}
                    className="w-full sm:w-auto min-w-[16rem] py-3.5 px-7 bg-accent hover:bg-accent/80 text-white font-bold rounded-lg text-lg transition-colors shadow-md"
                  >
                    {t('home.find_opponent')}
                  </button>
                  <p className="text-xs sm:text-sm text-text-dim">
                    {t('quick.rated_available')}
                  </p>
                </div>
              </div>
            </div>

            <aside className="grid gap-2.5 content-start">
              {!showCreate ? (
                <button
                  type="button"
                  onClick={openCreatePanel}
                  className="bg-surface-alt border border-surface-hover/80 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/60"
                >
                  <div className="flex items-center gap-3">
                    <FriendSVG size={24} className="text-text-bright flex-shrink-0" />
                    <div>
                      <div className="text-text-bright text-[0.95rem] font-semibold">{t('home.create_private')}</div>
                      <div className="text-text-dim text-xs sm:text-sm">{t('home.private_desc')}</div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="bg-surface-alt border border-surface-hover rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="display text-lg font-semibold text-text-bright">{t('home.create_private')}</h3>
                      <p className="text-text-dim text-sm mt-1">{t('home.private_desc')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="text-text-dim hover:text-text-bright text-sm transition-colors"
                    >
                      {t('common.close')}
                    </button>
                  </div>

                  <div className="mb-4">
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

                  <div className="mb-4">
                    <label className="text-sm text-text-dim mb-2 block">{t('home.choose_color')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['random', 'white', 'black'] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`
                            py-2 px-3 rounded-lg text-sm font-medium transition-all
                            ${selectedColor === color
                              ? 'bg-accent text-white shadow-md'
                              : 'bg-surface hover:bg-surface-hover text-text border border-surface-hover'
                            }
                          `}
                        >
                          {t(`home.color_${color}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCreateGame}
                    disabled={isCreating}
                    className="w-full py-3 px-6 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-lg transition-colors shadow-md"
                  >
                    {isCreating ? t('home.creating') : t('home.play_with_friend')}
                  </button>

                  {createError && (
                    <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                      {createError}
                    </p>
                  )}
                </div>
              )}

              {!showJoin ? (
                <button
                  type="button"
                  onClick={openJoinPanel}
                  className="bg-surface-alt border border-surface-hover/80 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/60"
                >
                  <div className="text-text-bright text-[0.95rem] font-semibold">{t('home.join_title')}</div>
                  <div className="text-text-dim text-xs sm:text-sm mt-1">{t('home.join_desc')}</div>
                </button>
              ) : (
                <div className="bg-surface-alt border border-surface-hover rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="display text-lg font-semibold text-text-bright">{t('home.join_title')}</h3>
                      <p className="text-text-dim text-sm mt-1">{t('home.join_desc')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowJoin(false)}
                      className="text-text-dim hover:text-text-bright text-sm transition-colors"
                    >
                      {t('common.close')}
                    </button>
                  </div>
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
                      className="px-5 py-2 bg-accent hover:bg-accent/80 text-white font-semibold rounded-lg transition-colors"
                    >
                      {t('home.join')}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate(routes.bot)}
                className="bg-surface-alt border border-surface-hover/80 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/60"
              >
                <div className="flex items-center gap-3">
                  <BotSVG size={24} className="text-text-bright flex-shrink-0" />
                  <div>
                    <div className="text-text-bright text-[0.95rem] font-semibold">{t('home.play_bot')}</div>
                    <div className="text-text-dim text-xs sm:text-sm">{t('home.play_bot_desc')}</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate(routes.puzzles)}
                className="bg-surface-alt border border-surface-hover/80 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/60"
              >
                <div className="flex items-center gap-3">
                  <PuzzleSVG size={24} className="text-text-bright flex-shrink-0" />
                  <div>
                    <div className="text-text-bright text-[0.95rem] font-semibold">{t('home.puzzles')}</div>
                    <div className="text-text-dim text-xs sm:text-sm">{t('home.puzzles_desc')}</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate(routes.local)}
                className="bg-surface-alt border border-surface-hover/80 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/60"
              >
                <div className="text-text-bright text-[0.95rem] font-semibold">{t('home.play_local')}</div>
                <div className="text-text-dim text-xs sm:text-sm mt-1">{t('home.play_local_desc')}</div>
              </button>
            </aside>
          </section>

          <div className="mx-auto w-full max-w-2xl">
            <details className="bg-surface-alt border border-surface-hover rounded-2xl overflow-hidden">
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

          <section className="rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  {lang === 'th' ? 'คู่มือเริ่มต้น' : 'Learn'}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-text-bright">
                  {lang === 'th' ? 'เริ่มจากหน้าที่อ่านแล้วเข้าใจจริง' : 'Start With the Pages That Actually Help'}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-text-dim">
                {lang === 'th'
                  ? 'ถ้าคุณเพิ่งเข้ามาใหม่ 3 หน้านี้จะพาคุณจากรู้จักเกม ไปจนถึงเริ่มเล่นได้จริง'
                  : 'If you are new here, these three pages take you from basic context to your first real Makruk session.'}
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {learnCards.map((card) => (
                <a
                  key={card.href}
                  href={card.href}
                  className="rounded-2xl border border-surface-hover bg-surface/55 px-4 py-4 transition-colors hover:bg-surface-hover"
                >
                  <div className="text-lg font-semibold text-text-bright">{card.title}</div>
                  <div className="mt-2 text-sm leading-6 text-text-dim">{card.desc}</div>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-surface-alt border-t border-surface-hover py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6 mb-4">
            {/* Play */}
            <div>
              <h4 className="text-text-bright font-semibold mb-2 text-sm">{t('nav.play')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/quick-play" className="hover:text-primary transition-colors">{t('home.quick_play')}</a></li>
                <li><a href="/local" className="hover:text-primary transition-colors">{t('home.play_local')}</a></li>
                <li><a href="/bot" className="hover:text-primary transition-colors">{t('home.play_bot')}</a></li>
              </ul>
            </div>
            {/* Puzzles */}
            <div>
              <h4 className="text-text-bright font-semibold mb-2 text-sm">{t('nav.puzzles')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/puzzles" className="hover:text-primary transition-colors">{t('puzzle.title')}</a></li>
              </ul>
            </div>
            {/* About */}
            <div>
              <h4 className="text-text-bright font-semibold mb-2 text-sm">{t('nav.about')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/games" className="hover:text-primary transition-colors">{t('games.title')}</a></li>
                <li><a href={routes.whatIsMakruk} className="hover:text-primary transition-colors">{lang === 'th' ? 'หมากรุกไทยคืออะไร' : 'What Is Makruk?'}</a></li>
                <li><a href={routes.howToPlayMakruk} className="hover:text-primary transition-colors">{lang === 'th' ? 'วิธีเล่นหมากรุกไทย' : 'How to Play Makruk'}</a></li>
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="hover:text-primary transition-colors">{t('footer.github')}</a></li>
              </ul>
            </div>
            {/* Community */}
            <div>
              <h4 className="text-text-bright font-semibold mb-2 text-sm">{t('footer.community')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="hover:text-primary transition-colors">{t('footer.star_github')}</a></li>
                <li><a href="/feedback" className="hover:text-primary transition-colors">{t('feedback.button')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-surface-hover text-center">
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

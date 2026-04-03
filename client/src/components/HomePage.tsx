import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveGameRoute, routes } from '../lib/routes';

import { useTranslation } from '../lib/i18n';
import { usePublicLiveGames } from '../hooks/usePublicLiveGames';

import PieceSVG from './PieceSVG';

import Header from './Header';

import FriendSVG from './FriendSVG';

import BotSVG from './BotSVG';

import PuzzleSVG from './PuzzleSVG';

import QuickPlaySVG from './QuickPlaySVG';
const DeferredLiveGamesPanel = lazy(() => import('./LiveGamesPanel'));
const DeferredHomePuzzleProgressCard = lazy(() => import('./HomePuzzleProgressCard'));

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
type SocketModule = typeof import('../lib/socket');
type SocketLike = SocketModule['socket'];

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedTime, setSelectedTime] = useState(TIME_PRESETS[3]);
  const [selectedColor, setSelectedColor] = useState<PrivateGameColorPreference>('random');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinId, setJoinId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showDeferredContent, setShowDeferredContent] = useState(false);
  const [showPuzzleProgressCard, setShowPuzzleProgressCard] = useState(import.meta.env.MODE === 'test');
  const [showHeroDecor, setShowHeroDecor] = useState(import.meta.env.MODE === 'test');
  const [stats, setStats] = useState<HomeStats | null>(null);
  const { games: liveGames, loading: liveGamesLoading } = usePublicLiveGames({ status: 'live', limit: 4, enabled: showDeferredContent });
  const gameCreatedHandlerRef = useRef<((payload: { gameId: string }) => void) | null>(null);
  const connectHandlerRef = useRef<(() => void) | null>(null);
  const errorHandlerRef = useRef<((payload: { message: string }) => void) | null>(null);
  const socketRef = useRef<SocketLike | null>(null);
  const deferredContentRef = useRef<HTMLDivElement | null>(null);

  const cleanupCreateHandlers = () => {
    const activeSocket = socketRef.current;

    if (activeSocket && gameCreatedHandlerRef.current) {
      activeSocket.off('game_created', gameCreatedHandlerRef.current);
      gameCreatedHandlerRef.current = null;
    }

    if (activeSocket && connectHandlerRef.current) {
      activeSocket.off('connect', connectHandlerRef.current);
      connectHandlerRef.current = null;
    }

    if (activeSocket && errorHandlerRef.current) {
      activeSocket.off('error', errorHandlerRef.current);
      errorHandlerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupCreateHandlers();
    };
  }, []);

  useEffect(() => {
    if (!showDeferredContent || typeof fetch !== 'function') return;

    fetch('/api/stats')
      .then((response) => response.json())
      .then((data) => {
        if (typeof data?.totalGames === 'number') {
          setStats({ totalGames: data.totalGames });
        }
      })
      .catch(() => {});
  }, [showDeferredContent]);

  useEffect(() => {
    if (showPuzzleProgressCard || typeof window === 'undefined') return;

    const requestIdle = window.requestIdleCallback;
    if (typeof requestIdle === 'function') {
      const idleId = requestIdle(() => setShowPuzzleProgressCard(true), { timeout: 1200 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(() => setShowPuzzleProgressCard(true), 250);
    return () => globalThis.clearTimeout(timeoutId);
  }, [showPuzzleProgressCard]);

  useEffect(() => {
    if (showHeroDecor || typeof window === 'undefined') return;

    const requestIdle = window.requestIdleCallback;
    if (typeof requestIdle === 'function') {
      const idleId = requestIdle(() => setShowHeroDecor(true), { timeout: 1200 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(() => setShowHeroDecor(true), 250);
    return () => globalThis.clearTimeout(timeoutId);
  }, [showHeroDecor]);

  useEffect(() => {
    if (showDeferredContent) return;

    if (import.meta.env.MODE === 'test') {
      setShowDeferredContent(true);
      return;
    }

    const target = deferredContentRef.current;
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setShowDeferredContent(true);
      observer.disconnect();
    }, {
      rootMargin: '320px 0px',
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [showDeferredContent]);

  const handleCreateGame = async () => {
    setIsCreating(true);
    setCreateError(null);
    let socketModule: SocketModule;

    try {
      socketModule = await import('../lib/socket');
    } catch {
      setIsCreating(false);
      setCreateError(t('error.connection_body'));
      return;
    }

    const { socket, connectSocket } = socketModule;
    socketRef.current = socket;
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

  const learnCards = [
    {
      href: routes.whatIsMakruk,
      title: t('home.learn_card.what_is_title'),
      desc: t('home.learn_card.what_is_desc'),
    },
    {
      href: routes.howToPlayMakruk,
      title: t('home.learn_card.how_to_title'),
      desc: t('home.learn_card.how_to_desc'),
    },
    {
      href: routes.playMakrukOnline,
      title: t('home.learn_card.play_online_title'),
      desc: t('home.learn_card.play_online_desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="play" subtitle={t('app.tagline')} />

      <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_320px] xl:grid-cols-[minmax(0,1.55fr)_340px]">
            <div className="bg-surface-alt border border-accent/30 rounded-2xl p-6 sm:p-8 lg:p-10">
              <div className="mb-4 flex min-h-10 items-center justify-center gap-1 sm:mb-5">
                {showHeroDecor ? SHOWCASE_PIECES.map((p, i) => (
                  <div key={i} className="opacity-80 hover:opacity-100 transition-opacity">
                    <PieceSVG type={p.type} color={p.color} size={40} />
                  </div>
                )) : null}
              </div>

              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-3xl sm:text-4xl lg:text-[3.35rem] display text-text-bright mb-3">
                  {t('home.hero_title')}
                </h1>
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
                    <h2 className="display text-3xl text-text-bright">{t('home.quick_play')}</h2>
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
                  <span
                    aria-hidden={stats === null}
                    className={`rounded-full border border-surface-hover bg-surface px-3 py-1 text-xs font-semibold text-text-dim transition-opacity ${stats && stats.totalGames > 0 ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {stats && stats.totalGames > 0 ? t('home.games_played', { count: stats.totalGames }) : t('home.games_played', { count: 0 })}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
                  <button
                    onClick={() => navigate(routes.quickPlay)}
                    className="button-accent-contrast w-full sm:w-auto min-w-[16rem] py-3.5 px-7 font-bold rounded-lg text-lg transition-colors shadow-md"
                  >
                    {t('home.find_opponent')}
                  </button>
                  <button
                    onClick={() => navigate(routes.leaderboard)}
                    className="w-full sm:w-auto py-3.5 px-5 rounded-lg border border-surface-hover bg-surface hover:bg-surface-hover text-text-bright font-semibold transition-colors"
                  >
                    {t('leaderboard.title')}
                  </button>
                  <p className="text-xs sm:text-sm text-text-dim">
                    {t('quick.rated_available')}
                  </p>
                </div>
              </div>
            </div>

            <aside className="grid gap-2.5 content-start">
              {showPuzzleProgressCard ? (
                <Suspense
                  fallback={(
                    <div aria-hidden="true" className="min-h-[10.5rem] rounded-xl border border-primary/20 bg-primary/10 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/20" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-3 w-28 rounded-full bg-primary/20" />
                          <div className="h-5 w-36 rounded-full bg-primary/20" />
                          <div className="h-3 w-full rounded-full bg-primary/15" />
                          <div className="h-3 w-4/5 rounded-full bg-primary/15" />
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <DeferredHomePuzzleProgressCard />
                </Suspense>
              ) : (
                <div aria-hidden="true" className="min-h-[10.5rem] rounded-xl border border-primary/20 bg-primary/10 px-4 py-4" />
              )}

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
                className="rounded-xl border border-primary/20 bg-[linear-gradient(135deg,rgba(92,160,26,0.10),rgba(39,30,24,0.92)_45%,rgba(39,30,24,0.98))] px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BotSVG size={24} className="text-text-bright flex-shrink-0" />
                    <div>
                      <div className="text-text-bright text-[0.95rem] font-semibold">{t('home.play_bot')}</div>
                      <div className="text-text-dim text-xs sm:text-sm">{t('home.play_bot_desc')}</div>
                    </div>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-light">
                    1-10
                  </span>
                </div>
                <div className="mt-3 text-[11px] leading-5 text-text-dim">{t('home.play_bot_long_desc')}</div>
              </button>

              <button
                type="button"
                onClick={() => navigate(routes.lessons)}
                className="bg-surface-alt border border-surface-hover/80 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/60"
              >
                <div className="flex items-center gap-3">
                  <PuzzleSVG size={24} className="text-text-bright flex-shrink-0" />
                  <div>
                    <div className="text-text-bright text-[0.95rem] font-semibold">{t('home.lessons')}</div>
                    <div className="text-text-dim text-xs sm:text-sm">{t('home.lessons_desc')}</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate(routes.watch)}
                className="bg-surface-alt border border-surface-hover/80 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/60"
              >
                <div className="flex items-center gap-3">
                  <QuickPlaySVG size={24} className="text-text-bright flex-shrink-0" />
                  <div>
                    <div className="text-text-bright text-[0.95rem] font-semibold">{t('home.watch_live')}</div>
                    <div className="text-text-dim text-xs sm:text-sm">{t('home.watch_live_desc')}</div>
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

          <div ref={deferredContentRef}>
            {showDeferredContent ? (
              <Suspense fallback={<section className="deferred-section rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6 min-h-[18rem]"><div className="h-10 w-40 rounded-lg bg-surface" /></section>}>
                <DeferredLiveGamesPanel
                  games={liveGames}
                  loading={liveGamesLoading}
                  title={t('home.live_now_title')}
                  description={t('home.live_now_desc')}
                  emptyTitle={t('home.no_live_games')}
                  emptyDesc={t('home.no_live_games_desc')}
                  compact
                  showViewAll
                  viewAllLabel={t('home.view_all_live')}
                  onViewAll={() => navigate(routes.watch)}
                />
              </Suspense>
            ) : (
              <section aria-hidden="true" className="deferred-section rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6 min-h-[18rem]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-3">
                    <div className="h-4 w-24 rounded-full bg-surface" />
                    <div className="h-4 w-56 rounded-full bg-surface" />
                  </div>
                  <div className="h-10 w-36 rounded-lg bg-surface" />
                </div>
                <div className="mt-5 h-[10.5rem] rounded-2xl border border-dashed border-surface-hover bg-surface/55" />
              </section>
            )}
          </div>

          <section className="deferred-section rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  {t('home.learn_eyebrow')}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-text-bright">
                  {t('home.learn_title')}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-text-dim">
                {t('home.learn_desc')}
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

      <footer className="deferred-section bg-surface-alt border-t border-surface-hover py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="sr-only">{t('footer.links_label')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6 mb-4">
            {/* Play */}
            <div>
              <p className="text-text-bright font-semibold mb-2 text-sm">{t('nav.play')}</p>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/quick-play" className="footer-link hover:text-primary transition-colors">{t('home.quick_play')}</a></li>
                <li><a href="/watch" className="footer-link hover:text-primary transition-colors">{t('home.watch_live')}</a></li>
                <li><a href="/local" className="footer-link hover:text-primary transition-colors">{t('home.play_local')}</a></li>
                <li><a href="/bot" className="footer-link hover:text-primary transition-colors">{t('home.play_bot')}</a></li>
              </ul>
            </div>
            {/* Puzzles */}
            <div>
              <p className="text-text-bright font-semibold mb-2 text-sm">{t('nav.puzzles')}</p>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/puzzles" className="footer-link hover:text-primary transition-colors">{t('puzzle.title')}</a></li>
              </ul>
            </div>
            {/* About */}
            <div>
              <p className="text-text-bright font-semibold mb-2 text-sm">{t('nav.about')}</p>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/games" className="footer-link hover:text-primary transition-colors">{t('games.title')}</a></li>
                <li><a href={routes.whatIsMakruk} className="footer-link hover:text-primary transition-colors">{t('footer.what_is_makruk')}</a></li>
                <li><a href={routes.howToPlayMakruk} className="footer-link hover:text-primary transition-colors">{t('footer.how_to_play_makruk')}</a></li>
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="footer-link hover:text-primary transition-colors">{t('footer.github')}</a></li>
              </ul>
            </div>
            {/* Community */}
            <div>
              <p className="text-text-bright font-semibold mb-2 text-sm">{t('footer.community')}</p>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="footer-link hover:text-primary transition-colors">{t('footer.star_github')}</a></li>
                <li><a href="/feedback" className="footer-link hover:text-primary transition-colors">{t('feedback.button')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-surface-hover text-center">
            <p className="text-text-dim text-xs">{t('footer.tagline')} — {t('footer.inspired')}{' '}
              <a href="https://lichess.org" target="_blank" rel="noopener" className="footer-link text-primary hover:text-primary-light">
                Lichess
              </a>
              {' '}and{' '}
              <a href="https://chess.com" target="_blank" rel="noopener" className="footer-link text-primary hover:text-primary-light">
                Chess.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

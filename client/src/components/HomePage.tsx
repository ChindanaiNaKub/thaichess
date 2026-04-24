import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  loadBotGameRoute,
  loadLocalGameRoute,
  loadQuickPlayRoute,
} from '../lib/routePrefetch';
import { liveGameRoute, routes } from '../lib/routes';
import { homeStatsQueryOptions } from '../queries/stats';

import { useTranslation } from '../lib/i18n';
import { usePublicLiveGames } from '../hooks/usePublicLiveGames';
import { usePrefetchQueries } from '../hooks/usePrefetchQueries';

import Header from './Header';

import FriendSVG from './FriendSVG';

import BotSVG from './BotSVG';

import PuzzleSVG from './PuzzleSVG';

import QuickPlaySVG from './QuickPlaySVG';
import Footer from './Footer';
const DeferredLiveGamesPanel = lazy(() => import('./LiveGamesPanel'));

import type { PrivateGameColorPreference } from '@shared/types';
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

type SocketModule = typeof import('../lib/socket');
type SocketLike = SocketModule['socket'];

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { prefetchGames, prefetchLeaderboard } = usePrefetchQueries();

  const [selectedTime, setSelectedTime] = useState(TIME_PRESETS[3]);
  const [selectedColor, setSelectedColor] = useState<PrivateGameColorPreference>('random');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinId, setJoinId] = useState('');
  const [showCreate, setShowCreate] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [deferredContentReady, setDeferredContentReady] = useState(import.meta.env.MODE === 'test');
  const [showDeferredContent, setShowDeferredContent] = useState(false);
  const { games: liveGames, loading: liveGamesLoading } = usePublicLiveGames({ status: 'live', limit: 4, enabled: showDeferredContent });
  
  // Use TanStack Query for stats
  const { data: stats } = useQuery({
    ...homeStatsQueryOptions(),
    enabled: showDeferredContent,
  });
  
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

  // Prefetch likely next pages when idle
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const prefetchWhenIdle = () => {
      // Prefetch games and leaderboard data for faster navigation
      prefetchGames();
      prefetchLeaderboard();
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetchWhenIdle, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(idleId);
    } else {
      const timeoutId = setTimeout(prefetchWhenIdle, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [prefetchGames, prefetchLeaderboard]);

  useEffect(() => {
    if (deferredContentReady || typeof window === 'undefined') return;

    const markReady = () => setDeferredContentReady(true);

    if (document.readyState === 'complete') {
      markReady();
      return;
    }

    window.addEventListener('load', markReady, { once: true });
    return () => window.removeEventListener('load', markReady);
  }, [deferredContentReady]);

  useEffect(() => {
    if (showDeferredContent || !deferredContentReady) return;

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
      rootMargin: '120px 0px',
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [deferredContentReady, showDeferredContent]);

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
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_330px]">
            <div className="ui-card rounded-2xl p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {t('nav.play')}
              </p>

              <h1 className="ui-title mt-3 max-w-3xl text-3xl sm:text-4xl lg:text-5xl">
                {t('home.hero_title')}
              </h1>
              <p className="ui-body mt-4 max-w-2xl text-base sm:text-lg">
                {t('home.hero_desc')}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                <span className="rounded-full border border-surface-hover/70 bg-surface px-3 py-1 text-xs font-semibold text-text-dim">
                  {t('home.no_signup')}
                </span>
                <span className="rounded-full border border-surface-hover/70 bg-surface px-3 py-1 text-xs font-semibold text-text-dim">
                  {t('home.free_to_play')}
                </span>
                <span className="rounded-full border border-surface-hover/70 bg-surface px-3 py-1 text-xs font-semibold text-text-dim">
                  {stats ? t('home.games_played', { count: stats.totalGames }) : t('home.games_played', { count: 0 })}
                </span>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => navigate(routes.quickPlay)}
                    onMouseEnter={() => void loadQuickPlayRoute()}
                    onFocus={() => void loadQuickPlayRoute()}
                    className="button-accent-contrast w-full sm:w-auto min-w-[14rem] rounded-lg px-6 py-3.5 text-base font-bold transition-colors"
                  >
                    {t('home.quick_play')}
                  </button>
                  <button
                    onClick={openCreatePanel}
                    className="ui-btn-secondary w-full sm:w-auto px-6 py-3.5 text-base"
                  >
                    {t('home.create_private')}
                  </button>
                </div>
                <button
                  onClick={() => navigate(routes.leaderboard)}
                  className="ui-btn-secondary px-4 py-2.5 text-sm text-text-dim hover:text-text-bright"
                >
                  {t('leaderboard.title')}
                </button>
              </div>

              <p className="mt-4 text-sm text-text-dim">{t('quick.rated_available')}</p>
            </div>

            <aside className="grid content-start gap-3">
              <div className="ui-card p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <FriendSVG size={22} className="text-text-bright flex-shrink-0" />
                  <h2 className="text-base font-semibold text-text-bright">{t('home.create_private')}</h2>
                </div>

                <div className="mb-4 grid grid-cols-2 rounded-lg border border-surface-hover/70 bg-surface p-1">
                  <button
                    type="button"
                    onClick={openCreatePanel}
                    className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${showCreate ? 'bg-surface-hover text-text-bright' : 'text-text-dim hover:text-text-bright'}`}
                  >
                    {t('home.create_private')}
                  </button>
                  <button
                    type="button"
                    onClick={openJoinPanel}
                    className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${showJoin ? 'bg-surface-hover text-text-bright' : 'text-text-dim hover:text-text-bright'}`}
                  >
                    {t('home.join_title')}
                  </button>
                </div>

                {showCreate ? (
                  <>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm text-text-dim">{t('home.time_control')}</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TIME_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => setSelectedTime(preset)}
                            className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${selectedTime.label === preset.label ? 'border-primary/40 bg-primary/12 text-primary-light' : 'border-surface-hover/70 bg-surface text-text-dim hover:text-text-bright'}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="mb-2 block text-sm text-text-dim">{t('home.choose_color')}</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['random', 'white', 'black'] as const).map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${selectedColor === color ? 'border-primary/40 bg-primary/12 text-primary-light' : 'border-surface-hover/70 bg-surface text-text-dim hover:text-text-bright'}`}
                          >
                            {t(`home.color_${color}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleCreateGame}
                      disabled={isCreating}
                      className="button-primary-contrast w-full rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60"
                    >
                      {isCreating ? t('home.creating') : t('home.play_with_friend')}
                    </button>

                    {createError && (
                      <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                        {createError}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                      placeholder={t('home.join_placeholder')}
                      className="flex-1 rounded-lg border border-surface-hover/80 bg-surface px-3 py-2 text-sm text-text-bright"
                      autoFocus
                    />
                    <button
                      onClick={handleJoinGame}
                      className="rounded-lg border border-primary/35 bg-primary/12 px-4 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/18"
                    >
                      {t('home.join')}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(routes.puzzleStreak)}
                aria-label={`${t('home.puzzles')} ${t('home.puzzles_desc')}`}
                className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3.5 text-left transition-colors hover:bg-primary/12"
              >
                <div className="flex items-start gap-3">
                  <PuzzleSVG size={22} className="mt-0.5 flex-shrink-0 text-primary-light" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-light">{t('home.streak_start')}</div>
                    <div className="mt-1 text-sm font-semibold text-text-bright">{t('home.streak_title')}</div>
                    <div className="mt-1 text-xs text-text-dim">{t('home.puzzles_desc')}</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate(routes.bot)}
                onMouseEnter={() => void loadBotGameRoute()}
                onFocus={() => void loadBotGameRoute()}
                className="ui-card px-4 py-3.5 text-left transition-colors hover:bg-surface-hover/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <BotSVG size={22} className="text-text-bright flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-text-bright">{t('home.play_bot')}</div>
                      <div className="text-xs text-text-dim">{t('home.play_bot_desc')}</div>
                    </div>
                  </div>
                  <span className="rounded-full border border-primary/25 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary-light">Lv 1-10</span>
                </div>
              </button>

              <div className="ui-card p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-dim">{t('home.learn_eyebrow')}</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <button
                    type="button"
                    onClick={() => navigate(routes.lessons)}
                    className="ui-btn-secondary flex items-center gap-2 px-3 py-2 text-left text-sm"
                  >
                    <PuzzleSVG size={18} className="text-text-dim" />
                    {t('home.lessons')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(routes.watch)}
                    className="ui-btn-secondary flex items-center gap-2 px-3 py-2 text-left text-sm"
                  >
                    <QuickPlaySVG size={18} className="text-text-dim" />
                    {t('home.watch_live')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(routes.local)}
                    onMouseEnter={() => void loadLocalGameRoute()}
                    onFocus={() => void loadLocalGameRoute()}
                    className="ui-btn-secondary px-3 py-2 text-left text-sm"
                  >
                    {t('home.play_local')}
                  </button>
                </div>
              </div>
            </aside>
          </section>

          <div ref={deferredContentRef}>
            {showDeferredContent ? (
              <Suspense fallback={<section className="deferred-section ui-card rounded-2xl p-5 sm:p-6 min-h-[18rem]"><div className="h-10 w-40 rounded-lg bg-surface" /></section>}>
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
              <section aria-hidden="true" className="deferred-section ui-card rounded-2xl p-5 sm:p-6 min-h-[18rem]">
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

          <section className="deferred-section ui-card rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="ui-eyebrow">
                  {t('home.learn_eyebrow')}
                </p>
                <h2 className="ui-title mt-2 text-2xl">
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
                  className="ui-card-soft rounded-2xl px-4 py-4 transition-colors hover:bg-surface-hover"
                >
                  <div className="text-lg font-semibold text-text-bright">{card.title}</div>
                  <div className="mt-2 text-sm leading-6 text-text-dim">{card.desc}</div>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

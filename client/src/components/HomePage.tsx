import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { captureProductEvent } from '../lib/analytics';
import { liveGameRoute, routes } from '../lib/routes';
import { homeStatsQueryOptions } from '../queries/stats';
import { connectSocket, socket } from '../lib/socket';
import { useTranslation } from '../lib/i18n';
import { usePublicLiveGames } from '../hooks/usePublicLiveGames';
import { usePrefetchQueries } from '../hooks/usePrefetchQueries';
import type { PrivateGameColorPreference } from '@shared/types';
import { HomePageView } from './HomePageView';

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

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { prefetchGames, prefetchLeaderboard } = usePrefetchQueries();

  const [selectedTime, setSelectedTime] = useState(TIME_PRESETS[3]);
  const [selectedColor, setSelectedColor] = useState<PrivateGameColorPreference>('random');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createTicket, setCreateTicket] = useState(0);
  const [joinId, setJoinId] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [privatePanel, setPrivatePanel] = useState<'create' | 'join'>('create');
  const [privateExpanded, setPrivateExpanded] = useState(false);
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
  const deferredContentRef = useRef<HTMLDivElement | null>(null);

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
    if (createTicket === 0) return;

    connectSocket();
    cleanupCreateHandlers();

    const handleCreated = ({ gameId }: { gameId: string }) => {
      setIsCreating(false);
      cleanupCreateHandlers();
      captureProductEvent('game_start', { source: 'create' });
      navigate(liveGameRoute(gameId));
    };

    const handleError = ({ message }: { message: string }) => {
      setIsCreating(false);
      setCreateError(message);
      cleanupCreateHandlers();
    };

    const emitCreateGame = () => {
      connectHandlerRef.current = null;
      socket.emit('create_game', {
        timeControl: { initial: selectedTime.initial, increment: selectedTime.increment },
        colorPreference: selectedColor,
      });
    };

    gameCreatedHandlerRef.current = handleCreated;
    errorHandlerRef.current = handleError;
    connectHandlerRef.current = emitCreateGame;
    socket.on('game_created', handleCreated);
    socket.on('error', handleError);
    socket.once('connect', emitCreateGame);

    if (socket.connected) {
      socket.off('connect', emitCreateGame);
      connectHandlerRef.current = null;
      emitCreateGame();
    }

    return () => {
      socket.off('game_created', handleCreated);
      socket.off('error', handleError);
      socket.off('connect', emitCreateGame);
      gameCreatedHandlerRef.current = null;
      errorHandlerRef.current = null;
      connectHandlerRef.current = null;
    };
  }, [createTicket, navigate, selectedColor, selectedTime.increment, selectedTime.initial]);

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

  const handleCreateGame = () => {
    setCreateError(null);
    setIsCreating(true);
    setCreateTicket((ticket) => ticket + 1);
  };

  const handleJoinGame = () => {
    if (!joinId.trim()) {
      setJoinError(t('home.join_prompt'));
      return;
    }
    setJoinError(null);
    captureProductEvent('game_start', { source: 'join' });
    navigate(liveGameRoute(joinId.trim()));
  };

  const openCreatePanel = () => {
    setPrivateExpanded(true);
    setPrivatePanel('create');
    setJoinError(null);
  };

  const openJoinPanel = () => {
    setPrivateExpanded(true);
    setPrivatePanel('join');
    setJoinError(null);
  };

  const closePrivatePanel = () => {
    setPrivateExpanded(false);
    setJoinError(null);
    setCreateError(null);
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
    <HomePageView
      navigate={navigate}
      stats={stats}
      liveGames={liveGames}
      liveGamesLoading={liveGamesLoading}
      showDeferredContent={showDeferredContent}
      deferredContentRef={deferredContentRef}
      selectedTime={selectedTime}
      setSelectedTime={setSelectedTime}
      selectedColor={selectedColor}
      setSelectedColor={setSelectedColor}
      isCreating={isCreating}
      createError={createError}
      privatePanel={privatePanel}
      privateExpanded={privateExpanded}
      joinId={joinId}
      setJoinId={(value) => {
        setJoinId(value);
        if (joinError) setJoinError(null);
      }}
      joinError={joinError}
      timePresets={TIME_PRESETS}
      learnCards={learnCards}
      openCreatePanel={openCreatePanel}
      openJoinPanel={openJoinPanel}
      closePrivatePanel={closePrivatePanel}
      handleCreateGame={handleCreateGame}
      handleJoinGame={handleJoinGame}
    />
  );
}

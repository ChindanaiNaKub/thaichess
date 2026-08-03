import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { captureProductEvent } from '../lib/analytics';
import { socket, connectSocket } from '../lib/socket';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { mapGameplayErrorMessage } from '../lib/gameplayErrors';
import { liveGameRoute, routes } from '../lib/routes';
import type { PieceColor } from '@shared/types';
import Header from './Header';
import QuickPlayLobbyPanel from './QuickPlayLobbyPanel';
import QuickPlaySearchingPanel from './QuickPlaySearchingPanel';
import {
  BOT_FALLBACK_SECONDS,
  FEATURED_TIME_LABELS,
  REQUEST_PENDING_TIMEOUT_MS,
  TIME_PRESETS,
} from './quickPlayTimePresets';

export default function QuickPlay() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedTime, setSelectedTime] = useState(TIME_PRESETS[3]);
  const [searching, setSearching] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [queueSize, setQueueSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fallbackDismissed, setFallbackDismissed] = useState(false);
  const [showAllTimes, setShowAllTimes] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchingRef = useRef(false);
  const requestPendingRef = useRef(false);
  const autostartDoneRef = useRef(false);
  const latestTRef = useRef(t);
  const findGameSentRef = useRef(false);
  const pendingTimeControlRef = useRef<{ initial: number; increment: number } | null>(null);

  const failPendingRequest = (message?: string) => {
    findGameSentRef.current = false;
    setRequestPending(false);
    setSearching(false);
    setFallbackDismissed(false);
    setError(mapGameplayErrorMessage(message, latestTRef.current, 'quick.load_failed'));
  };

  useEffect(() => {
    searchingRef.current = searching;
  }, [searching]);

  useEffect(() => {
    requestPendingRef.current = requestPending;
  }, [requestPending]);

  // Failsafe: clear "Sending..." if connect / matchmaking_started never arrives.
  // Lives in an effect so StrictMode remounts re-arm it.
  useEffect(() => {
    if (!requestPending) return;
    const id = setTimeout(() => {
      if (requestPendingRef.current && !searchingRef.current) {
        findGameSentRef.current = false;
        setRequestPending(false);
        setSearching(false);
        setFallbackDismissed(false);
        setError(latestTRef.current('quick.load_failed'));
      }
    }, REQUEST_PENDING_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [requestPending]);

  useEffect(() => {
    latestTRef.current = t;
  }, [t]);

  useEffect(() => {
    connectSocket();

    const handleMatchFound = ({ gameId }: { gameId: string; color: PieceColor }) => {
      setSearching(false);
      setRequestPending(false);
      setFallbackDismissed(false);
      setError(null);
      captureProductEvent('game_start', { source: 'matchmaking' });
      navigate(liveGameRoute(gameId));
    };

    const handleMatchmakingStarted = () => {
      setSearching(true);
      setRequestPending(false);
      setFallbackDismissed(false);
      setError(null);
    };

    const handleMatchmakingCancelled = () => {
      setSearching(false);
      setRequestPending(false);
      setFallbackDismissed(false);
    };

    const handleError = ({ message }: { message: string }) => {
      failPendingRequest(message || latestTRef.current('quick.load_failed'));
    };

    const handleConnectError = () => {
      if (!requestPendingRef.current) return;
      failPendingRequest(latestTRef.current('quick.load_failed'));
    };

    const handleQueueStatus = ({ playersInQueue }: { playersInQueue: number }) => {
      setQueueSize(playersInQueue);
    };

    // Persistent connect handler: survives StrictMode remounts, so a search
    // started while disconnected still emits once the socket connects.
    const handleConnect = () => {
      if (!requestPendingRef.current || searchingRef.current) return;
      if (findGameSentRef.current) return;
      const timeControl = pendingTimeControlRef.current;
      if (!timeControl) return;
      findGameSentRef.current = true;
      socket.emit('find_game', { timeControl });
    };

    socket.on('matchmaking_found', handleMatchFound);
    socket.on('matchmaking_started', handleMatchmakingStarted);
    socket.on('matchmaking_cancelled', handleMatchmakingCancelled);
    socket.on('error', handleError);
    socket.on('connect_error', handleConnectError);
    socket.on('queue_status', handleQueueStatus);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('matchmaking_found', handleMatchFound);
      socket.off('matchmaking_started', handleMatchmakingStarted);
      socket.off('matchmaking_cancelled', handleMatchmakingCancelled);
      socket.off('error', handleError);
      socket.off('connect_error', handleConnectError);
      socket.off('queue_status', handleQueueStatus);
      socket.off('connect', handleConnect);
      if (socket.connected && (searchingRef.current || requestPendingRef.current)) {
        socket.emit('cancel_matchmaking');
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (searching) {
      setSearchTime(0);
      intervalRef.current = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [searching]);

  const handleFindGame = () => {
    if (searching || requestPending) return;

    setRequestPending(true);
    setFallbackDismissed(false);
    setError(null);
    findGameSentRef.current = false;
    const timeControl = { initial: selectedTime.initial, increment: selectedTime.increment };
    pendingTimeControlRef.current = timeControl;
    connectSocket();
    if (socket.connected) {
      findGameSentRef.current = true;
      socket.emit('find_game', { timeControl });
    }
  };

  useEffect(() => {
    if (autostartDoneRef.current) return;
    if (searchParams.get('autostart') !== '1') return;

    autostartDoneRef.current = true;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('autostart');
      return next;
    }, { replace: true });

    handleFindGame();
    // Intentional one-shot on mount / first autostart query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams]);

  const handleCancel = () => {
    findGameSentRef.current = false;
    socket.emit('cancel_matchmaking');
    setSearching(false);
    setRequestPending(false);
    setFallbackDismissed(false);
  };

  const handlePlayBotFallback = () => {
    findGameSentRef.current = false;
    socket.emit('cancel_matchmaking');
    setSearching(false);
    setRequestPending(false);
    setFallbackDismissed(false);
    navigate(`${routes.bot}?source=matchmaking_fallback`);
  };

  const ratedEligible = user?.fair_play_status === 'clear';
  const showBotFallback = searching && searchTime >= BOT_FALLBACK_SECONDS && !fallbackDismissed;

  const visiblePresets = useMemo(() => {
    if (showAllTimes) return TIME_PRESETS;
    return TIME_PRESETS.filter(
      (preset) =>
        FEATURED_TIME_LABELS.has(preset.label) || preset.label === selectedTime.label,
    );
  }, [selectedTime.label, showAllTimes]);

  const hasHiddenPresets = TIME_PRESETS.length > visiblePresets.length || showAllTimes;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header subtitle={t('quick.title')} />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
        {searching ? (
          <QuickPlaySearchingPanel
            selectedTime={selectedTime}
            searchTime={searchTime}
            queueSize={queueSize}
            showBotFallback={showBotFallback}
            onPlayBot={handlePlayBotFallback}
            onKeepSearching={() => setFallbackDismissed(true)}
            onCancel={handleCancel}
          />
        ) : (
          <QuickPlayLobbyPanel
            user={user}
            ratedEligible={Boolean(ratedEligible)}
            selectedTime={selectedTime}
            visiblePresets={visiblePresets}
            hasHiddenPresets={hasHiddenPresets}
            showAllTimes={showAllTimes}
            requestPending={requestPending}
            error={error}
            onSelectTime={setSelectedTime}
            onToggleAllTimes={() => setShowAllTimes((open) => !open)}
            onFindGame={handleFindGame}
            onBackHome={() => navigate(routes.home)}
          />
        )}
      </main>
    </div>
  );
}

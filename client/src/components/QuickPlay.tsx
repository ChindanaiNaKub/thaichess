import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { captureProductEvent } from '../lib/analytics';
import { socket, connectSocket } from '../lib/socket';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { liveGameRoute, routes } from '../lib/routes';
import type { PieceColor } from '@shared/types';
import Header from './Header';

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

/** Featured clocks — same progressive set as HomeFriendPanel. */
const FEATURED_TIME_LABELS = new Set(['3+0', '5+0', '10+0', '15+10']);

const BOT_FALLBACK_SECONDS = 12;
/** Clear "Sending…" if connect / matchmaking_started never arrives. */
const REQUEST_PENDING_TIMEOUT_MS = 12_000;

function formatSearchTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

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
    setError(message || latestTRef.current('quick.load_failed'));
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
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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
          <div className="ui-card w-full max-w-md p-6 text-center animate-slideUp sm:p-8">
            <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            <h2 className="text-2xl font-bold text-text-bright mb-2">{t('quick.searching')}</h2>
            <p className="text-text-dim mb-1">
              {selectedTime.label} {t(selectedTime.nameKey)}
            </p>
            <p className="text-text-dim text-sm mb-1">
              {t('quick.search_time', { time: formatSearchTime(searchTime) })}
            </p>
            {queueSize > 0 && (
              <p className="text-text-dim text-xs mb-4">
                {t('quick.queue', { count: queueSize })}
              </p>
            )}
            {showBotFallback && (
              <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-left">
                <h3 className="text-sm font-semibold text-text-bright">{t('quick.fallback_title')}</h3>
                <p className="mt-1 text-xs leading-5 text-text-dim">{t('quick.fallback_desc')}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button type="button"
                    onClick={handlePlayBotFallback}
                    className="button-accent-contrast rounded-lg px-4 py-2 text-sm font-bold"
                  >
                    {t('quick.play_bot_now')}
                  </button>
                  <button type="button"
                    onClick={() => setFallbackDismissed(true)}
                    className="ui-btn-secondary px-4 py-2 text-sm"
                  >
                    {t('quick.keep_searching')}
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button type="button"
                onClick={handleCancel}
                className="ui-btn-secondary flex-1 px-6 py-3 hover:bg-danger/20 hover:text-danger"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="ui-card w-full max-w-lg p-5 animate-slideUp sm:p-6">
            <h2 className="text-2xl font-bold text-text-bright mb-2 text-center">{t('quick.title')}</h2>
            <p className="text-text-dim text-center mb-6 text-sm">{t('quick.desc')}</p>
            <div className="mb-6 rounded-xl border border-surface-hover bg-surface px-4 py-3 text-center">
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                user && ratedEligible
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : user
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-accent/15 text-accent border border-accent/30'
              }`}>
                {user
                  ? ratedEligible
                    ? t('quick.rated_available')
                    : t('quick.rated_unavailable')
                  : t('quick.casual_only')}
              </div>
              <p className="mt-2 text-xs text-text-dim">
                {user
                  ? ratedEligible
                    ? t('quick.rated_signed_in')
                    : t('quick.rated_restricted')
                  : t('quick.rated_sign_in')}
              </p>
            </div>

            <fieldset className="mb-5 min-w-0 border-0 p-0">
              <legend className="text-sm text-text-dim mb-2 block">{t('home.time_control')}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {visiblePresets.map((preset) => (
                  <button type="button"
                    key={preset.label}
                    onClick={() => setSelectedTime(preset)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedTime.label === preset.label
                        ? 'border-accent/50 bg-accent/15 text-accent'
                        : 'border-surface-hover bg-surface text-text hover:bg-surface-hover'
                    }`}
                  >
                    <div className="font-bold">{preset.label}</div>
                    <div className="text-xs opacity-70">{t(preset.nameKey)}</div>
                  </button>
                ))}
              </div>
              {hasHiddenPresets && (
                <button
                  type="button"
                  onClick={() => setShowAllTimes((open) => !open)}
                  className="mt-2 text-xs font-semibold text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
                >
                  {showAllTimes ? t('home.fewer_times') : t('home.more_times')}
                </button>
              )}
            </fieldset>

            <button type="button"
              onClick={handleFindGame}
              disabled={requestPending}
              className="button-accent-contrast w-full rounded-lg px-6 py-3 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {requestPending ? t('common.sending') : t('quick.find')}
            </button>

            {error && (
              <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button type="button"
              onClick={() => navigate(routes.home)}
              className="ui-btn-secondary mt-3 w-full px-6 py-2"
            >
              {t('common.back_home')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

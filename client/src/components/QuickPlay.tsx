import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function QuickPlay() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedTime, setSelectedTime] = useState(TIME_PRESETS[3]);
  const [searching, setSearching] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [queueSize, setQueueSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectHandlerRef = useRef<(() => void) | null>(null);
  const searchingRef = useRef(false);
  const requestPendingRef = useRef(false);

  searchingRef.current = searching;
  requestPendingRef.current = requestPending;

  useEffect(() => {
    connectSocket();

    const handleMatchFound = ({ gameId }: { gameId: string; color: PieceColor }) => {
      setSearching(false);
      setRequestPending(false);
      setError(null);
      navigate(liveGameRoute(gameId));
    };

    const handleMatchmakingStarted = () => {
      setSearching(true);
      setRequestPending(false);
      setError(null);
    };

    const handleMatchmakingCancelled = () => {
      setSearching(false);
      setRequestPending(false);
    };

    const handleError = ({ message }: { message: string }) => {
      setRequestPending(false);
      setSearching(false);
      setError(message);
    };

    const handleQueueStatus = ({ playersInQueue }: { playersInQueue: number }) => {
      setQueueSize(playersInQueue);
    };

    socket.on('matchmaking_found', handleMatchFound);
    socket.on('matchmaking_started', handleMatchmakingStarted);
    socket.on('matchmaking_cancelled', handleMatchmakingCancelled);
    socket.on('error', handleError);
    socket.on('queue_status', handleQueueStatus);

    return () => {
      socket.off('matchmaking_found', handleMatchFound);
      socket.off('matchmaking_started', handleMatchmakingStarted);
      socket.off('matchmaking_cancelled', handleMatchmakingCancelled);
      socket.off('error', handleError);
      socket.off('queue_status', handleQueueStatus);
      if (connectHandlerRef.current) {
        socket.off('connect', connectHandlerRef.current);
        connectHandlerRef.current = null;
      }
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

    connectSocket();
    setRequestPending(true);
    setError(null);

    const emitSearch = () => {
      connectHandlerRef.current = null;
      socket.emit('find_game', {
        timeControl: { initial: selectedTime.initial, increment: selectedTime.increment },
      });
    };

    if (socket.connected) {
      emitSearch();
    } else {
      connectHandlerRef.current = emitSearch;
      socket.once('connect', emitSearch);
    }
  };

  const handleCancel = () => {
    if (connectHandlerRef.current) {
      socket.off('connect', connectHandlerRef.current);
      connectHandlerRef.current = null;
    }
    socket.emit('cancel_matchmaking');
    setSearching(false);
    setRequestPending(false);
  };

  const formatSearchTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  };

  const ratedEligible = user?.fair_play_status === 'clear';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header subtitle={t('quick.title')} />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
        {searching ? (
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 w-full max-w-md text-center animate-slideUp">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
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
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-6 bg-surface-hover hover:bg-danger/20 text-text-bright hover:text-danger font-semibold rounded-lg transition-colors border border-surface-hover"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-5 sm:p-6 w-full max-w-lg animate-slideUp">
            <h2 className="text-2xl font-bold text-text-bright mb-2 text-center">{t('quick.title')}</h2>
            <p className="text-text-dim text-center mb-6 text-sm">{t('quick.desc')}</p>
            <div className="mb-6 rounded-xl border border-surface-hover bg-surface px-4 py-3 text-center">
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                user && ratedEligible
                  ? 'bg-primary/15 text-primary-light border border-primary/30'
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

            <div className="mb-5">
              <label className="text-sm text-text-dim mb-2 block">{t('home.time_control')}</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedTime(preset)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      selectedTime.label === preset.label
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface hover:bg-surface-hover text-text border border-surface-hover'
                    }`}
                  >
                    <div className="font-bold">{preset.label}</div>
                    <div className="text-xs opacity-70">{t(preset.nameKey)}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFindGame}
              disabled={requestPending}
              className="w-full py-3 px-6 bg-accent hover:bg-accent/80 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-lg text-lg transition-colors shadow-md"
            >
              {requestPending ? t('common.sending') : t('quick.find')}
            </button>

            {error && (
              <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              onClick={() => navigate(routes.home)}
              className="w-full mt-3 py-2 px-6 bg-surface hover:bg-surface-hover text-text border border-surface-hover font-medium rounded-lg transition-colors"
            >
              {t('common.back_home')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

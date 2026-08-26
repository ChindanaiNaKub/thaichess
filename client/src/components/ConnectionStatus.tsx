import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import { useTranslation } from '../lib/i18n';

const bannerBaseClass =
  'fixed top-0 left-0 right-0 z-50 border-b px-3 py-2 text-center text-xs font-medium backdrop-blur-sm sm:text-sm';

/** Global socket presence strip — Felt washes aligned with sticky liveError / toast chrome. */
export default function ConnectionStatus() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let connectedHideTimer: ReturnType<typeof setTimeout> | undefined;

    const clearConnectedHideTimer = () => {
      if (connectedHideTimer !== undefined) clearTimeout(connectedHideTimer);
      connectedHideTimer = undefined;
    };

    const onConnect = () => {
      setStatus('connected');
      setShowBanner(true);
      clearConnectedHideTimer();
      connectedHideTimer = setTimeout(() => setShowBanner(false), 2000);
    };
    const onDisconnect = () => {
      setStatus('disconnected');
      setShowBanner(true);
    };
    const onReconnectAttempt = () => {
      setStatus('connecting');
      setShowBanner(true);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);

    if (socket.connected) setStatus('connected');

    return () => {
      if (connectedHideTimer !== undefined) clearTimeout(connectedHideTimer);
      connectedHideTimer = undefined;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
    };
  }, []);

  if (!showBanner) return null;

  if (status === 'connected') {
    return (
      <div
        data-testid="connection-status-banner"
        data-status="connected"
        className={`${bannerBaseClass} border-success/30 bg-success/15 text-success animate-fadeIn`}
      >
        {t('conn.connected')}
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div
        data-testid="connection-status-banner"
        data-status="connecting"
        className={`${bannerBaseClass} flex items-center justify-center gap-2 border-primary/25 bg-primary/15 text-primary-light`}
      >
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-light border-t-transparent" />
        {t('conn.reconnecting')}
      </div>
    );
  }

  return (
    <div
      data-testid="connection-status-banner"
      data-status="disconnected"
      role="alert"
      className={`${bannerBaseClass} border-danger/30 bg-danger/15 text-danger`}
    >
      {t('conn.disconnected')}
    </div>
  );
}

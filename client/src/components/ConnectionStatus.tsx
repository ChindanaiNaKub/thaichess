import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const onConnect = () => {
      setStatus('connected');
      // Show briefly then hide
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 2000);
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
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
    };
  }, []);

  if (!showBanner) return null;

  if (status === 'connected') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 text-white text-center py-1.5 text-sm font-medium animate-fadeIn">
        Connected
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-accent/90 text-white text-center py-1.5 text-sm font-medium flex items-center justify-center gap-2">
        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Reconnecting...
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-danger/90 text-white text-center py-1.5 text-sm font-medium">
      Disconnected — trying to reconnect...
    </div>
  );
}

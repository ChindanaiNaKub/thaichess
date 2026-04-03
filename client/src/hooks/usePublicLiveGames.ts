import { useEffect, useState } from 'react';
import type { PublicLiveGameSummary } from '@shared/types';

interface UsePublicLiveGamesOptions {
  status?: 'live' | 'all';
  limit?: number;
  enabled?: boolean;
}

interface UsePublicLiveGamesResult {
  games: PublicLiveGameSummary[];
  loading: boolean;
}

export function usePublicLiveGames(options: UsePublicLiveGamesOptions = {}): UsePublicLiveGamesResult {
  const { status = 'all', limit = 12, enabled = true } = options;
  const [games, setGames] = useState<PublicLiveGameSummary[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/live-games?status=${status}&limit=${limit}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setGames(Array.isArray(data?.games) ? data.games : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setGames([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, limit, enabled]);

  return { games, loading };
}

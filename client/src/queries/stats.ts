import { queryOptions } from '@tanstack/react-query';

export interface HomeStats {
  totalGames: number;
}

async function fetchHomeStats(): Promise<HomeStats> {
  const response = await fetch('/api/stats');

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.status}`);
  }

  const data = await response.json();
  return {
    totalGames: data?.totalGames ?? 0,
  };
}

export function homeStatsQueryOptions() {
  return queryOptions({
    queryKey: ['stats', 'home'],
    queryFn: fetchHomeStats,
    // Stats change frequently, keep fresh for 30 seconds
    staleTime: 1000 * 30,
    // Don't retry on error (not critical)
    retry: 1,
  });
}

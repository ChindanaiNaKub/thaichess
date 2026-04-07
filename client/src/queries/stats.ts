import { queryOptions } from '@tanstack/react-query';

export interface HomeStats {
  totalGames: number;
}

export interface AboutStats {
  totalGames: number;
  totalMoves: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
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

async function fetchAboutStats(): Promise<AboutStats> {
  const response = await fetch('/api/stats');

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.status}`);
  }

  const data = await response.json();
  return {
    totalGames: data?.totalGames ?? 0,
    totalMoves: data?.totalMoves ?? 0,
    whiteWins: data?.whiteWins ?? 0,
    blackWins: data?.blackWins ?? 0,
    draws: data?.draws ?? 0,
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

export function aboutStatsQueryOptions() {
  return queryOptions({
    queryKey: ['stats', 'about'],
    queryFn: fetchAboutStats,
    // Stats change frequently, keep fresh for 30 seconds
    staleTime: 1000 * 30,
    // Don't retry on error (not critical)
    retry: 1,
  });
}

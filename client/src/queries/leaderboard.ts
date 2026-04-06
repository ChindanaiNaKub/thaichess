import { queryOptions } from '@tanstack/react-query';

export interface LeaderboardEntry {
  id: string;
  display_name: string;
  rating: number;
  rated_games: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface LeaderboardResponse {
  players: LeaderboardEntry[];
  total: number;
}

async function fetchLeaderboard(limit: number = 50): Promise<LeaderboardResponse> {
  const response = await fetch(`/api/leaderboard?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.status}`);
  }

  return response.json();
}

export function leaderboardQueryOptions(limit: number = 50) {
  return queryOptions({
    queryKey: ['leaderboard', { limit }],
    queryFn: () => fetchLeaderboard(limit),
    // Leaderboard changes less frequently, cache for 2 minutes
    staleTime: 1000 * 60 * 2,
    // Keep data for 10 minutes even when not in use
    gcTime: 1000 * 60 * 10,
  });
}

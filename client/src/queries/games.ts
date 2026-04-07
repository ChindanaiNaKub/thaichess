import { queryOptions, keepPreviousData } from '@tanstack/react-query';

// Types matching your GamesPage
export interface GameEntry {
  id: string;
  white_name: string;
  black_name: string;
  result: string;
  result_reason: string;
  rated?: number;
  game_mode?: string;
  game_type?: 'human' | 'bot';
  opponent_type?: string | null;
  opponent_name?: string | null;
  bot_level?: number | null;
  white_rating_before?: number | null;
  black_rating_before?: number | null;
  white_rating_after?: number | null;
  black_rating_after?: number | null;
  time_control_initial: number;
  time_control_increment: number;
  move_count: number;
  finished_at: number;
}

export interface BotPerformanceStats {
  gamesCount: number;
  winRate: number;
  highestBotLevelDefeated: number | null;
}

export interface GamesResponse {
  games: GameEntry[];
  total: number;
  botStats: BotPerformanceStats;
}

export type GamesFilter = 'all' | 'rated' | 'casual' | 'bot';

// API function
async function fetchGames(
  page: number,
  limit: number,
  filter: GamesFilter,
): Promise<GamesResponse> {
  const response = await fetch(
    `/api/games/recent?page=${page}&limit=${limit}&filter=${filter}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch games: ${response.status}`);
  }

  return response.json();
}

// Query options factory
export function gamesQueryOptions(
  page: number,
  limit: number,
  filter: GamesFilter,
) {
  return queryOptions({
    queryKey: ['games', 'recent', { page, limit, filter }],
    queryFn: () => fetchGames(page, limit, filter),
    placeholderData: keepPreviousData, // Keep showing old data while fetching new page
    staleTime: 1000 * 60, // Games list stays fresh for 1 minute
  });
}

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

// ============================================
// Game Database Search
// ============================================

export interface GameSearchParams {
  player?: string;
  minRating?: number;
  maxRating?: number;
  result?: 'white' | 'black' | 'draw';
  gameMode?: string;
  rated?: boolean;
  fromDate?: string; // ISO date string
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface GameSearchResponse {
  games: GameEntry[];
  total: number;
  page: number;
  limit: number;
}

async function fetchGameSearch(params: GameSearchParams): Promise<GameSearchResponse> {
  const searchParams = new URLSearchParams();
  if (params.player) searchParams.set('player', params.player);
  if (typeof params.minRating === 'number') searchParams.set('minRating', String(params.minRating));
  if (typeof params.maxRating === 'number') searchParams.set('maxRating', String(params.maxRating));
  if (params.result) searchParams.set('result', params.result);
  if (params.gameMode) searchParams.set('gameMode', params.gameMode);
  if (typeof params.rated === 'boolean') searchParams.set('rated', String(params.rated));
  if (params.fromDate) searchParams.set('fromDate', String(Math.floor(new Date(params.fromDate).getTime() / 1000)));
  if (params.toDate) searchParams.set('toDate', String(Math.floor(new Date(params.toDate).getTime() / 1000)));
  searchParams.set('page', String(params.page ?? 0));
  searchParams.set('limit', String(params.limit ?? 20));

  const response = await fetch(`/api/games/search?${searchParams}`);
  if (!response.ok) {
    throw new Error(`Failed to search games: ${response.status}`);
  }
  return response.json();
}

export function gameSearchQueryOptions(params: GameSearchParams) {
  return queryOptions({
    queryKey: ['games', 'search', params],
    queryFn: () => fetchGameSearch(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}

// ============================================
// Opening Explorer
// ============================================

export interface OpeningMoveStat {
  moveUci: string;
  totalGames: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
  avgWhiteRating: number | null;
  avgBlackRating: number | null;
}

export interface OpeningStatsResponse {
  positionHash: string;
  totalGames: number;
  moves: OpeningMoveStat[];
}

export interface OpeningGamesResponse {
  games: GameEntry[];
  total: number;
  page: number;
  limit: number;
  position: string;
  move: string | null;
}

async function fetchOpeningStats(position: string): Promise<OpeningStatsResponse> {
  const response = await fetch(`/api/openings/stats?position=${encodeURIComponent(position)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch opening stats: ${response.status}`);
  }
  return response.json();
}

async function fetchOpeningGames(position: string, moveUci?: string, page: number = 0, limit: number = 20): Promise<OpeningGamesResponse> {
  const params = new URLSearchParams();
  params.set('position', position);
  if (moveUci) params.set('move', moveUci);
  params.set('page', String(page));
  params.set('limit', String(limit));

  const response = await fetch(`/api/openings/games?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch opening games: ${response.status}`);
  }
  return response.json();
}

export function openingStatsQueryOptions(position: string) {
  return queryOptions({
    queryKey: ['openings', 'stats', position],
    queryFn: () => fetchOpeningStats(position),
    staleTime: 1000 * 30,
  });
}

export function openingGamesQueryOptions(position: string, moveUci?: string, page: number = 0, limit: number = 20) {
  return queryOptions({
    queryKey: ['openings', 'games', position, moveUci ?? 'all', { page, limit }],
    queryFn: () => fetchOpeningGames(position, moveUci, page, limit),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });
}

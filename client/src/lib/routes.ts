export const routes = {
  home: '/',
  local: '/local',
  bot: '/bot',
  puzzles: '/puzzles',
  quickPlay: '/quick-play',
  about: '/about',
  games: '/games',
  leaderboard: '/leaderboard',
  feedback: '/feedback',
  login: '/login',
  account: '/account',
  analysisRoot: '/analysis',
  liveGamePattern: '/game/:gameId',
  puzzlePattern: '/puzzle/:id',
  analysisPattern: '/analysis/:gameId',
} as const;

export function liveGameRoute(gameId: string): string {
  return `/game/${gameId}`;
}

export function savedGameAnalysisRoute(gameId: string): string {
  return `/analysis/${gameId}`;
}

export function puzzleRoute(id: string): string {
  return `/puzzle/${id}`;
}

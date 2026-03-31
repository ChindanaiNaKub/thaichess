export const routes = {
  home: '/',
  local: '/local',
  bot: '/bot',
  puzzles: '/puzzles',
  lessons: '/lessons',
  course: '/course',
  coursePath: '/course-path',
  learn: '/lessons',
  legacyLearn: '/learn',
  watch: '/watch',
  quickPlay: '/quick-play',
  about: '/about',
  games: '/games',
  leaderboard: '/leaderboard',
  whatIsMakruk: '/what-is-makruk',
  howToPlayMakruk: '/how-to-play-makruk',
  playMakrukOnline: '/play-makruk-online',
  feedback: '/feedback',
  login: '/login',
  account: '/account',
  appearanceSettings: '/settings/board-pieces',
  analysisRoot: '/analysis',
  liveGamePattern: '/game/:gameId',
  spectatorGamePattern: '/spectate/:gameId',
  lessonPattern: '/lessons/:id',
  coursePattern: '/course/:id',
  legacyLessonPattern: '/learn/:id',
  puzzlePattern: '/puzzle/:id',
  analysisPattern: '/analysis/:gameId',
} as const;

export function liveGameRoute(gameId: string): string {
  return `/game/${gameId}`;
}

export function spectatorGameRoute(gameId: string): string {
  return `/spectate/${gameId}`;
}

export function watchRoute(): string {
  return routes.watch;
}

export function savedGameAnalysisRoute(gameId: string): string {
  return `/analysis/${gameId}`;
}

export function lessonRoute(id: string): string {
  return `/lessons/${id}`;
}

export function puzzleRoute(id: string): string {
  return `/puzzle/${id}`;
}

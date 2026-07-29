/**
 * Database facade — re-exports domain modules for stable import paths.
 * Implementation lives in ./database/*.
 */

export {
  initDatabase,
  getDatabaseStats,
  getLibsqlConnectionOptions,
  getDatabaseConfig,
} from './database/connection';

export {
  INITIAL_USER_RATING,
  getLeaderboard,
  getLeaderboardCount,
  createLoginCode,
  getLoginCodeByEmail,
  markLoginCodeAttempt,
  consumeLoginCode,
  upsertUserByEmail,
  getUserByEmail,
  getUserById,
  updateUsername,
  getUsernameChangeCooldown,
  createSession,
  cleanupExpiredSessions,
  cleanupExpiredLoginCodes,
  cleanupExpiredVerifications,
  cleanupExpiredAuthSessions,
  runAllCleanupJobs,
  getUserBySessionTokenHash,
  deleteSessionByTokenHash,
  deleteUser,
  type AuthUser,
  type LeaderboardEntry,
} from './database/auth';

export {
  saveCompletedGame,
  getRecentGames,
  getGame,
  searchGames,
  getOpeningStats,
  getPositionGames,
  getGameCount,
  getBotPerformanceStats,
  getStats,
  type SavedGame,
  type RecentGamesFilter,
  type GameSearchParams,
  type GameSearchResult,
  type OpeningMoveStat,
  type OpeningStatsResult,
  type BotPerformanceStats,
} from './database/games';

export {
  getCachedGameAnalysis,
  saveCachedGameAnalysis,
  type GameAnalysisCacheRecord,
} from './database/analysisCache';

export {
  saveFeedback,
  getFeedback,
  getFeedbackCount,
  getFeedbackForAdmin,
  moderateFeedback,
  type SavedFeedback,
} from './database/feedback';

export type {
  FairPlayStatus,
  FairPlayEventType,
  FairPlayCaseStatus,
} from './database/fairPlay';

export {
  recordFairPlayEvent,
  getFairPlayCases,
  getFairPlayCaseCount,
  dismissFairPlayCase,
  restrictUserForFairPlay,
  clearFairPlayRestriction,
  type FairPlayEventRecord,
  type FairPlayCaseRecord,
} from './database/fairPlay';

export {
  getPuzzleProgressForUser,
  getCompletedPuzzleIdsForUser,
  markPuzzlePlayed,
  markPuzzleCompleted,
  markPuzzleAttempt,
  mergePuzzleProgress,
  mergeCompletedPuzzles,
  type PuzzleProgressRecord,
} from './database/puzzleProgress';

import { z } from 'zod';

/**
 * API Endpoint Validation Schemas
 * 
 * These schemas validate request bodies for REST API endpoints.
 * Use in Express route handlers to ensure type safety at runtime.
 * 
 * @example
 * ```typescript
 * app.post('/api/auth/request-code', (req, res) => {
 *   const result = RequestCodeSchema.safeParse(req.body);
 *   if (!result.success) {
 *     return res.status(400).json({ error: 'Invalid email' });
 *   }
 *   // result.data.email is now type-safe
 * });
 * ```
 */

// ============================================
// Auth Endpoints
// ============================================

export const RequestCodeSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .transform((email) => email.trim().toLowerCase()),
});
export type RequestCodePayload = z.infer<typeof RequestCodeSchema>;

export const VerifyCodeSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .transform((email) => email.trim().toLowerCase()),
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});
export type VerifyCodePayload = z.infer<typeof VerifyCodeSchema>;

export const UpdateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[A-Za-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .transform((username) => username.trim()),
});
export type UpdateProfilePayload = z.infer<typeof UpdateProfileSchema>;

// ============================================
// Feedback Endpoints
// ============================================

export const SubmitFeedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'other']).default('bug'),
  message: z.string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long (max 2000 characters)')
    .transform((msg) => msg.trim()),
  page: z.string().max(500).optional().default('unknown'),
  userAgent: z.string().max(500).optional(),
});
export type SubmitFeedbackPayload = z.infer<typeof SubmitFeedbackSchema>;

// ============================================
// Fair Play Endpoints
// ============================================

export const ReportFairPlaySchema = z.object({
  gameId: z.string()
    .min(4, 'Game ID too short')
    .max(64, 'Game ID too long')
    .regex(/^[A-Za-z0-9-]+$/, 'Invalid game ID format'),
  message: z.string()
    .max(500, 'Message too long (max 500 characters)')
    .optional()
    .transform((msg) => msg?.trim() || ''),
});
export type ReportFairPlayPayload = z.infer<typeof ReportFairPlaySchema>;

export const FairPlayCaseActionSchema = z.object({
  note: z.string()
    .max(500, 'Note too long (max 500 characters)')
    .optional()
    .transform((note) => note?.trim()),
});
export type FairPlayCaseActionPayload = z.infer<typeof FairPlayCaseActionSchema>;

// ============================================
// Game Endpoints
// ============================================

export const SaveBotGameSchema = z.object({
  id: z.string()
    .min(4, 'Game ID too short')
    .max(64, 'Game ID too long')
    .regex(/^[A-Za-z0-9-]+$/, 'Invalid game ID format'),
  result: z.enum(['white', 'black', 'draw']),
  resultReason: z.string().min(1, 'Result reason is required'),
  playerColor: z.enum(['white', 'black']),
  level: z.number()
    .int()
    .min(1, 'Level must be at least 1')
    .max(10, 'Level must be at most 10')
    .default(5),
  botId: z.string()
    .min(1)
    .max(100)
    .optional(),
  moves: z.array(z.any()),
  finalBoard: z.array(z.any()).min(1, 'Final board is required'),
  moveCount: z.number().int().min(0).optional(),
  timeControl: z.object({
    initial: z.number().int().min(10).max(7200),
    increment: z.number().int().min(0).max(60),
  }),
  playerName: z.string()
    .max(50, 'Player name too long')
    .optional()
    .transform((name) => name?.trim()),
});
export type SaveBotGamePayload = z.infer<typeof SaveBotGameSchema>;

export const SaveLocalGameSchema = z.object({
  id: z.string()
    .min(4, 'Game ID too short')
    .max(64, 'Game ID too long')
    .regex(/^[A-Za-z0-9-]+$/, 'Invalid game ID format'),
  result: z.enum(['white', 'black', 'draw']),
  resultReason: z.string().min(1, 'Result reason is required'),
  whiteName: z.string()
    .max(50, 'White player name too long')
    .optional()
    .transform((name) => name?.trim()),
  blackName: z.string()
    .max(50, 'Black player name too long')
    .optional()
    .transform((name) => name?.trim()),
  moves: z.array(z.any()),
  finalBoard: z.array(z.any()).min(1, 'Final board is required'),
  moveCount: z.number().int().min(0).optional(),
  timeControl: z.object({
    initial: z.number().int().min(10).max(7200),
    increment: z.number().int().min(0).max(60),
  }),
});
export type SaveLocalGamePayload = z.infer<typeof SaveLocalGameSchema>;

// ============================================
// Analysis Endpoints
// ============================================

export const AnalyzeGameSchema = z.object({
  analysisId: z.string()
    .min(1)
    .max(100)
    .regex(/^[A-Za-z0-9:_-]+$/, 'Invalid analysis ID format')
    .optional()
    .nullable(),
  moves: z.array(z.any()).min(1, 'Moves are required'),
  depth: z.number().int().min(1).max(30).optional(),
  movetimeMs: z.number().int().min(100).max(30000).optional(),
});
export type AnalyzeGamePayload = z.infer<typeof AnalyzeGameSchema>;

export const AnalyzePositionSchema = z.object({
  position: z.string().min(1, 'Position is required'),
  counting: z.string().optional().nullable(),
  depth: z.number().int().min(1).max(30).optional(),
  movetimeMs: z.number().int().min(100).max(30000).optional(),
  nodes: z.number().int().min(1000).max(10000000).optional(),
  multipv: z.number().int().min(1).max(5).optional().default(1),
});
export type AnalyzePositionPayload = z.infer<typeof AnalyzePositionSchema>;

export const BotMoveSchema = z.object({
  position: z.string().min(1, 'Position is required'),
  counting: z.string().optional().nullable(),
  level: z.number().int().min(1).max(10).default(5),
  botId: z.string().min(1).max(100).optional(),
});
export type BotMovePayload = z.infer<typeof BotMoveSchema>;

// ============================================
// Puzzle Progress Endpoints
// ============================================

export const PuzzleVisitSchema = z.object({
  puzzleId: z.number().int().positive('Puzzle ID must be positive'),
});
export type PuzzleVisitPayload = z.infer<typeof PuzzleVisitSchema>;

export const PuzzleCompleteSchema = z.object({
  puzzleId: z.number().int().positive('Puzzle ID must be positive'),
});
export type PuzzleCompletePayload = z.infer<typeof PuzzleCompleteSchema>;

export const PuzzleAttemptSchema = z.object({
  puzzleId: z.number().int().positive('Puzzle ID must be positive'),
  succeeded: z.boolean(),
});
export type PuzzleAttemptPayload = z.infer<typeof PuzzleAttemptSchema>;

export const PuzzleSyncSchema = z.object({
  progressRecords: z.array(z.object({
    puzzleId: z.number().int().positive(),
    lastPlayedAt: z.number().int().positive(),
    completedAt: z.number().int().positive().nullable().optional(),
    attempts: z.number().int().min(0).default(0),
    successes: z.number().int().min(0).default(0),
    failures: z.number().int().min(0).default(0),
  })).optional(),
  completedPuzzleIds: z.array(z.number().int().positive()).optional(),
}).refine(
  (data) => data.progressRecords !== undefined || data.completedPuzzleIds !== undefined,
  { message: 'Either progressRecords or completedPuzzleIds is required', path: ['progressRecords'] }
);
export type PuzzleSyncPayload = z.infer<typeof PuzzleSyncSchema>;

// ============================================
// Client Error Reporting
// ============================================

export const ClientErrorSchema = z.object({
  source: z.string().max(100).optional(),
  message: z.string().min(1, 'Message is required').max(1000),
  stack: z.string().max(5000).optional(),
  componentStack: z.string().max(5000).optional(),
  url: z.string().max(1000).optional(),
  userAgent: z.string().max(500).optional(),
});
export type ClientErrorPayload = z.infer<typeof ClientErrorSchema>;

export const ClientDebugSchema = z.object({
  entries: z.array(z.object({
    event: z.string().max(100),
    ts: z.number().int().optional(),
    path: z.string().max(500).optional(),
    detail: z.record(z.string(), z.any()).optional(),
  })).min(1).max(25, 'Too many debug entries (max 25)'),
  url: z.string().max(1000).optional(),
  userAgent: z.string().max(500).optional(),
});
export type ClientDebugPayload = z.infer<typeof ClientDebugSchema>;

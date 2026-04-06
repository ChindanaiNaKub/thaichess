import { z } from 'zod';

/**
 * Core game type schemas
 * Mirrors shared/types.ts with runtime validation
 */

export const PieceColorSchema = z.enum(['white', 'black']);
export type PieceColor = z.infer<typeof PieceColorSchema>;

export const PrivateGameColorPreferenceSchema = z.union([
  PieceColorSchema,
  z.literal('random'),
]);
export type PrivateGameColorPreference = z.infer<typeof PrivateGameColorPreferenceSchema>;

export const GameModeSchema = z.enum(['quick_play', 'private', 'bot', 'local']);
export type GameMode = z.infer<typeof GameModeSchema>;

export const PlayerPresenceStatusSchema = z.enum(['active', 'idle', 'away', 'disconnected']);
export type PlayerPresenceStatus = z.infer<typeof PlayerPresenceStatusSchema>;

export const ResultReasonSchema = z.enum([
  'checkmate',
  'stalemate',
  'insufficient_material',
  'counting_rule',
  'draw_agreement',
  'resignation',
  'timeout',
]).nullable();
export type ResultReason = z.infer<typeof ResultReasonSchema>;

export const CountingRuleTypeSchema = z.enum(['board_honor', 'pieces_honor']);
export type CountingRuleType = z.infer<typeof CountingRuleTypeSchema>;

export const PieceTypeSchema = z.enum(['K', 'M', 'S', 'R', 'N', 'P', 'PM']);
export type PieceType = z.infer<typeof PieceTypeSchema>;

export const PieceSchema = z.object({
  type: PieceTypeSchema,
  color: PieceColorSchema,
});
export type Piece = z.infer<typeof PieceSchema>;

export const PositionSchema = z.object({
  row: z.number().int().min(0).max(7),
  col: z.number().int().min(0).max(7),
});
export type Position = z.infer<typeof PositionSchema>;

export const MoveSchema = z.object({
  from: PositionSchema,
  to: PositionSchema,
  movedPiece: PieceSchema.optional(),
  captured: PieceSchema.nullable().optional(),
  capturedPiece: PieceSchema.nullable().optional(),
  promoted: z.boolean().optional(),
  promotion: PieceTypeSchema.nullable().optional(),
});
export type Move = z.infer<typeof MoveSchema>;

export const LastMoveSchema = z.object({
  from: PositionSchema,
  to: PositionSchema,
  movedPiece: PieceSchema,
  capturedPiece: PieceSchema.nullable().optional(),
  promotion: PieceTypeSchema.nullable().optional(),
});
export type LastMove = z.infer<typeof LastMoveSchema>;

export const BoardSchema = z.array(
  z.array(PieceSchema.nullable())
).length(8).refine(
  (board) => board.every(row => row.length === 8),
  { message: 'Board must be 8x8' }
);
export type Board = z.infer<typeof BoardSchema>;

export const CountingStateSchema = z.object({
  active: z.boolean(),
  type: CountingRuleTypeSchema,
  countingColor: PieceColorSchema,
  strongerColor: PieceColorSchema,
  currentCount: z.number().int().min(0),
  startCount: z.number().int().min(0).optional(),
  limit: z.number().int().min(0),
  finalAttackPending: z.boolean(),
});
export type CountingState = z.infer<typeof CountingStateSchema>;

export const GameStateSchema = z.object({
  board: BoardSchema,
  turn: PieceColorSchema,
  moveHistory: z.array(MoveSchema),
  lastMove: LastMoveSchema.nullable(),
  isCheck: z.boolean(),
  isCheckmate: z.boolean(),
  isStalemate: z.boolean(),
  isDraw: z.boolean(),
  gameOver: z.boolean(),
  winner: PieceColorSchema.nullable(),
  resultReason: ResultReasonSchema,
  counting: CountingStateSchema.nullable(),
  whiteTime: z.number().int().min(0),
  blackTime: z.number().int().min(0),
  lastMoveTime: z.number().int().min(0),
  moveCount: z.number().int().min(0),
});
export type GameState = z.infer<typeof GameStateSchema>;

export const TimeControlSchema = z.object({
  initial: z.number().int().min(0),
  increment: z.number().int().min(0),
});
export type TimeControl = z.infer<typeof TimeControlSchema>;

export const PlayerPresenceSchema = z.object({
  status: PlayerPresenceStatusSchema,
  latencyMs: z.number().int().nullable(),
  lastSeenAt: z.number().int().nullable(),
});
export type PlayerPresence = z.infer<typeof PlayerPresenceSchema>;

import { z } from 'zod';
import { BoardSchema, CountingStateSchema, PieceColorSchema } from './types';

/**
 * Puzzle Validation Schemas
 * 
 * These schemas provide runtime validation for puzzle data.
 * They complement the manual validation in puzzleValidation.ts
 * by ensuring data structure integrity before business logic validation.
 */

export const PuzzleReviewChecklistSchema = z.object({
  themeClarity: z.enum(['pass', 'fail', 'unreviewed']),
  teachingValue: z.enum(['pass', 'fail', 'unreviewed']),
  duplicateRisk: z.enum(['clear', 'duplicate', 'unreviewed']),
  reviewNotes: z.string(),
});

export const PuzzleGoalResultSchema = z.enum(['white-win', 'black-win', 'draw']);

export const PuzzleOutcomeReasonSchema = z.enum([
  'checkmate',
  'stalemate',
  'insufficient_material',
  'counting_rule',
  'draw_agreement',
  'resignation',
  'timeout',
  'material_win',
  'promotion',
  'draw_saved',
  'win_before_count',
]);

export const PuzzleMoveReferenceSchema = z.object({
  from: z.object({
    row: z.number().int().min(0).max(7),
    col: z.number().int().min(0).max(7),
  }),
  to: z.object({
    row: z.number().int().min(0).max(7),
    col: z.number().int().min(0).max(7),
  }),
});

export const PuzzleGoalSchema = z.object({
  kind: z.enum(['checkmate', 'promotion', 'material-win', 'draw']),
  result: PuzzleGoalResultSchema,
  reason: PuzzleOutcomeReasonSchema,
  minMaterialSwing: z.number().int().optional(),
});

export const PuzzleAcceptedMoveSchema = z.object({
  move: PuzzleMoveReferenceSchema,
  lineId: z.string(),
  explanation: z.string(),
});

export const PuzzleSolutionLineSchema = z.object({
  id: z.string(),
  label: z.string(),
  moves: z.array(PuzzleMoveReferenceSchema),
  outcome: z.object({
    result: PuzzleGoalResultSchema,
    reason: PuzzleOutcomeReasonSchema,
    explanation: z.string(),
  }),
});

export const PuzzleDifficultyProfileSchema = z.object({
  candidateMoveCount: z.number().int().min(0),
  tacticalVisibility: z.enum(['obvious', 'moderate', 'hidden']),
  countingAwareness: z.boolean(),
  deceptive: z.boolean(),
  moveNature: z.enum(['forcing', 'quiet']),
});

export const PuzzlePositionAuthoritySchema = z.enum(['explicit_piece_list', 'replay_validated']);
export const PuzzleSolutionAuthoritySchema = z.enum(['engine_confirmed', 'authoritative_line']);
export const PuzzleProgressionStageSchema = z.enum(['early', 'mid', 'late']);
export const PuzzlePoolSchema = z.enum(['standard', 'advanced_only']);

export const PuzzlePiecePlacementSchema = z.object({
  square: z.string().regex(/^[a-h][1-8]$/),
  type: z.enum(['K', 'M', 'S', 'R', 'N', 'P', 'PM']),
  color: PieceColorSchema,
});

export const PuzzleOriginSchema = z.enum([
  'lichess-import',
  'manual-curation',
  'engine-generated',
  'community-submission',
]);

export const PuzzleSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string(),
  explanation: z.string(),
  source: z.string(),
  origin: PuzzleOriginSchema,
  sourceGameId: z.string().nullable(),
  sourcePly: z.number().int().nullable(),
  theme: z.string(),
  motif: z.string(),
  tags: z.array(z.string()),
  difficultyScore: z.number().int(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  difficultyProfile: PuzzleDifficultyProfileSchema,
  progressionStage: PuzzleProgressionStageSchema,
  pool: PuzzlePoolSchema,
  minimumStreakRequired: z.number().int().min(0),
  reviewStatus: z.enum(['ship', 'quarantine']),
  reviewChecklist: PuzzleReviewChecklistSchema,
  positionAuthority: PuzzlePositionAuthoritySchema,
  solutionAuthority: PuzzleSolutionAuthoritySchema,
  boardOrientation: PieceColorSchema,
  pieceList: z.array(PuzzlePiecePlacementSchema),
  objective: z.string(),
  whyPositionMatters: z.string(),
  dependsOnCounting: z.boolean(),
  ruleImpact: z.string(),
  goal: PuzzleGoalSchema,
  acceptedMoves: z.array(PuzzleAcceptedMoveSchema).min(1),
  solutionLines: z.array(PuzzleSolutionLineSchema).min(1),
  hint1: z.string(),
  hint2: z.string(),
  keyIdea: z.string(),
  commonWrongMove: PuzzleMoveReferenceSchema.nullable(),
  wrongMoveExplanation: z.string(),
  takeaway: z.string(),
  boardPosition: z.object({
    board: BoardSchema,
    counting: CountingStateSchema.nullable(),
  }),
  setupMoves: z.array(PuzzleMoveReferenceSchema).optional(),
  sideToMove: PieceColorSchema,
  toMove: PieceColorSchema,
  board: BoardSchema,
  counting: CountingStateSchema.nullable(),
  solution: z.array(PuzzleMoveReferenceSchema),
});

export type Puzzle = z.infer<typeof PuzzleSchema>;

/**
 * Validates a puzzle object at runtime.
 * Returns the validated puzzle or throws a ZodError with detailed messages.
 */
export function validatePuzzleSchema(data: unknown): Puzzle {
  return PuzzleSchema.parse(data);
}

/**
 * Safe puzzle validation that returns success/failure instead of throwing.
 */
export function safeValidatePuzzle(data: unknown): { success: true; data: Puzzle } | { success: false; errors: z.ZodError } {
  const result = PuzzleSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

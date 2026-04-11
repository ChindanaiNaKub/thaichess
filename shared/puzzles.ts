import type { Board, CountingState, Piece, PieceColor, PieceType, Position, ResultReason } from './types';
import { IMPORTED_PUZZLE_CANDIDATES } from './puzzleImportQueue';
import type { PuzzleOrigin } from './puzzleMetadata';
import { finalizePuzzle, type RawPuzzle } from './puzzleCatalog';
import { validatePuzzle, type PuzzleValidationResult } from './puzzleValidation';
import { buildPuzzlePublishAudit, isPuzzlePublishable } from './puzzlePublishing';
import type { PuzzlePiecePlacement } from './puzzlePosition';

export interface PuzzleReviewChecklist {
  themeClarity: 'pass' | 'fail' | 'unreviewed';
  teachingValue: 'pass' | 'fail' | 'unreviewed';
  duplicateRisk: 'clear' | 'duplicate' | 'unreviewed';
  reviewNotes: string;
}

export type PuzzleGoalResult = 'white-win' | 'black-win' | 'draw';
export type PuzzleOutcomeReason =
  | Exclude<ResultReason, null>
  | 'material_win'
  | 'promotion'
  | 'draw_saved'
  | 'win_before_count';

export interface PuzzleMoveReference {
  from: Position;
  to: Position;
}

export interface PuzzleGoal {
  kind: 'checkmate' | 'promotion' | 'material-win' | 'draw';
  result: PuzzleGoalResult;
  reason: PuzzleOutcomeReason;
  minMaterialSwing?: number;
}

export interface PuzzleAcceptedMove {
  move: PuzzleMoveReference;
  lineId: string;
  explanation: string;
}

export interface PuzzleSolutionLine {
  id: string;
  label: string;
  moves: PuzzleMoveReference[];
  outcome: {
    result: PuzzleGoalResult;
    reason: PuzzleOutcomeReason;
    explanation: string;
  };
}

export interface PuzzleBoardPosition {
  board: Board;
  counting: CountingState | null;
}

export interface PuzzleDifficultyProfile {
  candidateMoveCount: number;
  tacticalVisibility: 'obvious' | 'moderate' | 'hidden';
  countingAwareness: boolean;
  deceptive: boolean;
  moveNature: 'forcing' | 'quiet';
}

export type PuzzleVerificationEngineSource = 'none' | 'local' | 'service' | 'binary';
export type PuzzleVerificationStatus = 'unverified' | 'solver_verified' | 'engine_verified' | 'ambiguous' | 'count_invalid';
export type PuzzleCountCriticality = 'none' | 'active' | 'critical';

export interface PuzzleVerification {
  engineSource: PuzzleVerificationEngineSource;
  searchDepth: number | null;
  searchNodes: number | null;
  multiPvGap: number | null;
  onlyMoveChainLength: number;
  countCriticality: PuzzleCountCriticality;
  verificationStatus: PuzzleVerificationStatus;
}

export type PuzzlePositionAuthority = 'explicit_piece_list' | 'replay_validated';
export type PuzzleSolutionAuthority = 'engine_confirmed' | 'authoritative_line';
export type PuzzleProgressionStage = 'early' | 'mid' | 'late';
export type PuzzleStreakTier = 'foundation' | 'practical_attack' | 'forcing_conversion' | 'mate_pressure';
export type PuzzlePool = 'standard' | 'advanced_only';

export interface Puzzle {
  id: number;
  title: string;
  description: string;
  explanation: string;
  source: string;
  origin: PuzzleOrigin;
  sourceGameId: string | null;
  sourcePly: number | null;
  sourceLicense: string | null;
  sourceGameUrl: string | null;
  theme: string;
  motif: string;
  tags: string[];
  positionKey: string;
  verification: PuzzleVerification;
  duplicateOf: number | null;
  difficultyScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  difficultyProfile: PuzzleDifficultyProfile;
  progressionStage: PuzzleProgressionStage;
  streakTier: PuzzleStreakTier;
  pool: PuzzlePool;
  minimumStreakRequired: number;
  reviewStatus: 'ship' | 'quarantine';
  reviewChecklist: PuzzleReviewChecklist;
  positionAuthority: PuzzlePositionAuthority;
  solutionAuthority: PuzzleSolutionAuthority;
  boardOrientation: PieceColor;
  pieceList: PuzzlePiecePlacement[];
  objective: string;
  whyPositionMatters: string;
  dependsOnCounting: boolean;
  ruleImpact: string;
  goal: PuzzleGoal;
  acceptedMoves: PuzzleAcceptedMove[];
  solutionLines: PuzzleSolutionLine[];
  hint1: string;
  hint2: string;
  keyIdea: string;
  commonWrongMove: PuzzleMoveReference | null;
  wrongMoveExplanation: string;
  takeaway: string;
  boardPosition: PuzzleBoardPosition;
  setupMoves?: PuzzleMoveReference[];
  sideToMove: PieceColor;
  toMove: PieceColor;
  board: Board;
  counting: CountingState | null;
  solution: PuzzleMoveReference[];
}

export interface PuzzlePoolDiagnostics {
  totalCandidates: number;
  validCandidates: number;
  shippedCandidates: number;
  rejectedCandidates: number;
  rejectionReasons: Array<{ reason: string; count: number }>;
  publishableByDifficulty?: Record<Puzzle['difficulty'], number>;
  publishableBySource?: {
    curated: number;
    generated: number;
  };
}

export interface PuzzlePublishAuditRow {
  id: number;
  title: string;
  sourceType: 'curated' | 'generated';
  sourceLicense: string | null;
  positionKey: string;
  duplicateOf: number | null;
  objective: string;
  motif: string;
  dependsOnCounting: boolean;
  verificationStatus: PuzzleVerificationStatus;
  multiPvGap: number | null;
  legalityStatus: 'valid' | 'invalid';
  validationErrors: string[];
  validationWarnings: string[];
  bestMove: PuzzleMoveReference | null;
  acceptedMoves: PuzzleAcceptedMove[];
  hint1: string;
  hint2: string;
  keyIdea: string;
  commonWrongMove: PuzzleMoveReference | null;
  wrongMoveExplanation: string;
  takeaway: string;
  publishable: boolean;
  classification: 'Keep' | 'Rewrite' | 'Reject';
  classificationReasons: string[];
}

export interface PuzzlePoolBreakdown {
  publishableByDifficulty: Record<Puzzle['difficulty'], number>;
  publishableBySource: {
    curated: number;
    generated: number;
  };
}

type Placement = [square: string, type: PieceType, color: PieceColor];

function p(type: PieceType, color: PieceColor): Piece {
  return { type, color };
}

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function square(name: string): Position {
  if (!/^[a-h][1-8]$/.test(name)) {
    throw new Error(`Invalid square: ${name}`);
  }

  return {
    col: name.charCodeAt(0) - 97,
    row: parseInt(name[1], 10) - 1,
  };
}

function board(...placements: Placement[]): Board {
  const next = emptyBoard();

  for (const [name, type, color] of placements) {
    const { row, col } = square(name);
    next[row][col] = p(type, color);
  }

  return next;
}

function move(from: string, to: string): PuzzleMoveReference {
  return {
    from: square(from),
    to: square(to),
  };
}

function line(...steps: string[]): PuzzleMoveReference[] {
  return steps.map(step => {
    const [from, to] = step.split('-');
    if (!from || !to) {
      throw new Error(`Invalid move step: ${step}`);
    }

    return move(from, to);
  });
}

function shippedReview(reviewNotes: string): PuzzleReviewChecklist {
  return {
    themeClarity: 'pass',
    teachingValue: 'pass',
    duplicateRisk: 'clear',
    reviewNotes,
  };
}

export function hasPassingReviewChecklist(puzzle: Puzzle): boolean {
  return puzzle.reviewChecklist.themeClarity === 'pass' &&
    puzzle.reviewChecklist.teachingValue === 'pass' &&
    puzzle.reviewChecklist.duplicateRisk === 'clear';
}

export function isPuzzleReadyToShip(puzzle: Puzzle): boolean {
  return puzzle.reviewStatus === 'ship' && hasPassingReviewChecklist(puzzle);
}

const MAKRUK_NATIVE_SAMPLE_PUZZLES_RAW: RawPuzzle[] = [
  {
    id: 7001,
    title: 'Ma Fork Through the Shell',
    description: 'White to move. Find the only Ma fork that checks the Khun and wins the trapped Ruea next.',
    explanation: 'Nf6+ is forcing, and after the only king move the Ma lands on h7 to collect the Ruea.',
    source: 'Makruk-native sample pack: tactical fork',
    theme: 'Fork',
    motif: 'Ma fork',
    difficulty: 'beginner',
    reviewStatus: 'ship',
    reviewChecklist: shippedReview('Unique forcing Ma fork with one defender reply and a clean Ruea win.'),
    objective: 'Win the black Ruea with the only forcing Ma fork.',
    whyPositionMatters: 'The extra pawns and short-range pieces make this a practical Makruk middlegame shell, not an empty fork diagram. White must use a forcing jump before Black untangles the clustered defense.',
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: unpromoted Bia remain on c4, d4, c5, f6, g6, and h6, so neither Sak Mak nor Sak Kradan is active. This puzzle is judged purely by Makruk movement and tactical force.',
    goal: {
      kind: 'material-win',
      result: 'white-win',
      reason: 'material_win',
      minMaterialSwing: 500,
    },
    acceptedMoves: [
      {
        move: move('e4', 'f6'),
        lineId: 'main',
        explanation: 'The Ma jump to f6 is the only move that checks the Khun and attacks the Ruea on h7 at the same time.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Forced fork',
        moves: line('e4-f6', 'e8-f8', 'f6-h7'),
        outcome: {
          result: 'white-win',
          reason: 'material_win',
          explanation: 'White wins the full Rua after a single forced king move.',
        },
      },
    ],
    hint1: 'Look for the Ma jump that gives check and creates a second threat at the same time.',
    hint2: 'Do not settle for a quiet knight move. The right move must force the black Khun to answer while leaving the Rua hanging.',
    keyIdea: 'The fork works because check removes Black’s choice. A forcing Ma jump is stronger than a loose attack on the rook.',
    commonWrongMove: move('e4', 'g5'),
    wrongMoveExplanation: 'Ng5 looks active, but it does not check the Khun and it does not attack the Ruea. Black keeps both the king and the rook coordinated, so the teaching idea never appears.',
    takeaway: 'A Makruk Ma is strongest when one jump does two jobs at once. Here the right fork is forcing because the Khun is one of the targets.',
    sideToMove: 'white',
    toMove: 'white',
    board: board(
      ['c2', 'K', 'white'],
      ['e4', 'N', 'white'],
      ['f4', 'S', 'white'],
      ['c4', 'P', 'white'],
      ['d4', 'P', 'white'],
      ['g3', 'P', 'white'],
      ['e8', 'K', 'black'],
      ['h7', 'R', 'black'],
      ['d8', 'M', 'black'],
      ['e7', 'N', 'black'],
      ['f6', 'P', 'black'],
      ['g6', 'P', 'black'],
      ['h6', 'P', 'black'],
      ['c5', 'P', 'black'],
    ),
    tags: ['fork', 'ma-fork', 'forcing-check', 'middlegame', 'makruk-native'],
  },
  {
    id: 7002,
    title: 'Met Net Saves The Draw',
    description: 'White to move. Find the only move that saves the draw by stalemate before Black’s Ruea and pawns get moving.',
    explanation: 'Mf7! freezes every black unit at once: the Khun, the Ruea, and both pawns are left with no legal move, so the game is drawn immediately by stalemate.',
    source: 'Makruk-native sample pack: defensive stalemate',
    theme: 'SaveTheDraw',
    motif: 'Met stalemate net',
    difficulty: 'advanced',
    reviewStatus: 'quarantine',
    reviewChecklist: {
      themeClarity: 'fail',
      teachingValue: 'fail',
      duplicateRisk: 'clear',
      reviewNotes: 'Rejected: illegal black bia placement leaves the sample outside legal Makruk promotion and pawn-rank rules.',
    },
    objective: 'Save the draw with the only stalemate resource.',
    whyPositionMatters: 'White is materially worse against a black Rua and two pawns, so a generic “active move” is not enough. The only practical result left is a precise stalemate net built from Makruk short-range pieces.',
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: Black still has two unpromoted Bia on g7 and h6, so counted-endgame rules are off. The position is drawn only because stalemate is a legal Makruk result.',
    goal: {
      kind: 'draw',
      result: 'draw',
      reason: 'stalemate',
    },
    acceptedMoves: [
      {
        move: move('e6', 'f7'),
        lineId: 'main',
        explanation: 'The Met step to f7 covers g8 while the other Met and the Khun shut every remaining black move.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Stalemate save',
        moves: line('e6-f7'),
        outcome: {
          result: 'draw',
          reason: 'stalemate',
          explanation: 'Black has no legal move and is not in check, so the result is stalemate.',
        },
      },
    ],
    hint1: 'Search for the move that removes every legal black move without giving check.',
    hint2: 'A draw is still possible, but only if White uses the short-range Met geometry to freeze the king, rook, and pawns together.',
    keyIdea: 'This is a stalemate net, not a material save. White must eliminate all black moves while keeping the black Khun out of check.',
    commonWrongMove: move('g6', 'h7'),
    wrongMoveExplanation: 'Mh7? walks straight into Kxh7. Black keeps the Rua and the pawns alive, so White loses the only drawing net.',
    takeaway: 'Makruk defense is often about exact geometry. Two Mets can save a game if they take away the last squares without giving check.',
    sideToMove: 'white',
    toMove: 'white',
    board: board(
      ['h5', 'K', 'white'],
      ['e6', 'M', 'white'],
      ['g6', 'PM', 'white'],
      ['h8', 'K', 'black'],
      ['h7', 'R', 'black'],
      ['h6', 'P', 'black'],
      ['g7', 'P', 'black'],
    ),
    tags: ['defense', 'save-the-draw', 'stalemate', 'met-net', 'makruk-native'],
  },
  {
    id: 7003,
    title: 'Mate Before Sak Mak Closes',
    description: 'White to move. Sak Mak is already on 15 out of 16 counted moves. Find the only mate before the draw arrives.',
    explanation: 'Rh8# ends the game immediately. Any quiet move lets Black spend the last counted move, after which White gets only one final attack before the engine declares a Sak Mak draw.',
    source: 'Makruk-native sample pack: counting race',
    theme: 'WinBeforeCountExpires',
    motif: 'final attack before Sak Mak draw',
    difficulty: 'intermediate',
    reviewStatus: 'ship',
    reviewChecklist: shippedReview('Rule-native counted ending where only immediate mate beats the Sak Mak draw.'),
    objective: 'Checkmate now before Black reaches the last counted Sak Mak move.',
    whyPositionMatters: 'A lone Rua against a bare Khun looks winning to chess players, but Makruk counting changes that judgment. The position teaches that material advantage is meaningless if the count is about to close.',
    dependsOnCounting: true,
    ruleImpact: 'Counting matters here. Sak Mak is active with Black as the counting side at 15 of the 16 allowed counted moves for a one-Rua chase. If White does not mate immediately, Black reaches count 16 and White gets only one final attack before the game is drawn by the counting rule.',
    goal: {
      kind: 'checkmate',
      result: 'white-win',
      reason: 'win_before_count',
    },
    acceptedMoves: [
      {
        move: move('h7', 'h8'),
        lineId: 'main',
        explanation: 'The rook lift to h8 is immediate mate, so Sak Mak never gets the chance to rescue Black.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Mate before the count',
        moves: line('h7-h8'),
        outcome: {
          result: 'white-win',
          reason: 'win_before_count',
          explanation: 'White mates before Black can spend the last counted Sak Mak move.',
        },
      },
    ],
    hint1: 'Count first. White does not have time for a waiting move.',
    hint2: 'Any move that is not mate lets Black consume the last Sak Mak count and reach the final-attack phase.',
    keyIdea: 'In Makruk, a winning ending can still be drawn by counting. The right move must finish the game before the count closes.',
    commonWrongMove: move('f6', 'e6'),
    wrongMoveExplanation: 'Ke6? wastes the only free moment. Black replies Kg8 or Ke8, reaches the last Sak Mak count, and White then gets just one final attack. Any non-mating final attack is scored as a draw by the engine.',
    takeaway: 'In Makruk, a winning ending can turn into a draw if you spend the count carelessly. Always ask whether the count leaves time for the finish.',
    sideToMove: 'white',
    toMove: 'white',
    board: board(
      ['f6', 'K', 'white'],
      ['h7', 'R', 'white'],
      ['f8', 'K', 'black'],
    ),
    counting: {
      active: true,
      type: 'pieces_honor',
      countingColor: 'black',
      strongerColor: 'white',
      currentCount: 15,
      startCount: 3,
      limit: 16,
      finalAttackPending: false,
    },
    tags: ['counting', 'sak-mak', 'mate', 'win-before-count', 'makruk-native'],
  },
  {
    id: 7004,
    title: 'Capstone Mate Through d6',
    description: 'White to move. Force mate in 3 with the exact d6 interference line.',
    explanation: 'Ne4-d6+ is the key interference jump. Black has only Sxd6, which removes the e7 defender from the rook line. Only then does Rf3xf8+ become a one-reply forcing check, and Ne6-g7# finishes the mating net.',
    source: 'Manual source-of-truth Makruk capstone: authoritative mate-in-3 line',
    theme: 'MateIn3',
    motif: 'forced mate',
    difficulty: 'advanced',
    reviewStatus: 'ship',
    reviewChecklist: shippedReview('Explicit piece-list capstone puzzle with an authoritative mate-in-3 line and forced defender replies.'),
    progressionStage: 'late',
    pool: 'advanced_only',
    minimumStreakRequired: 8,
    positionAuthority: 'explicit_piece_list',
    solutionAuthority: 'authoritative_line',
    boardOrientation: 'white',
    pieceList: [
      { square: 'a7', type: 'R', color: 'white' },
      { square: 'c6', type: 'PM', color: 'white' },
      { square: 'e6', type: 'N', color: 'white' },
      { square: 'e4', type: 'N', color: 'white' },
      { square: 'c3', type: 'K', color: 'white' },
      { square: 'f3', type: 'R', color: 'white' },
      { square: 'b8', type: 'R', color: 'black' },
      { square: 'd8', type: 'S', color: 'black' },
      { square: 'e8', type: 'K', color: 'black' },
      { square: 'e7', type: 'S', color: 'black' },
      { square: 'f8', type: 'M', color: 'black' },
      { square: 'g8', type: 'R', color: 'black' },
    ],
    objective: 'Checkmate Black in three moves with the only forcing first move.',
    whyPositionMatters: 'This is a capstone Makruk attack. White must refuse small material and instead use a Ma interference check that drags the e7 Khon away from the king shell. Only after that deflection does the rook capture on f8 become a true forcing continuation.',
    dependsOnCounting: false,
    ruleImpact: 'No counting issue applies. The puzzle is decided entirely by legal Makruk movement, king safety, and a forced mating net.',
    goal: {
      kind: 'checkmate',
      result: 'white-win',
      reason: 'checkmate',
    },
    acceptedMoves: [
      {
        move: move('e4', 'd6'),
        lineId: 'main',
        explanation: 'Ne4-d6+ is the only accepted move because it forces Sxd6 and strips Black of the extra defense against the rook invasion on f8.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Authoritative mate in 3',
        moves: line('e4-d6', 'e7-d6', 'f3-f8', 'g8-f8', 'e6-g7'),
        outcome: {
          result: 'white-win',
          reason: 'checkmate',
          explanation: 'Black is dragged into the only recapture on d6, then White forces Rf8+ and finishes with Ng7#.',
        },
      },
    ],
    hint1: 'Start with the forcing check that interferes with the e7 Khon.',
    hint2: 'Do not cash out for small material. White must drag the e7 defender to d6 before the rook capture on f8 becomes forcing.',
    keyIdea: 'Ne4-d6+ is a Makruk interference check. It fixes the short-range defender on d6, so Rf3xf8+ becomes a one-reply check and Ne6-g7# ends the attack.',
    commonWrongMove: move('e6', 'd8'),
    wrongMoveExplanation: 'Ne6xd8 wins a Khon, but it is the wrong cash-out. White gives up the d6 interference, Black keeps the e7 Khon in place, and the rook capture on f8 no longer arrives with the same forcing power.',
    takeaway: 'In Makruk capstone attacks, the correct move is often the one that removes a defender’s choice first. Here White mates only by forcing the e7 Khon onto d6 before invading on f8.',
    sideToMove: 'white',
    toMove: 'white',
    board: board(
      ['a7', 'R', 'white'],
      ['c6', 'PM', 'white'],
      ['e6', 'N', 'white'],
      ['e4', 'N', 'white'],
      ['c3', 'K', 'white'],
      ['f3', 'R', 'white'],
      ['b8', 'R', 'black'],
      ['d8', 'S', 'black'],
      ['e8', 'K', 'black'],
      ['e7', 'S', 'black'],
      ['f8', 'M', 'black'],
      ['g8', 'R', 'black'],
    ),
    tags: ['mate', 'mate-in-3', 'forced-mate', 'authoritative-line', 'late-streak', 'makruk-native'],
  },
];

const CATALOG_PUZZLES: Puzzle[] = MAKRUK_NATIVE_SAMPLE_PUZZLES_RAW.map(finalizePuzzle);
export const CURATED_PUZZLES: Puzzle[] = CATALOG_PUZZLES;
export const GENERATED_PUZZLES: Puzzle[] = IMPORTED_PUZZLE_CANDIDATES;
export const ALL_PUZZLES: Puzzle[] = [...CURATED_PUZZLES, ...GENERATED_PUZZLES];
export const PUZZLE_VALIDATION_RESULTS: PuzzleValidationResult[] = ALL_PUZZLES.map(validatePuzzle);
export const PUZZLE_PUBLISH_AUDIT: PuzzlePublishAuditRow[] = buildPuzzlePublishAudit(ALL_PUZZLES, PUZZLE_VALIDATION_RESULTS);

const VALIDATION_BY_ID = new Map(PUZZLE_VALIDATION_RESULTS.map(result => [result.puzzleId, result]));
const PUBLISH_AUDIT_BY_ID = new Map(PUZZLE_PUBLISH_AUDIT.map(result => [result.id, result]));

function isValidationClean(puzzle: Puzzle): boolean {
  return (VALIDATION_BY_ID.get(puzzle.id)?.errors.length ?? 1) === 0;
}

export function getPuzzlePublishAuditById(id: number): PuzzlePublishAuditRow | undefined {
  return PUBLISH_AUDIT_BY_ID.get(id);
}

function summarizeRejectionReasons(results: PuzzleValidationResult[]): Array<{ reason: string; count: number }> {
  const counts = new Map<string, number>();

  for (const result of results) {
    for (const reason of result.errors) {
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((left, right) => right.count - left.count || left.reason.localeCompare(right.reason));
}

const PUBLISHABLE_PUZZLES: Puzzle[] = ALL_PUZZLES.filter(puzzle =>
  isPuzzleReadyToShip(puzzle) &&
  isValidationClean(puzzle) &&
  isPuzzlePublishable(puzzle, VALIDATION_BY_ID.get(puzzle.id)),
);

function isEditorialLivePuzzle(puzzle: Puzzle): boolean {
  return puzzle.origin === 'engine-generated' && puzzle.tags.includes('editorial-live');
}

export const PUZZLES: Puzzle[] = PUBLISHABLE_PUZZLES.filter(isEditorialLivePuzzle);

export const PUBLISHABLE_CURATED_PUZZLES: Puzzle[] = PUBLISHABLE_PUZZLES.filter(puzzle => puzzle.origin !== 'engine-generated');
export const PUBLISHABLE_GENERATED_PUZZLES: Puzzle[] = PUBLISHABLE_PUZZLES.filter(puzzle => puzzle.origin === 'engine-generated');

export const QUARANTINED_PUZZLES: Puzzle[] = ALL_PUZZLES.filter(puzzle =>
  !isPuzzleReadyToShip(puzzle) ||
  !isValidationClean(puzzle) ||
  !isPuzzlePublishable(puzzle, VALIDATION_BY_ID.get(puzzle.id)),
);

export const CURATED_PUBLISH_FAILURES: PuzzlePublishAuditRow[] = PUZZLE_PUBLISH_AUDIT.filter(row =>
  row.sourceType === 'curated' && !row.publishable,
);

export const GENERATED_PUBLISH_FAILURES: PuzzlePublishAuditRow[] = PUZZLE_PUBLISH_AUDIT.filter(row =>
  row.sourceType === 'generated' && !row.publishable,
);

export const PUZZLE_POOL_BREAKDOWN: PuzzlePoolBreakdown = {
  publishableByDifficulty: {
    beginner: PUZZLES.filter(puzzle => puzzle.difficulty === 'beginner').length,
    intermediate: PUZZLES.filter(puzzle => puzzle.difficulty === 'intermediate').length,
    advanced: PUZZLES.filter(puzzle => puzzle.difficulty === 'advanced').length,
  },
  publishableBySource: {
    curated: PUBLISHABLE_CURATED_PUZZLES.length,
    generated: PUBLISHABLE_GENERATED_PUZZLES.length,
  },
};

export const PUZZLE_POOL_DIAGNOSTICS: PuzzlePoolDiagnostics = {
  totalCandidates: ALL_PUZZLES.length,
  validCandidates: PUZZLE_VALIDATION_RESULTS.filter(result => result.errors.length === 0).length,
  shippedCandidates: PUZZLES.length,
  rejectedCandidates: PUZZLE_VALIDATION_RESULTS.filter(result => result.errors.length > 0).length,
  rejectionReasons: summarizeRejectionReasons(PUZZLE_VALIDATION_RESULTS.filter(result => result.errors.length > 0)),
  publishableByDifficulty: PUZZLE_POOL_BREAKDOWN.publishableByDifficulty,
  publishableBySource: PUZZLE_POOL_BREAKDOWN.publishableBySource,
};

export function getPuzzleById(id: number): Puzzle | undefined {
  return PUZZLES.find(p => p.id === id);
}

export function getPuzzlesByDifficulty(difficulty: Puzzle['difficulty']): Puzzle[] {
  return PUZZLES.filter(p => p.difficulty === difficulty);
}

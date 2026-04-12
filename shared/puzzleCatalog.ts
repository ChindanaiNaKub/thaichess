import { getLegalMoves, isInCheck, makeMove } from './engine';
import {
  buildPuzzlePositionKey,
  derivePuzzleOrigin,
  derivePuzzleSourceReference,
  derivePuzzleTags,
  type PuzzleOrigin,
} from './puzzleMetadata';
import { boardToPieceList } from './puzzlePosition';
import { isCountingTheme, isMateTheme, isPromotionTheme, isTacticalTheme } from './puzzleThemes';
import type {
  PuzzleCountCriticality,
  Puzzle,
  PuzzleAcceptedMove,
  PuzzleBoardPosition,
  PuzzleDifficultyProfile,
  PuzzleGoal,
  PuzzleMoveReference,
  PuzzleSolutionLine,
  PuzzleVerification,
  PuzzleStreakTier,
} from './puzzles';
import type { Board, CountingState, PieceColor } from './types';

const PIECE_VALUES = {
  R: 500,
  N: 300,
  S: 250,
  M: 200,
  PM: 200,
  P: 100,
} as const;

export type RawPuzzle = Omit<
  Puzzle,
  | 'origin'
  | 'sourceGameId'
  | 'sourcePly'
  | 'sourceLicense'
  | 'sourceGameUrl'
  | 'tags'
  | 'positionKey'
  | 'verification'
  | 'duplicateOf'
  | 'difficultyScore'
  | 'difficultyProfile'
  | 'progressionStage'
  | 'streakTier'
  | 'pool'
  | 'minimumStreakRequired'
  | 'boardPosition'
  | 'positionAuthority'
  | 'solutionAuthority'
  | 'boardOrientation'
  | 'pieceList'
  | 'setupMoves'
  | 'sideToMove'
  | 'counting'
  | 'solution'
  | 'objective'
  | 'whyPositionMatters'
  | 'dependsOnCounting'
  | 'ruleImpact'
  | 'goal'
  | 'acceptedMoves'
  | 'solutionLines'
  | 'hint1'
  | 'hint2'
  | 'keyIdea'
  | 'commonWrongMove'
  | 'wrongMoveExplanation'
  | 'takeaway'
> & {
  origin?: PuzzleOrigin;
  sourceGameId?: string | null;
  sourcePly?: number | null;
  sourceLicense?: string | null;
  sourceGameUrl?: string | null;
  tags?: string[];
  positionKey?: string;
  verification?: PuzzleVerification;
  duplicateOf?: number | null;
  difficultyScore?: number;
  difficultyProfile?: PuzzleDifficultyProfile;
  progressionStage?: Puzzle['progressionStage'];
  streakTier?: PuzzleStreakTier;
  pool?: Puzzle['pool'];
  minimumStreakRequired?: number;
  boardPosition?: PuzzleBoardPosition;
  positionAuthority?: Puzzle['positionAuthority'];
  solutionAuthority?: Puzzle['solutionAuthority'];
  boardOrientation?: Puzzle['boardOrientation'];
  pieceList?: Puzzle['pieceList'];
  setupMoves?: PuzzleMoveReference[];
  sideToMove?: PieceColor;
  counting?: CountingState | null;
  solution?: PuzzleMoveReference[];
  objective?: string;
  whyPositionMatters?: string;
  dependsOnCounting?: boolean;
  ruleImpact?: string;
  goal?: PuzzleGoal;
  acceptedMoves?: PuzzleAcceptedMove[];
  solutionLines?: PuzzleSolutionLine[];
  hint1?: string;
  hint2?: string;
  keyIdea?: string;
  commonWrongMove?: PuzzleMoveReference | null;
  wrongMoveExplanation?: string;
  takeaway?: string;
};

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function movesEqual(left: PuzzleMoveReference, right: PuzzleMoveReference): boolean {
  return left.from.row === right.from.row &&
    left.from.col === right.from.col &&
    left.to.row === right.to.row &&
    left.to.col === right.to.col;
}

function inferSideToMoveFromSolution(
  board: Board,
  solutionLines: PuzzleSolutionLine[] | undefined,
  solution: PuzzleMoveReference[] | undefined,
): PieceColor | null {
  const firstMove = solutionLines?.[0]?.moves[0] ?? solution?.[0];
  if (!firstMove) return null;

  const piece = board[firstMove.from.row]?.[firstMove.from.col];
  return piece?.color ?? null;
}

function countCandidateMoves(board: Board, color: PieceColor): number {
  let total = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      total += getLegalMoves(board, { row, col }).length;
    }
  }

  return total;
}

function createState(board: Board, toMove: PieceColor, counting: CountingState | null) {
  return {
    board: cloneBoard(board),
    turn: toMove,
    moveHistory: [],
    lastMove: null,
    isCheck: isInCheck(board, toMove),
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    gameOver: false,
    winner: null,
    resultReason: null,
    counting: counting ? { ...counting } : null,
    whiteTime: 0,
    blackTime: 0,
    lastMoveTime: 0,
    moveCount: 0,
  };
}

function deriveGoalFromTheme(theme: string, toMove: PieceColor): PuzzleGoal {
  if (isMateTheme(theme)) {
    return {
      kind: 'checkmate',
      result: toMove === 'white' ? 'white-win' : 'black-win',
      reason: 'checkmate',
    };
  }

  if (isPromotionTheme(theme)) {
    return {
      kind: 'promotion',
      result: toMove === 'white' ? 'white-win' : 'black-win',
      reason: 'promotion',
    };
  }

  if (isTacticalTheme(theme)) {
    return {
      kind: 'material-win',
      result: toMove === 'white' ? 'white-win' : 'black-win',
      reason: 'material_win',
      minMaterialSwing: 200,
    };
  }

  return {
    kind: 'draw',
    result: 'draw',
    reason: 'draw_saved',
  };
}

function deriveAcceptedMoves(
  acceptedMoves: PuzzleAcceptedMove[] | undefined,
  solutionLines: PuzzleSolutionLine[],
): PuzzleAcceptedMove[] {
  if (acceptedMoves && acceptedMoves.length > 0) {
    return acceptedMoves;
  }

  const derived: PuzzleAcceptedMove[] = [];

  for (const line of solutionLines) {
    const firstMove = line.moves[0];
    if (!firstMove) continue;
    if (derived.some(entry => movesEqual(entry.move, firstMove))) continue;

    derived.push({
      move: firstMove,
      lineId: line.id,
      explanation: 'Derived from the canonical solution line.',
    });
  }

  return derived;
}

function deriveCommonWrongMove(
  board: Board,
  toMove: PieceColor,
  acceptedMoves: PuzzleAcceptedMove[],
  explicitWrongMove: PuzzleMoveReference | null | undefined,
): PuzzleMoveReference | null {
  if (explicitWrongMove) {
    return explicitWrongMove;
  }

  let bestCapture: { move: PuzzleMoveReference; value: number; givesCheck: boolean } | null = null;
  let bestCheck: PuzzleMoveReference | null = null;
  let fallback: PuzzleMoveReference | null = null;

  const initialState = createState(board, toMove, null);

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== toMove) continue;

      const legalMoves = getLegalMoves(board, { row, col });
      for (const move of legalMoves) {
        const candidate: PuzzleMoveReference = {
          from: { row, col },
          to: move,
        };

        if (acceptedMoves.some(entry => movesEqual(entry.move, candidate))) {
          continue;
        }

        if (!fallback) {
          fallback = candidate;
        }

        const targetPiece = board[move.row]?.[move.col];
        const nextState = makeMove(initialState, candidate.from, candidate.to);
        const givesCheck = Boolean(nextState?.isCheck);
        const captureValue = targetPiece && targetPiece.type !== 'K'
          ? PIECE_VALUES[targetPiece.type]
          : 0;

        if (captureValue > 0) {
          if (!bestCapture || captureValue > bestCapture.value || (captureValue === bestCapture.value && givesCheck && !bestCapture.givesCheck)) {
            bestCapture = { move: candidate, value: captureValue, givesCheck };
          }
          continue;
        }

        if (givesCheck && !bestCheck) {
          bestCheck = candidate;
        }
      }
    }
  }

  return bestCapture?.move ?? bestCheck ?? fallback;
}

function deriveSolutionLines(
  solutionLines: PuzzleSolutionLine[] | undefined,
  solution: PuzzleMoveReference[] | undefined,
  goal: PuzzleGoal,
): PuzzleSolutionLine[] {
  if (solutionLines && solutionLines.length > 0) {
    return solutionLines;
  }

  return solution && solution.length > 0
    ? [{
      id: 'main',
      label: 'Main line',
      moves: solution,
      outcome: {
        result: goal.result,
        reason: goal.reason,
        explanation: 'Derived from the canonical solution line.',
      },
    }]
    : [];
}

function deriveDifficultyProfile(
  board: Board,
  toMove: PieceColor,
  counting: CountingState | null,
  acceptedMoves: PuzzleAcceptedMove[],
  solutionLines: PuzzleSolutionLine[],
  commonWrongMove: PuzzleMoveReference | null,
): PuzzleDifficultyProfile {
  const candidateMoveCount = countCandidateMoves(board, toMove);
  const firstAcceptedMove = acceptedMoves[0]?.move ?? solutionLines[0]?.moves[0] ?? null;
  const initialState = createState(board, toMove, counting);
  const nextState = firstAcceptedMove
    ? makeMove(initialState, firstAcceptedMove.from, firstAcceptedMove.to)
    : null;
  const moveIsCapture = firstAcceptedMove
    ? Boolean(board[firstAcceptedMove.to.row]?.[firstAcceptedMove.to.col])
    : false;
  const moveNature: PuzzleDifficultyProfile['moveNature'] = moveIsCapture || nextState?.isCheck ? 'forcing' : 'quiet';
  const tacticalVisibility: PuzzleDifficultyProfile['tacticalVisibility'] = moveNature === 'forcing'
    ? candidateMoveCount <= 8 ? 'obvious' : 'moderate'
    : candidateMoveCount <= 8 ? 'moderate' : 'hidden';

  return {
    candidateMoveCount,
    tacticalVisibility,
    countingAwareness: Boolean(counting),
    deceptive: commonWrongMove !== null || moveNature === 'quiet',
    moveNature,
  };
}

function estimateDifficultyScore(profile: PuzzleDifficultyProfile, solutionLines: PuzzleSolutionLine[]): number {
  return estimateDifficultyScoreWithVerification(profile, solutionLines, null);
}

function estimateDifficultyScoreWithVerification(
  profile: PuzzleDifficultyProfile,
  solutionLines: PuzzleSolutionLine[],
  verification: PuzzleVerification | null,
): number {
  const longestLine = solutionLines.reduce((best, line) => Math.max(best, line.moves.length), 0);
  let score = 760;

  score += Math.min(240, profile.candidateMoveCount * 12);
  score += longestLine * 110;
  score += profile.countingAwareness ? 160 : 0;
  score += profile.deceptive ? 120 : 0;
  score += profile.moveNature === 'quiet' ? 90 : 0;

  if (profile.tacticalVisibility === 'moderate') score += 60;
  if (profile.tacticalVisibility === 'hidden') score += 130;

  if (verification) {
    score += Math.min(120, Math.max(0, verification.onlyMoveChainLength - 1) * 45);
    score += Math.min(110, Math.max(0, verification.searchDepth ?? 0) * 6);
    score += Math.min(100, Math.max(0, verification.multiPvGap ?? 0) / 3);

    if (verification.countCriticality === 'active') score += 80;
    if (verification.countCriticality === 'critical') score += 170;

    if (verification.verificationStatus === 'engine_verified') score += 40;
    if (verification.verificationStatus === 'ambiguous') score -= 80;
  }

  return Math.max(650, Math.min(2400, score));
}

function deriveSourceLicense(origin: PuzzleOrigin, source: string): string | null {
  if (origin === 'real-game') return 'internal-real-game';
  if (origin === 'engine-generated' || /^offline self-play/i.test(source)) return 'internal-selfplay';
  if (origin === 'seed-game') return 'seed-corpus';
  if (origin === 'curated-manual') return 'curated-manual';
  if (origin === 'starter-pack') return 'starter-pack';
  if (origin === 'review-batch') return 'review-batch';
  return null;
}

function deriveStreakTier(puzzle: RawPuzzle): PuzzleStreakTier {
  if (puzzle.streakTier) return puzzle.streakTier;
  if (puzzle.tags?.includes('editorial-live')) {
    throw new Error(`Editorial live puzzle ${puzzle.id} is missing streakTier metadata.`);
  }
  if (puzzle.tags?.includes('mate-preparation') || isMateTheme(puzzle.theme) || isCountingTheme(puzzle.theme)) {
    return 'mate_pressure';
  }

  if (puzzle.difficulty === 'beginner') {
    return 'foundation';
  }

  if (puzzle.difficulty === 'intermediate') {
    return 'practical_attack';
  }

  return isTacticalTheme(puzzle.theme) || puzzle.tags?.includes('forcing-sequence')
    ? 'forcing_conversion'
    : 'practical_attack';
}

function deriveCountCriticality(
  counting: CountingState | null,
  dependsOnCounting: boolean,
): PuzzleCountCriticality {
  if (!counting && !dependsOnCounting) return 'none';
  if (counting?.active && counting.currentCount >= Math.max(0, counting.limit - 1)) {
    return 'critical';
  }
  return counting || dependsOnCounting ? 'active' : 'none';
}

function deriveVerification(
  puzzle: RawPuzzle,
  solutionLines: PuzzleSolutionLine[],
  counting: CountingState | null,
): PuzzleVerification {
  const onlyMoveChainLength = puzzle.verification?.onlyMoveChainLength ??
    Math.max(1, solutionLines.reduce((best, line) => Math.max(best, line.moves.length), 1));
  const dependsOnCounting = puzzle.dependsOnCounting ?? Boolean(counting);

  return {
    engineSource: puzzle.verification?.engineSource ?? 'local',
    searchDepth: puzzle.verification?.searchDepth ?? null,
    searchNodes: puzzle.verification?.searchNodes ?? null,
    multiPvGap: puzzle.verification?.multiPvGap ?? null,
    onlyMoveChainLength,
    countCriticality: puzzle.verification?.countCriticality ?? deriveCountCriticality(counting, dependsOnCounting),
    verificationStatus: puzzle.verification?.verificationStatus ?? 'solver_verified',
  };
}

export function finalizePuzzle(puzzle: RawPuzzle): Puzzle {
  const sourceReference = derivePuzzleSourceReference(puzzle.source);
  const origin = puzzle.origin ?? derivePuzzleOrigin(puzzle.source);
  const board = cloneBoard(puzzle.boardPosition?.board ?? puzzle.board);
  const counting = puzzle.boardPosition?.counting ?? puzzle.counting ?? null;
  const progressionStage = puzzle.progressionStage ?? (
    puzzle.difficulty === 'advanced'
      ? 'late'
      : puzzle.difficulty === 'intermediate'
        ? 'mid'
        : 'early'
  );
  const setupMoves = puzzle.setupMoves?.map(move => ({
    from: { ...move.from },
    to: { ...move.to },
  }));
  const inferredSideToMove = inferSideToMoveFromSolution(board, puzzle.solutionLines, puzzle.solution);
  const sideToMove = inferredSideToMove ?? puzzle.sideToMove ?? puzzle.toMove ?? 'white';
  const goal = puzzle.goal ?? deriveGoalFromTheme(puzzle.theme, sideToMove);
  const solutionLines = deriveSolutionLines(puzzle.solutionLines, puzzle.solution, goal);
  const acceptedMoves = deriveAcceptedMoves(puzzle.acceptedMoves, solutionLines);
  const commonWrongMove = deriveCommonWrongMove(board, sideToMove, acceptedMoves, puzzle.commonWrongMove);
  const verification = deriveVerification(puzzle, solutionLines, counting);
  const difficultyProfile = puzzle.difficultyProfile ?? deriveDifficultyProfile(
    board,
    sideToMove,
    counting,
    acceptedMoves,
    solutionLines,
    commonWrongMove,
  );
  const canonicalSolution = puzzle.solution ?? solutionLines[0]?.moves ?? [];

  return {
    ...puzzle,
    origin,
    sourceGameId: puzzle.sourceGameId ?? sourceReference.sourceGameId,
    sourcePly: puzzle.sourcePly ?? sourceReference.sourcePly,
    sourceLicense: puzzle.sourceLicense ?? deriveSourceLicense(origin, puzzle.source),
    sourceGameUrl: puzzle.sourceGameUrl ?? null,
    tags: derivePuzzleTags({
      theme: puzzle.theme,
      difficulty: puzzle.difficulty,
      source: puzzle.source,
      motif: puzzle.motif,
      board,
      toMove: sideToMove,
      solution: canonicalSolution,
      tags: puzzle.tags,
      dependsOnCounting: puzzle.dependsOnCounting,
    }),
    positionKey: puzzle.positionKey ?? buildPuzzlePositionKey(board, sideToMove, counting),
    verification,
    duplicateOf: puzzle.duplicateOf ?? null,
    difficultyScore: puzzle.difficultyScore ?? estimateDifficultyScoreWithVerification(difficultyProfile, solutionLines, verification),
    difficultyProfile,
    progressionStage,
    streakTier: deriveStreakTier(puzzle),
    pool: puzzle.pool ?? 'standard',
    minimumStreakRequired: puzzle.minimumStreakRequired ?? (progressionStage === 'late' ? 6 : 0),
    positionAuthority: puzzle.positionAuthority ?? (setupMoves && setupMoves.length > 0 ? 'replay_validated' : 'explicit_piece_list'),
    solutionAuthority: puzzle.solutionAuthority ?? 'engine_confirmed',
    boardOrientation: puzzle.boardOrientation ?? 'white',
    pieceList: puzzle.pieceList?.map(piece => ({ ...piece })) ?? boardToPieceList(board),
    objective: puzzle.objective ?? puzzle.description,
    whyPositionMatters: puzzle.whyPositionMatters ?? puzzle.description,
    dependsOnCounting: puzzle.dependsOnCounting ?? Boolean(counting),
    ruleImpact: puzzle.ruleImpact ?? (counting ? 'Counting is active in this position.' : 'Counting is not active in this position.'),
    goal,
    acceptedMoves,
    solutionLines,
    hint1: puzzle.hint1 ?? '',
    hint2: puzzle.hint2 ?? '',
    keyIdea: puzzle.keyIdea ?? '',
    commonWrongMove,
    wrongMoveExplanation: puzzle.wrongMoveExplanation ?? 'That move misses the puzzle objective.',
    takeaway: puzzle.takeaway ?? puzzle.explanation,
    boardPosition: {
      board,
      counting: counting ? { ...counting } : null,
    },
    setupMoves,
    sideToMove,
    toMove: sideToMove,
    board,
    counting: counting ? { ...counting } : null,
    solution: canonicalSolution,
  };
}

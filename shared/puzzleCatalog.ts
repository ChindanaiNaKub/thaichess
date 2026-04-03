import { getLegalMoves, isInCheck, makeMove } from './engine';
import {
  derivePuzzleOrigin,
  derivePuzzleSourceReference,
  derivePuzzleTags,
  type PuzzleOrigin,
} from './puzzleMetadata';
import { boardToPieceList } from './puzzlePosition';
import { isMateTheme, isPromotionTheme, isTacticalTheme } from './puzzleThemes';
import type {
  Puzzle,
  PuzzleAcceptedMove,
  PuzzleBoardPosition,
  PuzzleDifficultyProfile,
  PuzzleGoal,
  PuzzleMoveReference,
  PuzzleSolutionLine,
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
  | 'tags'
  | 'difficultyScore'
  | 'difficultyProfile'
  | 'progressionStage'
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
  tags?: string[];
  difficultyScore?: number;
  difficultyProfile?: PuzzleDifficultyProfile;
  progressionStage?: Puzzle['progressionStage'];
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
  const longestLine = solutionLines.reduce((best, line) => Math.max(best, line.moves.length), 0);
  let score = 760;

  score += Math.min(240, profile.candidateMoveCount * 12);
  score += longestLine * 110;
  score += profile.countingAwareness ? 160 : 0;
  score += profile.deceptive ? 120 : 0;
  score += profile.moveNature === 'quiet' ? 90 : 0;

  if (profile.tacticalVisibility === 'moderate') score += 60;
  if (profile.tacticalVisibility === 'hidden') score += 130;

  return Math.max(650, Math.min(2400, score));
}

export function finalizePuzzle(puzzle: RawPuzzle): Puzzle {
  const sourceReference = derivePuzzleSourceReference(puzzle.source);
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
    origin: puzzle.origin ?? derivePuzzleOrigin(puzzle.source),
    sourceGameId: puzzle.sourceGameId ?? sourceReference.sourceGameId,
    sourcePly: puzzle.sourcePly ?? sourceReference.sourcePly,
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
    difficultyScore: puzzle.difficultyScore ?? estimateDifficultyScore(difficultyProfile, solutionLines),
    difficultyProfile,
    progressionStage,
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

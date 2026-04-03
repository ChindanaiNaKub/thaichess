import { getLegalMoves, isInCheck, makeMove } from './engine';
import type { Board, GameState, Move, PieceColor, PieceType } from './types';
import type { Puzzle, PuzzleMoveReference, PuzzleSolutionLine } from './puzzles';
import {
  isMateTheme,
  isPromotionTheme,
  isTacticalTheme as isMaterialTheme,
} from './puzzleThemes';

const PIECE_VALUES: Record<Exclude<PieceType, 'K'>, number> = {
  R: 500,
  N: 300,
  S: 250,
  M: 200,
  PM: 200,
  P: 100,
};

export const TACTICAL_WIN_SWING = 200;

export interface ForcedGoalOutcome {
  pliesToGoal: number;
  terminalMaterialSwing: number;
}

export interface ObjectiveMoveEvaluation {
  move: Move;
  preservesObjective: boolean;
  forceDepth: number | null;
  terminalMaterialSwing: number;
  immediateCheck: boolean;
  immediatePromotion: boolean;
  immediateCaptureValue: number;
  opponentReplyCount: number;
  opponentKingMobility: number;
}

const goalSatisfyingFirstMoveCache = new WeakMap<Puzzle, Move[]>();
const objectivePreservingFirstMoveCache = new WeakMap<Puzzle, Move[]>();
const objectiveMoveEvaluationCache = new WeakMap<Puzzle, ObjectiveMoveEvaluation[]>();

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function getMaterialBalance(board: Board, color: PieceColor): number {
  let own = 0;
  let opponent = 0;

  for (const row of board) {
    for (const piece of row) {
      if (!piece || piece.type === 'K') continue;

      if (piece.color === color) own += PIECE_VALUES[piece.type];
      else opponent += PIECE_VALUES[piece.type];
    }
  }

  return own - opponent;
}

function getPieceValue(type: PieceType | null | undefined): number {
  if (!type || type === 'K') return 0;
  return PIECE_VALUES[type];
}

function movesEqual(left: PuzzleMoveReference | Move, right: PuzzleMoveReference | Move): boolean {
  return left.from.row === right.from.row &&
    left.from.col === right.from.col &&
    left.to.row === right.to.row &&
    left.to.col === right.to.col;
}

function getSearchDepth(puzzle: Puzzle): number {
  return puzzle.solutionLines.reduce((best, line) => Math.max(best, line.moves.length), puzzle.solution.length);
}

function findKingPosition(board: Board, color: PieceColor): { row: number; col: number } | null {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (piece?.type === 'K' && piece.color === color) {
        return { row, col };
      }
    }
  }

  return null;
}

function getMatchingSolutionLines(state: GameState, puzzle: Puzzle): PuzzleSolutionLine[] {
  return puzzle.solutionLines.filter(line =>
    state.moveHistory.every((playedMove, index) => {
      const lineMove = line.moves[index];
      return lineMove ? movesEqual(playedMove, lineMove) : false;
    }),
  );
}

function dedupeMoves(moves: PuzzleMoveReference[]): Move[] {
  const unique: Move[] = [];

  for (const move of moves) {
    if (unique.some(existing => movesEqual(existing, move))) continue;
    unique.push({
      from: { ...move.from },
      to: { ...move.to },
    });
  }

  return unique;
}

function doesStateSatisfyGoal(puzzle: Puzzle, state: GameState): boolean {
  const lastMove = state.moveHistory[state.moveHistory.length - 1];

  switch (puzzle.goal.kind) {
    case 'checkmate':
      return state.isCheckmate && state.winner === puzzle.sideToMove;
    case 'promotion':
      return Boolean(lastMove?.promoted);
    case 'draw':
      return state.isDraw;
    case 'material-win':
      return getMaterialSwing(puzzle, state) >= (puzzle.goal.minMaterialSwing ?? TACTICAL_WIN_SWING);
    default:
      return false;
  }
}

function getAllLegalMoves(board: Board, color: PieceColor): Move[] {
  const legalMoves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;

      for (const target of getLegalMoves(board, { row, col })) {
        legalMoves.push({
          from: { row, col },
          to: target,
        });
      }
    }
  }

  return legalMoves;
}

function getKingMobility(board: Board, color: PieceColor): number {
  const kingPosition = findKingPosition(board, color);
  return kingPosition ? getLegalMoves(board, kingPosition).length : 0;
}

function encodeState(state: GameState, pliesRemaining: number): string {
  return JSON.stringify({
    board: state.board,
    turn: state.turn,
    moveHistory: state.moveHistory,
    counting: state.counting,
    pliesRemaining,
  });
}

export function getMaterialSwing(puzzle: Puzzle, state: GameState): number {
  const startingBoard = puzzle.boardPosition?.board ?? puzzle.board;
  return getMaterialBalance(state.board, puzzle.sideToMove) - getMaterialBalance(startingBoard, puzzle.sideToMove);
}

export function isTacticalTheme(theme: string): boolean {
  return isMaterialTheme(theme);
}

export function createGameStateFromPuzzle(puzzle: Puzzle): GameState {
  const board = cloneBoard(puzzle.boardPosition?.board ?? puzzle.board);
  const turn = puzzle.sideToMove;
  const counting = puzzle.boardPosition?.counting ?? puzzle.counting ?? null;

  return {
    board,
    turn,
    moveHistory: [],
    isCheck: isInCheck(board, turn),
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

export function isThemeSatisfied(puzzle: Puzzle, state: GameState): boolean {
  return doesStateSatisfyGoal(puzzle, state);
}

export function getPliesRemaining(puzzle: Puzzle, state: GameState): number {
  const matchingLines = getMatchingSolutionLines(state, puzzle);
  const candidateLengths = matchingLines.length > 0
    ? matchingLines.map(line => line.moves.length)
    : [getSearchDepth(puzzle)];

  return Math.max(0, Math.max(...candidateLengths) - state.moveHistory.length);
}

export function getForcingMoves(state: GameState, puzzle: Puzzle): Move[] {
  if (doesStateSatisfyGoal(puzzle, state)) {
    return [];
  }

  const matchingLines = getMatchingSolutionLines(state, puzzle);
  if (matchingLines.length === 0) {
    return [];
  }

  const nextMoves = matchingLines
    .map(line => line.moves[state.moveHistory.length])
    .filter((move): move is PuzzleMoveReference => Boolean(move));

  return dedupeMoves(nextMoves);
}

function compareForcedOutcomeForSolver(
  puzzle: Puzzle,
  left: ForcedGoalOutcome,
  right: ForcedGoalOutcome,
): number {
  if (puzzle.goal.kind === 'material-win' && left.terminalMaterialSwing !== right.terminalMaterialSwing) {
    return right.terminalMaterialSwing - left.terminalMaterialSwing;
  }

  if (left.pliesToGoal !== right.pliesToGoal) {
    return left.pliesToGoal - right.pliesToGoal;
  }

  if (left.terminalMaterialSwing !== right.terminalMaterialSwing) {
    return right.terminalMaterialSwing - left.terminalMaterialSwing;
  }

  return 0;
}

function compareForcedOutcomeForDefender(
  puzzle: Puzzle,
  left: ForcedGoalOutcome,
  right: ForcedGoalOutcome,
): number {
  return -compareForcedOutcomeForSolver(puzzle, left, right);
}

function getForcedGoalOutcome(
  state: GameState,
  puzzle: Puzzle,
  solverColor: PieceColor,
  pliesRemaining: number,
  memo: Map<string, ForcedGoalOutcome | null>,
): ForcedGoalOutcome | null {
  if (doesStateSatisfyGoal(puzzle, state)) {
    return {
      pliesToGoal: 0,
      terminalMaterialSwing: getMaterialSwing(puzzle, state),
    };
  }

  if (pliesRemaining === 0) {
    return null;
  }

  const memoKey = encodeState(state, pliesRemaining);
  if (memo.has(memoKey)) {
    return memo.get(memoKey) ?? null;
  }

  const legalMoves = getAllLegalMoves(state.board, state.turn);
  if (legalMoves.length === 0) {
    const terminal = doesStateSatisfyGoal(puzzle, state)
      ? {
        pliesToGoal: 0,
        terminalMaterialSwing: getMaterialSwing(puzzle, state),
      }
      : null;
    memo.set(memoKey, terminal);
    return terminal;
  }

  if (state.turn === solverColor) {
    let best: ForcedGoalOutcome | null = null;

    for (const move of legalMoves) {
      const nextState = makeMove(state, move.from, move.to);
      if (!nextState) continue;

      const child = getForcedGoalOutcome(nextState, puzzle, solverColor, pliesRemaining - 1, memo);
      if (!child) continue;

      const candidate: ForcedGoalOutcome = {
        pliesToGoal: child.pliesToGoal + 1,
        terminalMaterialSwing: child.terminalMaterialSwing,
      };

      if (!best || compareForcedOutcomeForSolver(puzzle, candidate, best) < 0) {
        best = candidate;
      }
    }

    memo.set(memoKey, best);
    return best;
  }

  let worst: ForcedGoalOutcome | null = null;

  for (const move of legalMoves) {
    const nextState = makeMove(state, move.from, move.to);
    if (!nextState) {
      memo.set(memoKey, null);
      return null;
    }

    const child = getForcedGoalOutcome(nextState, puzzle, solverColor, pliesRemaining - 1, memo);
    if (!child) {
      memo.set(memoKey, null);
      return null;
    }

    const candidate: ForcedGoalOutcome = {
      pliesToGoal: child.pliesToGoal + 1,
      terminalMaterialSwing: child.terminalMaterialSwing,
    };

    if (!worst || compareForcedOutcomeForDefender(puzzle, candidate, worst) < 0) {
      worst = candidate;
    }
  }

  memo.set(memoKey, worst);
  return worst;
}

export function canForceTheme(
  state: GameState,
  puzzle: Puzzle,
  solverColor: PieceColor,
  pliesRemaining: number,
  memo: Map<string, boolean>,
): boolean {
  const outcomeMemo = new Map<string, ForcedGoalOutcome | null>();
  const result = Boolean(getForcedGoalOutcome(state, puzzle, solverColor, pliesRemaining, outcomeMemo));
  memo.set(encodeState(state, pliesRemaining), result);
  return result;
}

function evaluateFirstMove(
  puzzle: Puzzle,
  move: Move,
  memo: Map<string, ForcedGoalOutcome | null>,
): ObjectiveMoveEvaluation {
  const startState = createGameStateFromPuzzle(puzzle);
  const capturedPiece = startState.board[move.to.row]?.[move.to.col];
  const nextState = makeMove(startState, move.from, move.to);

  if (!nextState) {
    return {
      move,
      preservesObjective: false,
      forceDepth: null,
      terminalMaterialSwing: Number.NEGATIVE_INFINITY,
      immediateCheck: false,
      immediatePromotion: false,
      immediateCaptureValue: getPieceValue(capturedPiece?.type),
      opponentReplyCount: Number.POSITIVE_INFINITY,
      opponentKingMobility: Number.POSITIVE_INFINITY,
    };
  }

  const searchDepth = getSearchDepth(puzzle);
  const forcedOutcome = getForcedGoalOutcome(nextState, puzzle, puzzle.sideToMove, searchDepth - 1, memo);
  const defenderColor = nextState.turn;
  const lastMove = nextState.moveHistory[nextState.moveHistory.length - 1];

  return {
    move,
    preservesObjective: Boolean(forcedOutcome),
    forceDepth: forcedOutcome ? forcedOutcome.pliesToGoal + 1 : null,
    terminalMaterialSwing: forcedOutcome?.terminalMaterialSwing ?? Number.NEGATIVE_INFINITY,
    immediateCheck: nextState.isCheck,
    immediatePromotion: Boolean(lastMove?.promoted),
    immediateCaptureValue: getPieceValue(capturedPiece?.type),
    opponentReplyCount: getAllLegalMoves(nextState.board, defenderColor).length,
    opponentKingMobility: getKingMobility(nextState.board, defenderColor),
  };
}

function compareObjectiveMoveEvaluations(
  puzzle: Puzzle,
  left: ObjectiveMoveEvaluation,
  right: ObjectiveMoveEvaluation,
): number {
  if (left.preservesObjective !== right.preservesObjective) {
    return left.preservesObjective ? -1 : 1;
  }

  if (!left.preservesObjective || !right.preservesObjective) {
    return 0;
  }

  switch (puzzle.goal.kind) {
    case 'material-win':
      if (left.terminalMaterialSwing !== right.terminalMaterialSwing) {
        return right.terminalMaterialSwing - left.terminalMaterialSwing;
      }
      break;
    case 'promotion':
      if (left.immediatePromotion !== right.immediatePromotion) {
        return left.immediatePromotion ? -1 : 1;
      }
      break;
  }

  if ((left.forceDepth ?? Number.POSITIVE_INFINITY) !== (right.forceDepth ?? Number.POSITIVE_INFINITY)) {
    return (left.forceDepth ?? Number.POSITIVE_INFINITY) - (right.forceDepth ?? Number.POSITIVE_INFINITY);
  }

  if (left.immediateCheck !== right.immediateCheck) {
    return left.immediateCheck ? -1 : 1;
  }

  if (left.opponentReplyCount !== right.opponentReplyCount) {
    return left.opponentReplyCount - right.opponentReplyCount;
  }

  if (left.opponentKingMobility !== right.opponentKingMobility) {
    return left.opponentKingMobility - right.opponentKingMobility;
  }

  if (left.immediatePromotion !== right.immediatePromotion) {
    return left.immediatePromotion ? -1 : 1;
  }

  if (left.terminalMaterialSwing !== right.terminalMaterialSwing) {
    return right.terminalMaterialSwing - left.terminalMaterialSwing;
  }

  if (left.immediateCaptureValue !== right.immediateCaptureValue) {
    return right.immediateCaptureValue - left.immediateCaptureValue;
  }

  return 0;
}

export function getObjectivePreservingFirstMoveEvaluations(puzzle: Puzzle): ObjectiveMoveEvaluation[] {
  const cached = objectiveMoveEvaluationCache.get(puzzle);
  if (cached) {
    return cached.map(evaluation => ({
      ...evaluation,
      move: {
        from: { ...evaluation.move.from },
        to: { ...evaluation.move.to },
      },
    }));
  }

  const state = createGameStateFromPuzzle(puzzle);
  const legalMoves = getAllLegalMoves(state.board, state.turn);
  const memo = new Map<string, ForcedGoalOutcome | null>();
  const evaluations = legalMoves.map(move => evaluateFirstMove(puzzle, move, memo));
  objectiveMoveEvaluationCache.set(puzzle, evaluations);

  return evaluations.map(evaluation => ({
    ...evaluation,
    move: {
      from: { ...evaluation.move.from },
      to: { ...evaluation.move.to },
    },
  }));
}

export function findObjectivePreservingFirstMoves(puzzle: Puzzle): Move[] {
  const cached = objectivePreservingFirstMoveCache.get(puzzle);
  if (cached) {
    return cached.map(move => ({
      from: { ...move.from },
      to: { ...move.to },
    }));
  }

  const evaluations = getObjectivePreservingFirstMoveEvaluations(puzzle)
    .filter(evaluation => evaluation.preservesObjective);

  if (evaluations.length === 0) {
    return [];
  }

  let best = evaluations[0];
  for (const evaluation of evaluations.slice(1)) {
    if (compareObjectiveMoveEvaluations(puzzle, evaluation, best) < 0) {
      best = evaluation;
    }
  }

  const moves = evaluations
    .filter(evaluation => compareObjectiveMoveEvaluations(puzzle, evaluation, best) === 0)
    .map(evaluation => evaluation.move);

  objectivePreservingFirstMoveCache.set(puzzle, moves);
  return moves.map(move => ({
    from: { ...move.from },
    to: { ...move.to },
  }));
}

export function findGoalSatisfyingFirstMoves(puzzle: Puzzle): Move[] {
  const cached = goalSatisfyingFirstMoveCache.get(puzzle);
  if (cached) {
    return cached.map(move => ({
      from: { ...move.from },
      to: { ...move.to },
    }));
  }

  const state = createGameStateFromPuzzle(puzzle);
  const legalMoves = getAllLegalMoves(state.board, state.turn);
  const memo = new Map<string, ForcedGoalOutcome | null>();
  const depth = getSearchDepth(puzzle);
  const moves = legalMoves.filter(move => {
    const nextState = makeMove(state, move.from, move.to);
    return nextState ? Boolean(getForcedGoalOutcome(nextState, puzzle, puzzle.sideToMove, depth - 1, memo)) : false;
  });

  goalSatisfyingFirstMoveCache.set(puzzle, moves);
  return moves.map(move => ({
    from: { ...move.from },
    to: { ...move.to },
  }));
}

export function getCanonicalAcceptedMove(puzzle: Puzzle): PuzzleMoveReference | null {
  return puzzle.acceptedMoves[0]?.move ?? puzzle.solution[0] ?? null;
}

export function isMatePuzzle(puzzle: Puzzle): boolean {
  return isMateTheme(puzzle.theme) || puzzle.goal.kind === 'checkmate';
}

export function isPromotionPuzzle(puzzle: Puzzle): boolean {
  return isPromotionTheme(puzzle.theme) || puzzle.goal.kind === 'promotion';
}

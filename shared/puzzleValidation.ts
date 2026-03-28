import { getLegalMoves, hasAnyLegalMoves, isInCheck, makeMove, posToAlgebraic } from './engine';
import type { Board, GameState, Move, Piece, PieceColor, Position } from './types';
import type { Puzzle } from './puzzles';
import {
  createGameStateFromPuzzle,
  getForcingMoves,
  getMaterialSwing,
  isTacticalTheme,
  isThemeSatisfied,
  TACTICAL_WIN_SWING,
} from './puzzleSolver';
import {
  getPuzzleThemeDefinition,
  isFuturePuzzleTheme,
  isMateTheme,
  isPromotionTheme,
} from './puzzleThemes';

export interface PuzzleValidationResult {
  puzzleId: number;
  title: string;
  errors: string[];
  warnings: string[];
}

const CHECKMATE_DESCRIPTION_REGEX = /(?:mate|checkmate) in (\d+)/i;
const CHECKMATE_COPY_REGEX = /\b(?:mate|checkmate|mating)\b/i;
const CHECKMATE_EXPLANATION_REGEX = /\b(?:mate|checkmate|mating|boxed in|no safe square|no escape|mating net|close(?:s|d)?(?: the net| every reply)?|seal(?:s|ed)?|trap(?:s|ped)?|cut(?:s)? off|take(?:s)? away)\b/i;
const PROMOTION_REGEX = /\bpromot(?:e|es|ed|ing|ion)\b/i;
const PAWN_REGEX = /\b(?:pawn|bia)\b/i;
const TACTICAL_ACTION_REGEX = /\b(?:win|wins|won|capture|captures|captured|capturing|grab|grabs|grabbing|collect|collects|collecting|pick(?:s)? up|harvest)\b/i;
const TACTICAL_TARGET_REGEX = /\b(?:material|rook|rua|knight|ma|khon|met|pawn|bia)\b/i;

function normalizeText(...parts: string[]): string {
  return parts
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ');
}

function countKings(board: Board, color: PieceColor): number {
  let count = 0;
  for (const row of board) {
    for (const piece of row) {
      if (piece?.type === 'K' && piece.color === color) count++;
    }
  }
  return count;
}

function isBoardShapeValid(board: Board): boolean {
  return board.length === 8 && board.every(row => row.length === 8);
}

function isPawnPlacementValid(board: Board): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.type !== 'P') continue;
      if (piece.color === 'white' && row >= 5) return false;
      if (piece.color === 'black' && row <= 2) return false;
    }
  }
  return true;
}

function isLegalMove(board: Board, from: Position, to: Position): boolean {
  return getLegalMoves(board, from).some(move => move.row === to.row && move.col === to.col);
}

function validateThemeOutcome(puzzle: Puzzle, finalState: GameState, errors: string[]): void {
  const lastMove = finalState.moveHistory[finalState.moveHistory.length - 1];

  if (isMateTheme(puzzle.theme) && !finalState.isCheckmate) {
    errors.push('Final position does not end in checkmate for a Checkmate puzzle.');
  }

  if (isPromotionTheme(puzzle.theme) && !lastMove?.promoted) {
    errors.push('Final move does not promote a pawn for a Promotion puzzle.');
  }

  if (isTacticalTheme(puzzle.theme) && getMaterialSwing(puzzle, finalState) < TACTICAL_WIN_SWING) {
    errors.push(`Final position does not win enough material for a ${puzzle.theme} puzzle.`);
  }
}

function formatMove(move: Move): string {
  return `${posToAlgebraic(move.from)}-${posToAlgebraic(move.to)}`;
}

function findWinningFirstMoves(puzzle: Puzzle, state: GameState): Move[] {
  return getForcingMoves(state, puzzle);
}

function moveEquals(actual: Move, expected: { from: Position; to: Position }): boolean {
  return actual.from.row === expected.from.row &&
    actual.from.col === expected.from.col &&
    actual.to.row === expected.to.row &&
    actual.to.col === expected.to.col;
}

function positionEquals(left: Position, right: Position): boolean {
  return left.row === right.row && left.col === right.col;
}

function pieceMatchesTarget(piece: Piece | null, target: Piece): boolean {
  if (!piece) {
    return false;
  }

  return piece.type === target.type && piece.color === target.color;
}

interface TacticalTargetReference {
  piece: Piece;
  origin: Position;
}

function getTacticalTargetReference(puzzle: Puzzle, stateAfterFirstMove: GameState): TacticalTargetReference | null {
  if (puzzle.solution.length !== 3) {
    return null;
  }

  const defenseMove = puzzle.solution[1];
  const finalMove = puzzle.solution[2];
  const stateBeforeFinalMove = makeMove(stateAfterFirstMove, defenseMove.from, defenseMove.to);
  if (!stateBeforeFinalMove) {
    return null;
  }

  const capturedPiece = stateBeforeFinalMove.board[finalMove.to.row][finalMove.to.col];
  if (!capturedPiece || capturedPiece.color === puzzle.toMove) {
    return null;
  }

  const stationaryTarget = stateAfterFirstMove.board[finalMove.to.row][finalMove.to.col];
  if (pieceMatchesTarget(stationaryTarget, capturedPiece)) {
    return {
      piece: capturedPiece,
      origin: finalMove.to,
    };
  }

  const movedTarget = stateAfterFirstMove.board[defenseMove.from.row][defenseMove.from.col];
  if (positionEquals(defenseMove.to, finalMove.to) && pieceMatchesTarget(movedTarget, capturedPiece)) {
    return {
      piece: capturedPiece,
      origin: defenseMove.from,
    };
  }

  return null;
}

function validateTacticalTargetConsistency(puzzle: Puzzle, initialState: GameState, errors: string[]): void {
  if (!isTacticalTheme(puzzle.theme) || puzzle.solution.length !== 3) {
    return;
  }

  const firstMove = puzzle.solution[0];
  const stateAfterFirstMove = makeMove(initialState, firstMove.from, firstMove.to);
  if (!stateAfterFirstMove) {
    return;
  }

  const target = getTacticalTargetReference(puzzle, stateAfterFirstMove);
  if (!target) {
    errors.push('Three-ply tactical puzzles must finish by capturing a consistent target piece.');
    return;
  }

  const defenderMoves = getForcingMoves(stateAfterFirstMove, puzzle);

  for (const defenderMove of defenderMoves) {
    const nextState = makeMove(stateAfterFirstMove, defenderMove.from, defenderMove.to);
    if (!nextState) {
      continue;
    }

    const targetSquare = positionEquals(defenderMove.from, target.origin) ? defenderMove.to : target.origin;
    const solverMoves = getForcingMoves(nextState, puzzle);
    const preservesTarget = solverMoves.some(move =>
      positionEquals(move.to, targetSquare) &&
      pieceMatchesTarget(nextState.board[move.to.row][move.to.col], target.piece),
    );

    if (!preservesTarget) {
      errors.push(
        `Tactical puzzle target is not consistently forced after defender reply ${formatMove(defenderMove)}.`,
      );
      return;
    }
  }
}

function validateSolutionBranch(puzzle: Puzzle, initialState: GameState, errors: string[]): void {
  validateTacticalTargetConsistency(puzzle, initialState, errors);
  if (errors.length > 0) {
    return;
  }

  let state = initialState;

  for (let index = 0; index < puzzle.solution.length; index++) {
    const expectedMove = puzzle.solution[index];
    const candidateMoves = getForcingMoves(state, puzzle);

    if (!candidateMoves.length) {
      errors.push(`Solution move ${index + 1} does not stay inside a forced puzzle branch.`);
      return;
    }

    if (!candidateMoves.some(move => moveEquals(move, expectedMove))) {
      const role = state.turn === puzzle.toMove ? 'solver' : 'defender';
      errors.push(`Solution move ${index + 1} is not a valid ${role} branch move.`);
      return;
    }

    const nextState = makeMove(state, expectedMove.from, expectedMove.to);
    if (!nextState) {
      errors.push(`Solution move ${index + 1} could not be applied.`);
      return;
    }

    state = nextState;
  }

  if (!isThemeSatisfied(puzzle, state)) {
    validateThemeOutcome(puzzle, state, errors);
  }
}

function validateMetadata(puzzle: Puzzle, errors: string[], warnings: string[]): void {
  const title = puzzle.title.trim();
  const description = puzzle.description.trim();
  const explanation = puzzle.explanation.trim();
  const source = puzzle.source.trim();
  const combinedCopy = normalizeText(title, description, explanation);

  if (!title) errors.push('Puzzle title is required.');
  if (!description) errors.push('Puzzle description is required.');
  if (!explanation) errors.push('Puzzle explanation is required.');
  if (!source) warnings.push('Puzzle source should be recorded for future audits.');

  if (description.length < 20) {
    warnings.push('Puzzle description is too short to set up the idea clearly.');
  }

  if (explanation.length < 20) {
    warnings.push('Puzzle explanation is too short to teach the idea clearly.');
  }

  if (isMateTheme(puzzle.theme)) {
    const mateCount = Math.floor((puzzle.solution.length + 1) / 2);
    const match = description.match(CHECKMATE_DESCRIPTION_REGEX);

    if (!match || Number.parseInt(match[1], 10) !== mateCount) {
      errors.push(`Checkmate puzzle description must say "Mate in ${mateCount}".`);
    }

    if (!CHECKMATE_COPY_REGEX.test(combinedCopy)) {
      errors.push('Checkmate puzzle copy must mention mate or checkmate.');
    }

    if (!CHECKMATE_EXPLANATION_REGEX.test(explanation)) {
      errors.push('Checkmate puzzle explanation must describe the mating idea.');
    }
  }

  if (isPromotionTheme(puzzle.theme)) {
    if (!PROMOTION_REGEX.test(combinedCopy)) {
      errors.push('Promotion puzzle copy must mention promotion.');
    }

    if (!PAWN_REGEX.test(combinedCopy)) {
      errors.push('Promotion puzzle copy must mention the pawn or bia.');
    }
  }

  if (isTacticalTheme(puzzle.theme)) {
    if (!TACTICAL_ACTION_REGEX.test(combinedCopy)) {
      errors.push('Tactical puzzle copy must say that the line wins or captures something.');
    }

    if (!TACTICAL_TARGET_REGEX.test(combinedCopy)) {
      errors.push('Tactical puzzle copy must name the material target or mention material gain.');
    }
  }

  const themeDefinition = getPuzzleThemeDefinition(puzzle.theme);
  if (!themeDefinition) {
    warnings.push(`Puzzle theme "${puzzle.theme}" is not part of the Makruk theme catalog.`);
  } else if (isFuturePuzzleTheme(puzzle.theme)) {
    warnings.push(`Puzzle theme "${puzzle.theme}" is cataloged for future support but not fully validated yet.`);
  }
}

export function validatePuzzle(puzzle: Puzzle): PuzzleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isBoardShapeValid(puzzle.board)) {
    errors.push('Board must be 8x8.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (countKings(puzzle.board, 'white') !== 1 || countKings(puzzle.board, 'black') !== 1) {
    errors.push('Puzzle board must contain exactly one white king and one black king.');
  }

  if (!isPawnPlacementValid(puzzle.board)) {
    errors.push('Puzzle board contains an unpromoted pawn on or beyond its promotion rank.');
  }

  if (!puzzle.solution.length) {
    errors.push('Puzzle must contain at least one solution move.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (puzzle.solution.length % 2 === 0) {
    errors.push('Puzzle solution must end on the solving side, so solution length must be odd.');
  }

  validateMetadata(puzzle, errors, warnings);

  let state = createGameStateFromPuzzle(puzzle);
  const defendingColor: PieceColor = puzzle.toMove === 'white' ? 'black' : 'white';
  const solverInCheck = isInCheck(puzzle.board, puzzle.toMove);
  const defenderInCheck = isInCheck(puzzle.board, defendingColor);

  if (solverInCheck && defenderInCheck) {
    errors.push('Puzzle board is illegal: both kings are in check.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (defenderInCheck) {
    errors.push('Starting position is illegal: the non-moving side is already in check.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (isThemeSatisfied(puzzle, state)) {
    errors.push('Puzzle theme is already satisfied in the starting position.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (!hasAnyLegalMoves(state.board, state.turn)) {
    errors.push('Side to move has no legal moves in the starting position.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  const firstMove = puzzle.solution[0];
  if (!isLegalMove(state.board, firstMove.from, firstMove.to)) {
    errors.push('First solution move is illegal in the starting position.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  const winningFirstMoves = findWinningFirstMoves(puzzle, state);
  const expectedFirstMove = winningFirstMoves.find(move =>
    move.from.row === firstMove.from.row &&
    move.from.col === firstMove.from.col &&
    move.to.row === firstMove.to.row &&
    move.to.col === firstMove.to.col,
  );

  if (!expectedFirstMove) {
    errors.push('Listed first move does not force the puzzle theme within the solution length.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (winningFirstMoves.length > 1) {
    errors.push(`Puzzle has multiple winning first moves: ${winningFirstMoves.map(formatMove).join(', ')}.`);
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (errors.length === 0) {
    validateSolutionBranch(puzzle, state, errors);
  }

  return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
}

export function validatePuzzles(puzzles: Puzzle[]): PuzzleValidationResult[] {
  return puzzles.map(validatePuzzle);
}

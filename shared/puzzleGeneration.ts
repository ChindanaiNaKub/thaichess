import { createInitialBoard, createInitialGameState, getLegalMoves, isInCheck, makeMove } from './engine';
import {
  validateMakrukGeneratedPosition,
  validateMakrukPosition,
  validateMakrukReplay,
} from './makrukPositionValidation';
import { TACTICAL_WIN_SWING, getMaterialSwing } from './puzzleSolver';
import type { Board, GameState, Move, Piece, PieceColor, PieceType, Position } from './types';
import type { Puzzle } from './puzzles';
import type { PuzzleCandidateDraft } from './puzzleImportQueue';
import { validatePuzzle } from './puzzleValidation';
import { finalizePuzzle } from './puzzleCatalog';
import { isMateTheme, isPromotionTheme, isTacticalTheme } from './puzzleThemes';
import { derivePuzzleTags, estimatePuzzleDifficultyScore, isMiddlegameRichBoard } from './puzzleMetadata';

export interface PuzzleGenerationSource {
  id: string;
  source: string;
  moves: Move[];
  initialBoard?: Board;
  startingTurn?: PieceColor;
  setupMoves?: Move[];
  positionSourceType?: 'real-game' | 'engine-generated' | 'constructed';
  startingPlyNumber?: number;
  moveCount?: number;
  result?: string;
  resultReason?: string;
}

export interface PuzzleGenerationOptions {
  startingId?: number;
  minPlies?: number;
  maxPlies?: number;
  maxCandidates?: number;
  minSourceMoves?: number;
  allowResultReasons?: string[];
  rejectResultReasons?: string[];
}

export interface GeneratedPuzzleCandidate {
  draft: PuzzleCandidateDraft;
  validationErrors: string[];
  validationWarnings: string[];
  windowStart: number;
  sourceId: string;
  fingerprint: string;
  score: number;
}

type GeneratedTheme =
  | 'MateIn1'
  | 'MateIn2'
  | 'MateIn3'
  | 'Promotion'
  | 'Tactic'
  | 'Fork'
  | 'Pin'
  | 'HangingPiece'
  | 'DoubleAttack'
  | 'Discovery'
  | 'TrappedPiece'
  | 'Endgame';

interface ThemeAnalysis {
  theme: GeneratedTheme;
  materialSwing: number;
  tags: string[];
}

const DEFAULT_MIN_PLIES = 3;
const DEFAULT_MAX_PLIES = 3;
const DEFAULT_STARTING_ID = 2000;
const DEFAULT_MIN_SOURCE_MOVES = 12;
const DEFAULT_REJECT_RESULT_REASONS = new Set(['agreement', 'max_plies', 'stopped']);

function getSeedDifficulty(
  board: Board,
  theme: GeneratedTheme,
  solutionLength: number,
): PuzzleCandidateDraft['difficulty'] {
  if (solutionLength < 3) {
    return 'beginner';
  }

  if (isMateTheme(theme) || isPromotionTheme(theme)) {
    return 'intermediate';
  }

  return isMiddlegameRichBoard(board) ? 'advanced' : 'intermediate';
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function boardsEqual(left: Board, right: Board): boolean {
  if (left.length !== right.length) return false;

  for (let row = 0; row < left.length; row += 1) {
    if (left[row]?.length !== right[row]?.length) return false;

    for (let col = 0; col < left[row].length; col += 1) {
      const a = left[row][col];
      const b = right[row][col];

      if (!a && !b) continue;
      if (!a || !b) return false;
      if (a.color !== b.color || a.type !== b.type) return false;
    }
  }

  return true;
}

function createGameState(board: Board, turn: PieceColor): GameState {
  return {
    board: cloneBoard(board),
    turn,
    moveHistory: [],
    isCheck: isInCheck(board, turn),
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    gameOver: false,
    winner: null,
    resultReason: null,
    counting: null,
    whiteTime: 0,
    blackTime: 0,
    lastMoveTime: 0,
    moveCount: 0,
  };
}

function resolveGenerationStartState(input: PuzzleGenerationSource): GameState | null {
  const defaultBoard = createInitialBoard();
  const providedBoard = input.initialBoard ? cloneBoard(input.initialBoard) : defaultBoard;
  const providedTurn = input.startingTurn ?? 'white';
  const setupMoves = input.setupMoves ?? [];
  const hasCustomBoard = !boardsEqual(providedBoard, defaultBoard);
  const hasCustomTurn = providedTurn !== 'white';

  if (setupMoves.length > 0) {
    const replay = validateMakrukReplay({
      moves: setupMoves,
      expectedBoard: input.initialBoard ? providedBoard : undefined,
      expectedTurn: input.startingTurn,
    });

    return replay.valid && replay.finalState
      ? createGameState(replay.finalState.board, replay.finalState.turn)
      : null;
  }

  if (hasCustomBoard || hasCustomTurn) {
    return null;
  }

  if (!validateMakrukPosition(providedBoard)) {
    return null;
  }

  return createInitialGameState(0, 0);
}

function createPlaceholderPuzzle(
  board: Board,
  toMove: PieceColor,
  solution: Move[],
  theme: GeneratedTheme,
  title: string,
  description: string,
  explanation: string,
  source: string,
  motif: string,
): Puzzle {
  const difficulty = getSeedDifficulty(board, theme, solution.length);
  const tags = derivePuzzleTags({
    theme,
    difficulty,
    source,
    motif,
    board,
    toMove,
    solution,
  });

  return finalizePuzzle({
    id: 0,
    title,
    description,
    explanation,
    source,
    theme,
    motif,
    tags,
    difficultyScore: estimatePuzzleDifficultyScore({
      theme,
      difficulty,
      source,
      motif,
      board,
      toMove,
      solution,
      tags,
    }),
    difficulty,
    reviewStatus: 'quarantine',
    reviewChecklist: {
      themeClarity: 'unreviewed',
      teachingValue: 'unreviewed',
      duplicateRisk: 'unreviewed',
      reviewNotes: '',
    },
    sideToMove: toMove,
    toMove,
    board: cloneBoard(board),
    solution: solution.map(move => ({
      from: { ...move.from },
      to: { ...move.to },
    })),
    objective: description,
    whyPositionMatters: description,
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: generated candidate is validated as an ordinary move puzzle unless a counted state is supplied.',
    commonWrongMove: null,
    wrongMoveExplanation: 'This move misses the generated puzzle objective.',
    takeaway: explanation,
  });
}

function playMoveSequence(state: GameState, moves: Move[]): GameState | null {
  let current: GameState | null = state;

  for (const move of moves) {
    current = current ? makeMove(current, move.from, move.to) : null;
    if (!current) return null;
  }

  return current;
}

function getTargetLabel(solution: Move[]): string {
  const captured = solution
    .map(move => move.captured?.type)
    .filter((piece): piece is PieceType => Boolean(piece))
    .sort((left, right) => piecePriority(right) - piecePriority(left))[0];

  switch (captured) {
    case 'R': return 'rook';
    case 'N': return 'knight';
    case 'S': return 'khon';
    case 'M':
    case 'PM': return 'met';
    case 'P': return 'pawn';
    default: return 'material';
  }
}

function piecePriority(type: PieceType): number {
  switch (type) {
    case 'R': return 5;
    case 'N': return 4;
    case 'S': return 3;
    case 'M':
    case 'PM': return 2;
    case 'P': return 1;
    case 'K': return 0;
  }
}

function getOpponent(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white';
}

function getPseudoAttackSquares(board: Board, pos: Position): Position[] {
  const piece = board[pos.row]?.[pos.col];
  if (!piece) return [];

  if (piece.type === 'R') {
    const attacks: Position[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      for (let distance = 1; distance < 8; distance += 1) {
        const row = pos.row + dr * distance;
        const col = pos.col + dc * distance;
        if (row < 0 || row > 7 || col < 0 || col > 7) break;
        attacks.push({ row, col });
        if (board[row][col]) break;
      }
    }

    return attacks;
  }

  const legalMoves = getLegalMoves(board, pos);
  const pieceSpecificExtras: Position[] = [];

  if (piece.type === 'K') {
    const kingDirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of kingDirs) {
      const row = pos.row + dr;
      const col = pos.col + dc;
      if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
        pieceSpecificExtras.push({ row, col });
      }
    }
  }

  if (piece.type === 'M' || piece.type === 'PM') {
    const metDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of metDirs) {
      const row = pos.row + dr;
      const col = pos.col + dc;
      if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
        pieceSpecificExtras.push({ row, col });
      }
    }
  }

  if (piece.type === 'S') {
    const forward = piece.color === 'white' ? 1 : -1;
    const khonDirs = [[-1,-1],[-1,1],[1,-1],[1,1],[forward,0]];
    for (const [dr, dc] of khonDirs) {
      const row = pos.row + dr;
      const col = pos.col + dc;
      if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
        pieceSpecificExtras.push({ row, col });
      }
    }
  }

  if (piece.type === 'N') {
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightMoves) {
      const row = pos.row + dr;
      const col = pos.col + dc;
      if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
        pieceSpecificExtras.push({ row, col });
      }
    }
  }

  if (piece.type === 'P') {
    const forward = piece.color === 'white' ? 1 : -1;
    for (const dc of [-1, 1]) {
      const row = pos.row + forward;
      const col = pos.col + dc;
      if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
        pieceSpecificExtras.push({ row, col });
      }
    }
  }

  const seen = new Set<string>();
  return [...legalMoves, ...pieceSpecificExtras].filter(square => {
    const key = `${square.row}:${square.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getAttackers(board: Board, target: Position, byColor: PieceColor): Position[] {
  const attackers: Position[] = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== byColor) continue;

      const attacks = getPseudoAttackSquares(board, { row, col });
      if (attacks.some(square => square.row === target.row && square.col === target.col)) {
        attackers.push({ row, col });
      }
    }
  }

  return attackers;
}

function getAttackedEnemyTargets(board: Board, attackerPos: Position, attackerColor: PieceColor): Piece[] {
  const attackedSquares = getPseudoAttackSquares(board, attackerPos);
  const targets: Piece[] = [];

  for (const square of attackedSquares) {
    const piece = board[square.row]?.[square.col];
    if (piece && piece.color !== attackerColor) {
      targets.push(piece);
    }
  }

  return targets;
}

function getAttackedEnemyTargetSquares(board: Board, attackerPos: Position, attackerColor: PieceColor): Position[] {
  const attackedSquares = getPseudoAttackSquares(board, attackerPos);

  return attackedSquares.filter(square => {
    const piece = board[square.row]?.[square.col];
    return Boolean(piece && piece.color !== attackerColor);
  });
}

function countPieces(board: Board): number {
  return board.reduce((total, row) => total + row.filter(Boolean).length, 0);
}

function getSafeMovesForPiece(board: Board, from: Position): Position[] {
  const piece = board[from.row]?.[from.col];
  if (!piece) return [];

  const state = createGameState(board, piece.color);

  return getLegalMoves(board, from).filter(to => {
    const nextState = makeMove(state, from, to);
    if (!nextState) return false;
    return getAttackers(nextState.board, to, getOpponent(piece.color)).length === 0;
  });
}

function createsDiscovery(initialBoard: Board, boardAfterFirstMove: Board, firstMove: Move, attackerColor: PieceColor): boolean {
  const movedPiece = initialBoard[firstMove.from.row]?.[firstMove.from.col];
  if (!movedPiece || movedPiece.type === 'R') {
    return false;
  }

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = boardAfterFirstMove[row][col];
      if (!piece || piece.color !== attackerColor || piece.type !== 'R') continue;
      if (row === firstMove.to.row && col === firstMove.to.col) continue;

      const beforeTargets = new Set(
        getAttackedEnemyTargetSquares(initialBoard, { row, col }, attackerColor)
          .map(square => `${square.row}:${square.col}`),
      );
      const afterTargets = getAttackedEnemyTargetSquares(boardAfterFirstMove, { row, col }, attackerColor);

      if (afterTargets.some(square => !beforeTargets.has(`${square.row}:${square.col}`))) {
        return true;
      }
    }
  }

  return false;
}

function getTrappedTargetAfterFirstMove(
  stateAfterFirstMove: GameState,
  solution: Move[],
  toMove: PieceColor,
): Position | null {
  if (solution.length < 3) {
    return null;
  }

  const defenseMove = solution[1];
  const finalMove = solution[solution.length - 1];
  const targetAtFinalSquare = stateAfterFirstMove.board[finalMove.to.row]?.[finalMove.to.col];
  if (targetAtFinalSquare && targetAtFinalSquare.color !== toMove) {
    return finalMove.to;
  }

  const movedTarget = stateAfterFirstMove.board[defenseMove.from.row]?.[defenseMove.from.col];
  if (
    movedTarget &&
    movedTarget.color !== toMove &&
    defenseMove.to.row === finalMove.to.row &&
    defenseMove.to.col === finalMove.to.col
  ) {
    return defenseMove.from;
  }

  return null;
}

function createsTrappedPiece(stateAfterFirstMove: GameState, solution: Move[], toMove: PieceColor): boolean {
  const targetSquare = getTrappedTargetAfterFirstMove(stateAfterFirstMove, solution, toMove);
  if (!targetSquare) return false;

  const targetPiece = stateAfterFirstMove.board[targetSquare.row]?.[targetSquare.col];
  if (!targetPiece || targetPiece.color === toMove) return false;

  const safeMoves = getSafeMovesForPiece(stateAfterFirstMove.board, targetSquare);
  return safeMoves.length <= 1;
}

function isEndgameBoard(board: Board): boolean {
  return countPieces(board) <= 8;
}

function createsPin(board: Board, attackerPos: Position, attackerColor: PieceColor): boolean {
  const attacker = board[attackerPos.row]?.[attackerPos.col];
  if (!attacker || attacker.color !== attackerColor || attacker.type !== 'R') {
    return false;
  }

  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of directions) {
    let firstEnemy: Piece | null = null;

    for (let distance = 1; distance < 8; distance += 1) {
      const row = attackerPos.row + dr * distance;
      const col = attackerPos.col + dc * distance;
      if (row < 0 || row > 7 || col < 0 || col > 7) break;

      const piece = board[row][col];
      if (!piece) continue;
      if (piece.color === attackerColor) break;

      if (!firstEnemy) {
        if (piece.type === 'K') break;
        firstEnemy = piece;
        continue;
      }

      if (piece.type === 'K') {
        return true;
      }

      return piecePriority(piece.type) > piecePriority(firstEnemy.type);
    }
  }

  return false;
}

export function classifyMaterialTheme(
  board: Board,
  toMove: PieceColor,
  solution: Move[],
): 'Fork' | 'Pin' | 'HangingPiece' | 'Tactic' | 'DoubleAttack' | 'Discovery' | 'TrappedPiece' | 'Endgame' {
  const firstMove = solution[0];
  const initialState = createGameState(board, toMove);

  if (firstMove) {
    const firstState = makeMove(initialState, firstMove.from, firstMove.to);
    const movedPiece = firstState?.board[firstMove.to.row]?.[firstMove.to.col];

    if (firstState && movedPiece) {
      if (createsDiscovery(board, firstState.board, firstMove, movedPiece.color)) {
        return 'Discovery';
      }

      if (createsPin(firstState.board, firstMove.to, movedPiece.color)) {
        return 'Pin';
      }

      const attackedTargets = getAttackedEnemyTargets(firstState.board, firstMove.to, movedPiece.color);
      const attacksKing = attackedTargets.some(piece => piece.type === 'K');
      const attacksPieces = attackedTargets.filter(piece => piece.type !== 'K').length;
      if ((attacksKing && attacksPieces >= 1) || attacksPieces >= 2) {
        return movedPiece.type === 'N' ? 'Fork' : 'DoubleAttack';
      }

      if (createsTrappedPiece(firstState, solution, toMove)) {
        return 'TrappedPiece';
      }
    }
  }

  let state = initialState;
  for (const move of solution) {
    const mover = state.board[move.from.row]?.[move.from.col];
    const captured = state.board[move.to.row]?.[move.to.col];
    if (mover && captured && captured.color !== mover.color) {
      const defenders = getAttackers(state.board, move.to, captured.color)
        .filter(attacker => attacker.row !== move.to.row || attacker.col !== move.to.col);
      if (defenders.length === 0) {
        return 'HangingPiece';
      }
    }

    const nextState = makeMove(state, move.from, move.to);
    if (!nextState) break;
    state = nextState;
  }

  if (isEndgameBoard(board)) {
    return 'Endgame';
  }

  return 'Tactic';
}

function analyzeTheme(board: Board, toMove: PieceColor, solution: Move[]): ThemeAnalysis | null {
  const initialState = createGameState(board, toMove);
  const finalState = playMoveSequence(initialState, solution);
  const firstMove = solution[0];
  const firstMoveCapture = firstMove
    ? Boolean(board[firstMove.to.row]?.[firstMove.to.col])
    : false;

  if (!finalState) return null;
  if (finalState.isCheckmate) {
    const theme = solution.length <= 1 ? 'MateIn1' : solution.length <= 3 ? 'MateIn2' : 'MateIn3';
    return {
      theme,
      materialSwing: getMaterialSwing(
        createPlaceholderPuzzle(
          board,
          toMove,
          solution,
          'Tactic',
          'tmp',
          'tmp',
          'tmp',
          'tmp',
          'tmp',
        ),
        finalState,
      ),
      tags: derivePuzzleTags({
        theme,
        difficulty: getSeedDifficulty(board, theme, solution.length),
        source: 'Generated real-game candidate',
        motif: 'Generated mate candidate',
        board,
        toMove,
        solution,
      }),
    };
  }
  if (finalState.moveHistory[finalState.moveHistory.length - 1]?.promoted) {
    return {
      theme: 'Promotion',
      materialSwing: getMaterialSwing(
        createPlaceholderPuzzle(
          board,
          toMove,
          solution,
          'Tactic',
          'tmp',
          'tmp',
          'tmp',
          'tmp',
          'tmp',
        ),
        finalState,
      ),
      tags: derivePuzzleTags({
        theme: 'Promotion',
        difficulty: getSeedDifficulty(board, 'Promotion', solution.length),
        source: 'Generated real-game candidate',
        motif: 'Generated promotion candidate',
        board,
        toMove,
        solution,
      }),
    };
  }

  const swing = getMaterialSwing(
    createPlaceholderPuzzle(
      board,
      toMove,
      solution,
      'Tactic',
      'tmp',
      'tmp',
      'tmp',
      'tmp',
      'tmp',
    ),
    finalState,
  );

  if (swing < TACTICAL_WIN_SWING) {
    return null;
  }

  const theme = classifyMaterialTheme(board, toMove, solution);
  if (solution.length < 3 && !(theme === 'Fork' || theme === 'DoubleAttack' || theme === 'Pin' || theme === 'Discovery' || theme === 'HangingPiece' || theme === 'TrappedPiece')) {
    return null;
  }

  if (firstMoveCapture && (theme === 'HangingPiece' || theme === 'Tactic')) {
    return null;
  }

  return {
    theme,
    materialSwing: swing,
    tags: derivePuzzleTags({
      theme,
      difficulty: getSeedDifficulty(board, theme, solution.length),
      source: 'Generated real-game candidate',
      motif: 'Generated tactical candidate',
      board,
      toMove,
      solution,
      tags: firstMoveCapture ? [] : ['quiet-first-move'],
    }),
  };
}

function getGeneratedDifficulty(
  board: Board,
  toMove: PieceColor,
  solution: Move[],
  theme: GeneratedTheme,
  source: string,
  motif: string,
  tags: string[],
): { difficulty: PuzzleCandidateDraft['difficulty']; difficultyScore: number } {
  const seededDifficulty = getSeedDifficulty(board, theme, solution.length);
  const difficultyScore = estimatePuzzleDifficultyScore({
    theme,
    difficulty: seededDifficulty,
    source,
    motif,
    board,
    sideToMove: toMove,
    toMove,
    solution,
    tags,
  });

  const difficulty = isMateTheme(theme) || isPromotionTheme(theme)
    ? seededDifficulty
    : difficultyScore >= 1320
      ? 'advanced'
      : difficultyScore >= 930
        ? 'intermediate'
        : 'beginner';

  return { difficulty, difficultyScore };
}

function buildCopy(theme: GeneratedTheme, sourceId: string, plyLabel: number, solution: Move[]) {
  const solverMoves = Math.max(1, Math.ceil(solution.length / 2));
  const winInLabel = solverMoves === 1 ? 'in 1' : `in ${solverMoves}`;

  if (isMateTheme(theme)) {
    const mateCount = Math.floor((solution.length + 1) / 2);
    return {
      title: `Real-Game Mate in ${mateCount} (${sourceId} @ ply ${plyLabel})`,
      description: `Mate in ${mateCount}. Find the forcing line from this real-game position.`,
      explanation: 'The first move cuts the king off to a single reply, and the follow-up closes the mating net.',
      motif: `Real-game mate in ${mateCount} candidate`,
    };
  }

  if (isPromotionTheme(theme)) {
    return {
      title: `Real-Game Promotion (${sourceId} @ ply ${plyLabel})`,
      description: 'Promote in 2. Start with the forcing move that escorts the bia to promotion.',
      explanation: 'The first move forces the reply, and the final move promotes the bia into a met.',
      motif: 'Real-game promotion candidate',
    };
  }

  const target = getTargetLabel(solution);
  if (theme === 'Fork') {
    return {
      title: `Real-Game Fork (${sourceId} @ ply ${plyLabel})`,
      description: `Win material ${winInLabel}. Start with the fork that attacks the king and the ${target}.`,
      explanation: `The first move creates a double attack, and the follow-up wins the ${target} cleanly.`,
      motif: `Real-game fork candidate: wins ${target}`,
    };
  }

  if (theme === 'DoubleAttack') {
    return {
      title: `Real-Game Double Attack (${sourceId} @ ply ${plyLabel})`,
      description: `Win material ${winInLabel}. Start with the double attack that overloads the defense.`,
      explanation: `The first move creates two threats at once, so the defender cannot save everything and the ${target} falls.`,
      motif: `Real-game double attack candidate: wins ${target}`,
    };
  }

  if (theme === 'Discovery') {
    return {
      title: `Real-Game Discovery (${sourceId} @ ply ${plyLabel})`,
      description: `Win material ${winInLabel}. Find the discovered attack that reveals the winning line.`,
      explanation: `A quiet move opens a hidden line of attack, forcing the defense to react while the ${target} remains loose.`,
      motif: `Real-game discovery candidate: wins ${target}`,
    };
  }

  if (theme === 'Pin') {
    return {
      title: `Real-Game Pin (${sourceId} @ ply ${plyLabel})`,
      description: `Win material ${winInLabel}. Start with the pin that leaves the ${target} stuck.`,
      explanation: `The first move pins the defender in place, and the follow-up wins the ${target}.`,
      motif: `Real-game pin candidate: wins ${target}`,
    };
  }

  if (theme === 'HangingPiece') {
    return {
      title: `Real-Game Hanging Piece (${sourceId} @ ply ${plyLabel})`,
      description: `Win material ${winInLabel}. Start by taking the loose ${target}.`,
      explanation: `The target is insufficiently defended, so the forcing line wins the ${target} cleanly.`,
      motif: `Real-game hanging piece candidate: wins ${target}`,
    };
  }

  if (theme === 'TrappedPiece') {
    return {
      title: `Real-Game Trapped Piece (${sourceId} @ ply ${plyLabel})`,
      description: `Win material ${winInLabel}. Start with the move that traps the piece before collecting it.`,
      explanation: 'The first move cuts off the escape squares. Black can shuffle, but the trapped piece still falls on the next move.',
      motif: 'Real-game trapped piece candidate',
    };
  }

  if (theme === 'Endgame') {
    return {
      title: `Real-Game Endgame Tactic (${sourceId} @ ply ${plyLabel})`,
      description: `Convert the endgame ${winInLabel}. Find the forcing move that wins the ${target}.`,
      explanation: `With fewer pieces on the board, a single forcing move decides the ending and wins the ${target}.`,
      motif: `Real-game endgame tactic candidate: wins ${target}`,
    };
  }

  return {
    title: `Real-Game Tactic (${sourceId} @ ply ${plyLabel})`,
    description: `Win material ${winInLabel}. Start with the forcing move that wins the ${target}.`,
    explanation: `The first move forces the reply, and the follow-up wins the ${target} cleanly.`,
    motif: `Real-game tactic candidate: wins ${target}`,
  };
}

function toDraft(
  board: Board,
  toMove: PieceColor,
  setupMoves: Move[],
  solution: Move[],
  sourceId: string,
  sourceLabel: string,
  windowStart: number,
  startingPlyNumber: number,
  id: number,
): PuzzleCandidateDraft | null {
  const analysis = analyzeTheme(board, toMove, solution);
  if (!analysis) return null;

  const plyLabel = startingPlyNumber + windowStart;
  const copy = buildCopy(analysis.theme, sourceId, plyLabel, solution);
  const sourceWithPly = `${sourceLabel} (ply ${plyLabel})`;
  const tags = derivePuzzleTags({
    theme: analysis.theme,
    difficulty: solution.length >= 5 ? 'advanced' : solution.length >= 3 ? 'intermediate' : 'beginner',
    source: sourceWithPly,
    motif: copy.motif,
    board,
    toMove,
    solution,
    tags: analysis.tags,
  });
  const { difficulty, difficultyScore } = getGeneratedDifficulty(
    board,
    toMove,
    solution,
    analysis.theme,
    sourceWithPly,
    copy.motif,
    tags,
  );

  return {
    id,
    title: copy.title,
    description: copy.description,
    explanation: copy.explanation,
    source: sourceWithPly,
    origin: sourceLabel.toLowerCase().startsWith('exported') ? 'real-game' : 'seed-game',
    sourceGameId: sourceId,
    sourcePly: plyLabel,
    theme: analysis.theme,
    motif: copy.motif,
    tags,
    difficultyScore,
    difficulty,
    toMove,
    board: cloneBoard(board),
    setupMoves: setupMoves.map(move => ({
      from: { ...move.from },
      to: { ...move.to },
    })),
    solution: solution.map(move => ({
      from: { ...move.from },
      to: { ...move.to },
    })),
  };
}

function dedupeKey(board: Board, solution: Move[], toMove: PieceColor): string {
  return JSON.stringify({ board, solution, toMove });
}

function scoreCandidate(
  draft: PuzzleCandidateDraft,
  validationWarnings: string[],
  sourceMoveCount: number,
): number {
  const themeBase = isMateTheme(draft.theme)
    ? 1000
    : isPromotionTheme(draft.theme)
      ? 800
      : isTacticalTheme(draft.theme)
        ? 600
        : 400;

  const pieceCount = draft.board.reduce(
    (total, row) => total + row.filter(Boolean).length,
    0,
  );
  const boardComplexityBonus = Math.min(120, pieceCount * 12);
  const gameLengthBonus = Math.min(120, Math.max(0, sourceMoveCount - 12) * 4);
  const warningPenalty = validationWarnings.length * 80;

  return themeBase + boardComplexityBonus + gameLengthBonus - warningPenalty;
}

function passesQualityGate(state: GameState, draft: PuzzleCandidateDraft): boolean {
  const legalMoveCount = (() => {
    let total = 0;
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = state.board[row][col];
        if (!piece || piece.color !== state.turn) continue;
        total += getLegalMoves(state.board, { row, col }).length;
      }
    }
    return total;
  })();
  const firstMove = draft.solution[0];
  const firstMoveCapture = firstMove
    ? Boolean(state.board[firstMove.to.row]?.[firstMove.to.col])
    : false;

  const shortFormAllowed = draft.theme === 'MateIn1' ||
    draft.theme === 'Promotion' ||
    draft.theme === 'Fork' ||
    draft.theme === 'DoubleAttack' ||
    draft.theme === 'Pin' ||
    draft.theme === 'Discovery' ||
    draft.theme === 'HangingPiece' ||
    draft.theme === 'TrappedPiece';

  if (draft.solution.length < 3 && !shortFormAllowed) {
    return false;
  }

  if (legalMoveCount < (draft.solution.length < 3 ? 2 : 4)) {
    return false;
  }

  if (firstMoveCapture && (draft.theme === 'HangingPiece' || draft.theme === 'Tactic')) {
    return false;
  }

  return true;
}

export function generatePuzzleCandidateDraftsFromMoveSequence(
  input: PuzzleGenerationSource,
  options: PuzzleGenerationOptions = {},
): GeneratedPuzzleCandidate[] {
  const minPlies = options.minPlies ?? DEFAULT_MIN_PLIES;
  const maxPlies = options.maxPlies ?? DEFAULT_MAX_PLIES;
  const maxCandidates = options.maxCandidates ?? Number.POSITIVE_INFINITY;
  const startingId = options.startingId ?? DEFAULT_STARTING_ID;
  const minSourceMoves = options.minSourceMoves ?? DEFAULT_MIN_SOURCE_MOVES;
  const rejectReasons = new Set(options.rejectResultReasons ?? [...DEFAULT_REJECT_RESULT_REASONS]);
  const allowReasons = options.allowResultReasons ? new Set(options.allowResultReasons) : null;
  const seen = new Set<string>();
  const generated: GeneratedPuzzleCandidate[] = [];
  const sourceMoveCount = input.moveCount ?? input.moves.length;
  const startingPlyNumber = input.startingPlyNumber ?? 1;

  if (sourceMoveCount < minSourceMoves) {
    return generated;
  }

  if (allowReasons && input.resultReason && !allowReasons.has(input.resultReason)) {
    return generated;
  }

  if (input.resultReason && rejectReasons.has(input.resultReason)) {
    return generated;
  }

  let state = resolveGenerationStartState(input);
  if (!state) {
    return generated;
  }

  for (let index = 0; index < input.moves.length; index++) {
    const positionValidation = validateMakrukGeneratedPosition({
      board: state.board,
      turn: state.turn,
      startingBoard: input.initialBoard,
      startingTurn: input.startingTurn,
      replayMoves: input.moves.slice(0, index),
    });
    if (!positionValidation.valid) {
      break;
    }

    for (let plies = minPlies; plies <= maxPlies; plies += 2) {
      const solution = input.moves.slice(index, index + plies);
      if (solution.length !== plies) continue;

      const draft = toDraft(
        state.board,
        state.turn,
        input.moves.slice(0, index),
        solution,
        input.id,
        input.source,
        index,
        startingPlyNumber,
        startingId + generated.length,
      );

      if (!draft) continue;
      if (!passesQualityGate(state, draft)) continue;

      const key = dedupeKey(draft.board, solution, draft.toMove);
      if (seen.has(key)) continue;

      const puzzle = createPlaceholderPuzzle(
        draft.board,
        draft.toMove,
        solution,
        draft.theme as GeneratedTheme,
        draft.title,
        draft.description,
        draft.explanation,
        draft.source,
        draft.motif,
      );
      puzzle.id = draft.id;

      const result = validatePuzzle(puzzle);
      if (result.errors.length > 0) continue;

      const fingerprint = dedupeKey(draft.board, solution, draft.toMove);
      const score = scoreCandidate(draft, result.warnings, sourceMoveCount);

      generated.push({
        draft,
        validationErrors: result.errors,
        validationWarnings: result.warnings,
        windowStart: index,
        sourceId: input.id,
        fingerprint,
        score,
      });
      seen.add(fingerprint);

      if (generated.length >= maxCandidates) {
        return generated;
      }
    }

    const nextState = makeMove(state, input.moves[index].from, input.moves[index].to);
    if (!nextState) {
      break;
    }

    state = nextState;
  }

  return generated;
}

export function formatDraftAsPrettyJson(draft: PuzzleCandidateDraft): string {
  return JSON.stringify(draft, null, 2);
}

export function createDefaultGenerationSource(
  id: string,
  source: string,
  moves: Move[],
  initialBoard?: Board,
  startingTurn: PieceColor = 'white',
  metadata: Pick<
    PuzzleGenerationSource,
    'moveCount' | 'result' | 'resultReason' | 'startingPlyNumber' | 'setupMoves' | 'positionSourceType'
  > = {},
): PuzzleGenerationSource {
  return {
    id,
    source,
    moves,
    initialBoard: initialBoard ?? createInitialBoard(),
    startingTurn,
    setupMoves: metadata.setupMoves,
    positionSourceType: metadata.positionSourceType ?? 'constructed',
    startingPlyNumber: metadata.startingPlyNumber ?? 1,
    ...metadata,
  };
}

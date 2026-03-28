import { createInitialBoard, createInitialGameState, getLegalMoves, isInCheck, makeMove } from './engine';
import { TACTICAL_WIN_SWING, getMaterialSwing } from './puzzleSolver';
import type { Board, GameState, Move, Piece, PieceColor, PieceType, Position } from './types';
import type { Puzzle } from './puzzles';
import type { PuzzleCandidateDraft } from './puzzleImportQueue';
import { validatePuzzle } from './puzzleValidation';
import { isMateTheme, isPromotionTheme, isTacticalTheme } from './puzzleThemes';

export interface PuzzleGenerationSource {
  id: string;
  source: string;
  moves: Move[];
  initialBoard?: Board;
  startingTurn?: PieceColor;
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
  | 'HangingPiece';

interface ThemeAnalysis {
  theme: GeneratedTheme;
  materialSwing: number;
}

const DEFAULT_MIN_PLIES = 3;
const DEFAULT_MAX_PLIES = 3;
const DEFAULT_STARTING_ID = 2000;
const DEFAULT_MIN_SOURCE_MOVES = 12;
const DEFAULT_REJECT_RESULT_REASONS = new Set(['agreement', 'max_plies', 'stopped']);

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
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
  return {
    id: 0,
    title,
    description,
    explanation,
    source,
    theme,
    motif,
    difficulty: solution.length >= 5 ? 'advanced' : 'intermediate',
    reviewStatus: 'quarantine',
    reviewChecklist: {
      themeClarity: 'unreviewed',
      teachingValue: 'unreviewed',
      duplicateRisk: 'unreviewed',
      reviewNotes: '',
    },
    toMove,
    board: cloneBoard(board),
    solution: solution.map(move => ({
      from: { ...move.from },
      to: { ...move.to },
    })),
  };
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
): 'Fork' | 'Pin' | 'HangingPiece' | 'Tactic' {
  const firstMove = solution[0];
  const initialState = createGameState(board, toMove);

  if (firstMove) {
    const firstState = makeMove(initialState, firstMove.from, firstMove.to);
    const movedPiece = firstState?.board[firstMove.to.row]?.[firstMove.to.col];

    if (firstState && movedPiece) {
      if (createsPin(firstState.board, firstMove.to, movedPiece.color)) {
        return 'Pin';
      }

      const attackedTargets = getAttackedEnemyTargets(firstState.board, firstMove.to, movedPiece.color);
      const attacksKing = attackedTargets.some(piece => piece.type === 'K');
      const attacksPieces = attackedTargets.filter(piece => piece.type !== 'K').length;
      if ((attacksKing && attacksPieces >= 1) || attacksPieces >= 2) {
        return 'Fork';
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

  return 'Tactic';
}

function analyzeTheme(board: Board, toMove: PieceColor, solution: Move[]): ThemeAnalysis | null {
  const initialState = createGameState(board, toMove);
  const finalState = playMoveSequence(initialState, solution);

  if (!finalState) return null;
  if (finalState.isCheckmate) {
    return {
      theme: solution.length <= 1 ? 'MateIn1' : solution.length <= 3 ? 'MateIn2' : 'MateIn3',
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

  return swing >= TACTICAL_WIN_SWING
    ? {
      theme: classifyMaterialTheme(board, toMove, solution),
      materialSwing: swing,
    }
    : null;
}

function buildCopy(theme: GeneratedTheme, sourceId: string, windowStart: number, solution: Move[]) {
  const plyLabel = windowStart + 1;

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
      description: `Win material in 2. Start with the fork that attacks the king and the ${target}.`,
      explanation: `The first move creates a double attack, and the follow-up wins the ${target} cleanly.`,
      motif: `Real-game fork candidate: wins ${target}`,
    };
  }

  if (theme === 'Pin') {
    return {
      title: `Real-Game Pin (${sourceId} @ ply ${plyLabel})`,
      description: `Win material in 2. Start with the pin that leaves the ${target} stuck.`,
      explanation: `The first move pins the defender in place, and the follow-up wins the ${target}.`,
      motif: `Real-game pin candidate: wins ${target}`,
    };
  }

  if (theme === 'HangingPiece') {
    return {
      title: `Real-Game Hanging Piece (${sourceId} @ ply ${plyLabel})`,
      description: `Win material in 2. Start by taking the loose ${target}.`,
      explanation: `The target is insufficiently defended, so the forcing line wins the ${target} cleanly.`,
      motif: `Real-game hanging piece candidate: wins ${target}`,
    };
  }

  return {
    title: `Real-Game Tactic (${sourceId} @ ply ${plyLabel})`,
    description: `Win material in 2. Start with the forcing move that wins the ${target}.`,
    explanation: `The first move forces the reply, and the follow-up wins the ${target} cleanly.`,
    motif: `Real-game tactic candidate: wins ${target}`,
  };
}

function toDraft(
  board: Board,
  toMove: PieceColor,
  solution: Move[],
  sourceId: string,
  sourceLabel: string,
  windowStart: number,
  id: number,
): PuzzleCandidateDraft | null {
  const analysis = analyzeTheme(board, toMove, solution);
  if (!analysis) return null;

  const copy = buildCopy(analysis.theme, sourceId, windowStart, solution);

  return {
    id,
    title: copy.title,
    description: copy.description,
    explanation: copy.explanation,
    source: `${sourceLabel} (ply ${windowStart + 1})`,
    theme: analysis.theme,
    motif: copy.motif,
    difficulty: solution.length >= 5 ? 'advanced' : 'intermediate',
    toMove,
    board: cloneBoard(board),
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

  if (sourceMoveCount < minSourceMoves) {
    return generated;
  }

  if (allowReasons && input.resultReason && !allowReasons.has(input.resultReason)) {
    return generated;
  }

  if (input.resultReason && rejectReasons.has(input.resultReason)) {
    return generated;
  }

  let state = input.initialBoard
    ? createGameState(input.initialBoard, input.startingTurn ?? 'white')
    : createInitialGameState(0, 0);

  for (let index = 0; index < input.moves.length; index++) {
    for (let plies = minPlies; plies <= maxPlies; plies += 2) {
      const solution = input.moves.slice(index, index + plies);
      if (solution.length !== plies) continue;

      const draft = toDraft(
        state.board,
        state.turn,
        solution,
        input.id,
        input.source,
        index,
        startingId + generated.length,
      );

      if (!draft) continue;

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
  metadata: Pick<PuzzleGenerationSource, 'moveCount' | 'result' | 'resultReason'> = {},
): PuzzleGenerationSource {
  return {
    id,
    source,
    moves,
    initialBoard: initialBoard ?? createInitialBoard(),
    startingTurn,
    ...metadata,
  };
}

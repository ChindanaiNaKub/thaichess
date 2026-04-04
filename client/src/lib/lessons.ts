import { createInitialBoard, getLegalMoves, isInCheck, makeMove } from '@shared/engine';
import { evaluatePosition } from '@shared/analysis';
import type { Board, Piece, PieceColor, PieceType, Position } from '@shared/types';

export type LessonLevel = 'beginner' | 'intermediate' | 'advanced';
export type LessonConceptTag =
  | 'board'
  | 'movement'
  | 'piece-values'
  | 'safety'
  | 'checkmate'
  | 'opening'
  | 'coordination'
  | 'fork'
  | 'pin'
  | 'trap'
  | 'forcing'
  | 'common-mistakes'
  | 'positional-play'
  | 'pawn-structure'
  | 'endgame'
  | 'planning';

export interface LessonArrow {
  from: Position;
  to: Position;
  color: string;
}

export interface LessonHighlight {
  pos: Position;
  color: string;
}

export interface LessonAnnotation {
  pos: Position;
  icon: string;
  bgColor: string;
}

export interface LessonScene {
  board: Board;
  toMove: PieceColor;
  playerColor: PieceColor;
  priorityContext?: 'normal' | 'check-defense';
  highlights?: LessonHighlight[];
  annotations?: LessonAnnotation[];
  arrows?: LessonArrow[];
}

export interface LessonStep {
  id: string;
  title: string;
  instruction: string;
  coachTip?: string;
  scene: LessonScene;
  expectedMove?: {
    from: Position;
    to: Position;
  };
  successMessage?: string;
  wrongMoveMessage?: string;
}

export interface LessonPracticeTask {
  id: string;
  prompt: string;
  coachTip?: string;
  scene: LessonScene;
  expectedMove: {
    from: Position;
    to: Position;
  };
  candidateMoves: {
    move: {
      from: Position;
      to: Position;
    };
    verdict: 'correct' | 'tempting';
    explanation: string;
  }[];
  teaching: {
    problem: string;
    fix: string;
    threat: string;
    visibleOutcomes: string[];
  };
  successMessage: string;
  wrongMoveMessage: string;
}

export interface LessonRuleContext {
  dependsOnCounting: boolean;
  ruleImpact: string;
}

export interface MakrukLesson {
  id: string;
  level: LessonLevel;
  moduleId: string;
  order: number;
  title: string;
  shortTitle: string;
  objective: string;
  dependsOnCounting: boolean;
  ruleImpact: string;
  conceptExplanation: string;
  summary: string;
  estimatedMinutes: number;
  concepts: LessonConceptTag[];
  puzzleConcepts: string[];
  example: LessonScene;
  guidedSteps: LessonStep[];
  practiceTasks: LessonPracticeTask[];
}

export interface LessonModule {
  id: string;
  level: LessonLevel;
  order: number;
  title: string;
  description: string;
  lessons: MakrukLesson[];
}

type MakrukLessonDraft = Omit<MakrukLesson, keyof LessonRuleContext>;

interface LessonModuleDraft extends Omit<LessonModule, 'lessons'> {
  lessons: MakrukLessonDraft[];
}

export interface LessonValidationIssue {
  scope: string;
  message: string;
}

type Placement = [square: string, type: PieceType, color: PieceColor];

const LESSON_PIECE_VALUES: Record<PieceType, number> = {
  K: 0,
  R: 500,
  N: 300,
  S: 250,
  M: 200,
  PM: 200,
  P: 100,
};

function piece(type: PieceType, color: PieceColor): Piece {
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
    row: Number.parseInt(name[1], 10) - 1,
  };
}

function board(...placements: Placement[]): Board {
  const next = emptyBoard();

  for (const [name, type, color] of placements) {
    const pos = square(name);
    next[pos.row][pos.col] = piece(type, color);
  }

  return next;
}

function highlight(name: string, color: string): LessonHighlight {
  return { pos: square(name), color };
}

function annotation(name: string, icon: string, bgColor: string): LessonAnnotation {
  return { pos: square(name), icon, bgColor };
}

function arrow(from: string, to: string, color: string): LessonArrow {
  return { from: square(from), to: square(to), color };
}

function scene(
  boardState: Board,
  toMove: PieceColor,
  options: Omit<LessonScene, 'board' | 'toMove' | 'playerColor'> & { playerColor?: PieceColor } = {},
): LessonScene {
  return {
    board: boardState,
    toMove,
    playerColor: options.playerColor ?? toMove,
    priorityContext: options.priorityContext ?? 'normal',
    highlights: options.highlights,
    annotations: options.annotations,
    arrows: options.arrows,
  };
}

function move(from: string, to: string): { from: Position; to: Position } {
  return { from: square(from), to: square(to) };
}

function candidateMove(
  from: string,
  to: string,
  verdict: 'correct' | 'tempting',
  explanation: string,
): {
  move: { from: Position; to: Position };
  verdict: 'correct' | 'tempting';
  explanation: string;
} {
  return {
    move: move(from, to),
    verdict,
    explanation,
  };
}

function teaching(
  problem: string,
  fix: string,
  threat: string,
  ...visibleOutcomes: string[]
): {
  problem: string;
  fix: string;
  threat: string;
  visibleOutcomes: string[];
} {
  return {
    problem,
    fix,
    threat,
    visibleOutcomes,
  };
}

function countKings(boardState: Board, color: PieceColor): number {
  let count = 0;

  for (const row of boardState) {
    for (const cell of row) {
      if (cell?.type === 'K' && cell.color === color) count += 1;
    }
  }

  return count;
}

function findKingPosition(boardState: Board, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const cell = boardState[row][col];
      if (cell?.type === 'K' && cell.color === color) {
        return { row, col };
      }
    }
  }

  return null;
}

function areAdjacent(left: Position, right: Position): boolean {
  return Math.max(Math.abs(left.row - right.row), Math.abs(left.col - right.col)) === 1;
}

function sameSquare(left: Position, right: Position): boolean {
  return left.row === right.row && left.col === right.col;
}

function squareName(pos: Position): string {
  return `${String.fromCharCode(97 + pos.col)}${pos.row + 1}`;
}

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function getAttackSquares(boardState: Board, from: Position): Position[] {
  const piece = boardState[from.row][from.col];
  if (!piece) return [];

  const forward = piece.color === 'white' ? 1 : -1;

  switch (piece.type) {
    case 'K':
      return [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
        .map(([dr, dc]) => ({ row: from.row + dr, col: from.col + dc }))
        .filter(pos => isInBounds(pos.row, pos.col));
    case 'M':
    case 'PM':
      return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        .map(([dr, dc]) => ({ row: from.row + dr, col: from.col + dc }))
        .filter(pos => isInBounds(pos.row, pos.col));
    case 'S':
      return [[-1, -1], [-1, 1], [1, -1], [1, 1], [forward, 0]]
        .map(([dr, dc]) => ({ row: from.row + dr, col: from.col + dc }))
        .filter(pos => isInBounds(pos.row, pos.col));
    case 'N':
      return [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
        .map(([dr, dc]) => ({ row: from.row + dr, col: from.col + dc }))
        .filter(pos => isInBounds(pos.row, pos.col));
    case 'P':
      return [-1, 1]
        .map(dc => ({ row: from.row + forward, col: from.col + dc }))
        .filter(pos => isInBounds(pos.row, pos.col));
    case 'R': {
      const attacks: Position[] = [];
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        for (let distance = 1; distance < 8; distance += 1) {
          const row = from.row + dr * distance;
          const col = from.col + dc * distance;
          if (!isInBounds(row, col)) break;
          attacks.push({ row, col });
          if (boardState[row][col]) break;
        }
      }
      return attacks;
    }
  }
}

function countAttackedEnemyPieces(boardState: Board, from: Position): number {
  const piece = boardState[from.row][from.col];
  if (!piece) return 0;

  return getAttackSquares(boardState, from)
    .filter(pos => boardState[pos.row][pos.col]?.color === (piece.color === 'white' ? 'black' : 'white'))
    .length;
}

function countFriendlyAttackers(boardState: Board, target: Position, color: PieceColor): number {
  let count = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const cell = boardState[row][col];
      if (!cell || cell.color !== color) continue;
      if (sameSquare({ row, col }, target)) continue;
      if (getAttackSquares(boardState, { row, col }).some(pos => sameSquare(pos, target))) {
        count += 1;
      }
    }
  }

  return count;
}

function countControlledCenterSquares(boardState: Board, from: Position): number {
  const centerSquares = [
    { row: 3, col: 3 },
    { row: 3, col: 4 },
    { row: 4, col: 3 },
    { row: 4, col: 4 },
  ];

  return getAttackSquares(boardState, from).filter(pos => centerSquares.some(center => sameSquare(center, pos))).length;
}

function countSharedTargets(boardState: Board, from: Position, color: PieceColor): number {
  return getAttackSquares(boardState, from).filter((target) => {
    const occupant = boardState[target.row][target.col];
    if (!occupant || occupant.color === color) return false;
    return countFriendlyAttackers(boardState, target, color) > 0;
  }).length;
}

function centerDistance(pos: Position): number {
  return Math.min(
    Math.abs(pos.row - 3) + Math.abs(pos.col - 3),
    Math.abs(pos.row - 3) + Math.abs(pos.col - 4),
    Math.abs(pos.row - 4) + Math.abs(pos.col - 3),
    Math.abs(pos.row - 4) + Math.abs(pos.col - 4),
  );
}

function getPieceCounts(boardState: Board, color: PieceColor): Record<PieceType, number> {
  const counts: Record<PieceType, number> = {
    K: 0,
    M: 0,
    PM: 0,
    S: 0,
    R: 0,
    N: 0,
    P: 0,
  };

  for (const row of boardState) {
    for (const cell of row) {
      if (cell?.color === color) counts[cell.type] += 1;
    }
  }

  return counts;
}

function createSimulationState(boardState: Board, turn: PieceColor) {
  return {
    board: boardState.map(row => row.map(cell => (cell ? { ...cell } : null))),
    turn,
    moveHistory: [],
    lastMove: null,
    isCheck: false,
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

function getAllLegalMovesForColor(boardState: Board, color: PieceColor): Array<{ from: Position; to: Position }> {
  const moves: Array<{ from: Position; to: Position }> = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const occupant = boardState[row][col];
      if (!occupant || occupant.color !== color) continue;

      for (const destination of getLegalMoves(boardState, { row, col })) {
        moves.push({
          from: { row, col },
          to: destination,
        });
      }
    }
  }

  return moves;
}

function validatePiecePlacement(boardState: Board, scope: string): LessonValidationIssue[] {
  const issues: LessonValidationIssue[] = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const cell = boardState[row][col];
      if (!cell) continue;

      if (cell.type === 'P') {
        if (cell.color === 'white' && (row < 2 || row > 4)) {
          issues.push({ scope, message: `white pawn on ${String.fromCharCode(97 + col)}${row + 1} is on an impossible rank for an unpromoted pawn` });
        }
        if (cell.color === 'black' && (row < 3 || row > 5)) {
          issues.push({ scope, message: `black pawn on ${String.fromCharCode(97 + col)}${row + 1} is on an impossible rank for an unpromoted pawn` });
        }
      }
    }
  }

  for (const color of ['white', 'black'] as const) {
    const counts = getPieceCounts(boardState, color);

    if (counts.K !== 1) {
      issues.push({ scope, message: `${color} must have exactly one king` });
    }
    if (counts.R > 2) {
      issues.push({ scope, message: `${color} has too many rooks for a legal Makruk position` });
    }
    if (counts.N > 2) {
      issues.push({ scope, message: `${color} has too many knights for a legal Makruk position` });
    }
    if (counts.S > 2) {
      issues.push({ scope, message: `${color} has too many Khons for a legal Makruk position` });
    }
    if (counts.M > 1) {
      issues.push({ scope, message: `${color} has too many Mets for a legal Makruk position` });
    }
    if (counts.P + counts.PM > 8) {
      issues.push({ scope, message: `${color} has too many pawns or promoted pawns for a legal Makruk position` });
    }
  }

  return issues;
}

function countLegalMovesForColor(boardState: Board, color: PieceColor): number {
  let total = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const occupant = boardState[row][col];
      if (!occupant || occupant.color !== color) continue;
      total += getLegalMoves(boardState, { row, col }).length;
    }
  }

  return total;
}

function validateScene(sceneState: LessonScene, scope: string): LessonValidationIssue[] {
  const issues: LessonValidationIssue[] = [...validatePiecePlacement(sceneState.board, scope)];
  const whiteKings = countKings(sceneState.board, 'white');
  const blackKings = countKings(sceneState.board, 'black');

  if (whiteKings !== 1) {
    issues.push({ scope, message: `expected exactly one white king, found ${whiteKings}` });
  }
  if (blackKings !== 1) {
    issues.push({ scope, message: `expected exactly one black king, found ${blackKings}` });
  }

  if (whiteKings !== 1 || blackKings !== 1) {
    return issues;
  }

  const whiteKing = findKingPosition(sceneState.board, 'white');
  const blackKing = findKingPosition(sceneState.board, 'black');
  if (!whiteKing || !blackKing) {
    return issues;
  }

  if (areAdjacent(whiteKing, blackKing)) {
    issues.push({ scope, message: 'kings may not be adjacent or directly attack each other' });
  }

  const whiteInCheck = isInCheck(sceneState.board, 'white');
  const blackInCheck = isInCheck(sceneState.board, 'black');
  const activeCheckColor = whiteInCheck ? 'white' : blackInCheck ? 'black' : null;

  if (whiteInCheck && blackInCheck) {
    issues.push({ scope, message: 'both kings are in check, which is not a legal Makruk position' });
  }
  if (whiteInCheck && sceneState.toMove !== 'white') {
    issues.push({ scope, message: 'white is in check, so white must be the side to move' });
  }
  if (blackInCheck && sceneState.toMove !== 'black') {
    issues.push({ scope, message: 'black is in check, so black must be the side to move' });
  }
  if (activeCheckColor && sceneState.priorityContext !== 'check-defense') {
    issues.push({ scope, message: 'active check is only allowed in scenes that explicitly teach defending the check' });
  }
  if (!activeCheckColor && sceneState.priorityContext === 'check-defense') {
    issues.push({ scope, message: 'scene is marked as check-defense, but the side to move is not actually in check' });
  }

  const legalMovesForSideToMove = countLegalMovesForColor(sceneState.board, sceneState.toMove);
  if (legalMovesForSideToMove === 0) {
    issues.push({ scope, message: `${sceneState.toMove} has no legal moves in this lesson scene` });
  }

  return issues;
}

function validateExpectedMove(
  sceneState: LessonScene,
  expectedMove: { from: Position; to: Position },
  scope: string,
): LessonValidationIssue[] {
  const issues: LessonValidationIssue[] = [];
  const pieceToMove = sceneState.board[expectedMove.from.row][expectedMove.from.col];

  if (!pieceToMove) {
    issues.push({ scope, message: 'expected move starts from an empty square' });
    return issues;
  }

  if (pieceToMove.color !== sceneState.toMove) {
    issues.push({ scope, message: `expected move tries to move ${pieceToMove.color}, but ${sceneState.toMove} is marked to move` });
  }

  const legalMoves = getLegalMoves(sceneState.board, expectedMove.from);
  const isLegal = legalMoves.some(pos => pos.row === expectedMove.to.row && pos.col === expectedMove.to.col);
  if (!isLegal) {
    issues.push({ scope, message: 'expected move is not legal in the current scene' });
  }

  return issues;
}

function validateTacticalSoundness(
  lesson: MakrukLesson,
  sceneState: LessonScene,
  expectedMove: { from: Position; to: Position },
  scope: string,
): LessonValidationIssue[] {
  const issues: LessonValidationIssue[] = [];
  const moverColor = sceneState.toMove;
  const opponent = moverColor === 'white' ? 'black' : 'white';
  const beforeEval = evaluatePosition(sceneState.board, moverColor);
  const nextState = makeMove(createSimulationState(sceneState.board, moverColor), expectedMove.from, expectedMove.to);

  if (!nextState) {
    issues.push({ scope, message: 'soundness validation could not simulate the lesson move' });
    return issues;
  }

  if (nextState.isCheckmate) {
    return issues;
  }

  const movedPiece = nextState.board[expectedMove.to.row][expectedMove.to.col];
  if (!movedPiece) {
    issues.push({ scope, message: 'soundness validation could not find the moved piece after the lesson move' });
    return issues;
  }

  const afterEval = evaluatePosition(nextState.board, moverColor);
  let worstReplyEval = Number.POSITIVE_INFINITY;
  let worstReplyMove: { from: Position; to: Position } | null = null;
  let worstReplyCapturesMovedPiece = false;
  let worstCaptureReply:
    | {
        from: Position;
        to: Position;
        eval: number;
        bestRecaptureEval: number | null;
      }
    | null = null;

  for (const reply of getAllLegalMovesForColor(nextState.board, opponent)) {
    const replyState = makeMove(nextState, reply.from, reply.to);
    if (!replyState) continue;

    const replyEval = evaluatePosition(replyState.board, moverColor);
    const capturesMovedPiece = sameSquare(reply.to, expectedMove.to);

    if (replyEval < worstReplyEval) {
      worstReplyEval = replyEval;
      worstReplyMove = reply;
      worstReplyCapturesMovedPiece = capturesMovedPiece;
    }

    if (capturesMovedPiece && (!worstCaptureReply || replyEval < worstCaptureReply.eval)) {
      const recaptureMoves = getAllLegalMovesForColor(replyState.board, moverColor)
        .filter(candidate => sameSquare(candidate.to, expectedMove.to));
      const bestRecaptureEval = recaptureMoves.length > 0
        ? Math.max(...recaptureMoves.map((candidate) => {
          const recaptureState = makeMove(replyState, candidate.from, candidate.to);
          return recaptureState ? evaluatePosition(recaptureState.board, moverColor) : Number.NEGATIVE_INFINITY;
        }))
        : null;

      worstCaptureReply = {
        from: reply.from,
        to: reply.to,
        eval: replyEval,
        bestRecaptureEval,
      };
    }
  }

  if (!Number.isFinite(worstReplyEval)) {
    return issues;
  }

  const improvementSurvivesBestReply = worstReplyEval >= beforeEval + 8;
  const severeBestReplyDrop = worstReplyEval < beforeEval - 80;
  if (severeBestReplyDrop) {
    issues.push({
      scope,
      message: `lesson move is not sound after the obvious best reply ${squareName(worstReplyMove!.from)}-${squareName(worstReplyMove!.to)}`,
    });
  }

  if (worstCaptureReply) {
    const movedPieceValue = LESSON_PIECE_VALUES[movedPiece.type];
    const recaptureRestoresEnough =
      worstCaptureReply.bestRecaptureEval !== null
      && (
        worstCaptureReply.bestRecaptureEval >= beforeEval + 8
        || worstCaptureReply.bestRecaptureEval >= afterEval - 35
      );
    const losesMovedPieceForTooLittle =
      !recaptureRestoresEnough
      && (
        worstCaptureReply.eval <= beforeEval + 5
        || afterEval - worstCaptureReply.eval >= Math.max(60, Math.round(movedPieceValue * 0.45))
      );

    if (losesMovedPieceForTooLittle) {
      issues.push({
        scope,
        message: `lesson move hangs the moved ${movedPiece.type} because ${squareName(worstCaptureReply.from)}-${squareName(worstCaptureReply.to)} refutes the idea`,
      });
    }
  }

  if (
    nextState.isCheck
    && worstReplyCapturesMovedPiece
    && !improvementSurvivesBestReply
    && (!worstCaptureReply || worstCaptureReply.bestRecaptureEval === null || worstCaptureReply.bestRecaptureEval < beforeEval + 8)
  ) {
    issues.push({
      scope,
      message: 'checking move is not enough here because the checking piece can be captured and the attack does not hold up',
    });
  }

  return issues;
}

function validateTeachingQuality(
  lesson: MakrukLesson,
  task: LessonPracticeTask,
  scope: string,
): LessonValidationIssue[] {
  const issues: LessonValidationIssue[] = [];
  const { teaching: lessonTeaching } = task;

  if (!lessonTeaching.problem.trim()) issues.push({ scope, message: 'teaching explanation must state the problem' });
  if (!lessonTeaching.fix.trim()) issues.push({ scope, message: 'teaching explanation must state what the move fixes' });
  if (!lessonTeaching.threat.trim()) issues.push({ scope, message: 'teaching explanation must state the new threat or concrete result' });
  if (lessonTeaching.visibleOutcomes.length === 0) {
    issues.push({ scope, message: 'teaching explanation must list at least one visible outcome' });
  }

  const movingPiece = task.scene.board[task.expectedMove.from.row][task.expectedMove.from.col];
  if (!movingPiece) {
    issues.push({ scope, message: 'quality validation could not find the moving piece' });
    return issues;
  }

  const nextState = makeMove(
    {
      board: task.scene.board.map(row => row.map(piece => (piece ? { ...piece } : null))),
      turn: task.scene.toMove,
      moveHistory: [],
      lastMove: null,
      isCheck: false,
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
    },
    task.expectedMove.from,
    task.expectedMove.to,
  );

  if (!nextState) {
    issues.push({ scope, message: 'quality validation could not simulate the lesson move' });
    return issues;
  }

  const moverColor = task.scene.toMove;
  const opponent = moverColor === 'white' ? 'black' : 'white';
  const capturedPiece = task.scene.board[task.expectedMove.to.row][task.expectedMove.to.col];
  const promoted = nextState.moveHistory.at(-1)?.promoted === true;
  const beforeAttacks = countAttackedEnemyPieces(task.scene.board, task.expectedMove.from);
  const afterAttacks = countAttackedEnemyPieces(nextState.board, task.expectedMove.to);
  const beforeCenter = countControlledCenterSquares(task.scene.board, task.expectedMove.from);
  const afterCenter = countControlledCenterSquares(nextState.board, task.expectedMove.to);
  const beforeSupport = countFriendlyAttackers(task.scene.board, task.expectedMove.from, moverColor);
  const afterSupport = countFriendlyAttackers(nextState.board, task.expectedMove.to, moverColor);
  const beforeMobility = countLegalMovesForColor(task.scene.board, opponent);
  const afterMobility = countLegalMovesForColor(nextState.board, opponent);
  const sharedTargets = countSharedTargets(nextState.board, task.expectedMove.to, moverColor);
  const coordinatedCapture = Boolean(capturedPiece) && countFriendlyAttackers(task.scene.board, task.expectedMove.to, moverColor) > 0;
  const improvesTowardCenter = centerDistance(task.expectedMove.to) < centerDistance(task.expectedMove.from);

  const createsVisibleEffect =
    nextState.isCheck
    || nextState.isCheckmate
    || Boolean(capturedPiece)
    || promoted
    || afterAttacks > beforeAttacks
    || afterCenter > beforeCenter
    || beforeMobility - afterMobility >= 2
    || (afterSupport > beforeSupport && (afterAttacks > 0 || nextState.isCheck))
    || (improvesTowardCenter && afterSupport > 0)
    || sharedTargets > 0;

  if (!createsVisibleEffect) {
    issues.push({ scope, message: 'lesson move does not create a visible enough effect for a beginner lesson' });
  }

  if (lesson.concepts.includes('coordination') && !nextState.isCheck && sharedTargets === 0 && !coordinatedCapture) {
    issues.push({ scope, message: 'coordination lesson must show at least two pieces working on the same concrete target or an immediate check' });
  }

  return issues;
}

function validateRuleImpact(lesson: MakrukLesson): LessonValidationIssue[] {
  const issues: LessonValidationIssue[] = [];
  const scope = `${lesson.id}/ruleImpact`;
  const text = lesson.ruleImpact.trim();
  const lessonSynopsis = `${lesson.title} ${lesson.objective} ${lesson.conceptExplanation} ${lesson.summary}`;
  const needsCountingReview = lesson.concepts.includes('endgame') || /\b(?:endgame|winning|wins?|advantage|convert|conversion|drawn?|better)\b/i.test(lessonSynopsis);

  if (!text) {
    issues.push({ scope, message: 'lesson must explain how Makruk result rules affect the position' });
    return issues;
  }

  if (needsCountingReview && !/\bcount/i.test(text) && !/\bSak\b/i.test(text)) {
    issues.push({ scope, message: 'lesson with endgame or advantage language must explicitly address counting impact' });
  }

  if (!lesson.dependsOnCounting) {
    return issues;
  }

  if (!/\b(?:8|16|22|32|44|64|65)\b/.test(text)) {
    issues.push({ scope, message: 'counting-dependent lesson must state the remaining move limit or relevant count number' });
  }

  if (!/\b(?:delay|delays|too slow|wastes time|if white delays|if black delays)\b/i.test(text)) {
    issues.push({ scope, message: 'counting-dependent lesson must explain what happens if the player delays' });
  }

  if (!/\b(?:winning|win|draw|drawn)\b/i.test(text)) {
    issues.push({ scope, message: 'counting-dependent lesson must say whether the position is winning or drawn' });
  }

  return issues;
}

export function validateLessonCatalog(modules: LessonModule[]): LessonValidationIssue[] {
  const issues: LessonValidationIssue[] = [];

  for (const module of modules) {
    for (const lesson of module.lessons) {
      issues.push(...validateRuleImpact(lesson));
      issues.push(...validateScene(lesson.example, `${lesson.id}/example`));

      for (const step of lesson.guidedSteps) {
        const scope = `${lesson.id}/${step.id}`;
        issues.push(...validateScene(step.scene, scope));
        if (step.expectedMove) {
          issues.push(...validateExpectedMove(step.scene, step.expectedMove, scope));
          issues.push(...validateTacticalSoundness(lesson, step.scene, step.expectedMove, scope));
        }
      }

      for (const task of lesson.practiceTasks) {
        const scope = `${lesson.id}/${task.id}`;
        issues.push(...validateScene(task.scene, scope));
        issues.push(...validateExpectedMove(task.scene, task.expectedMove, scope));
        issues.push(...validateTacticalSoundness(lesson, task.scene, task.expectedMove, scope));
        issues.push(...validateTeachingQuality(lesson, task, scope));

        for (const [candidateIndex, candidate] of task.candidateMoves.entries()) {
          issues.push(...validateExpectedMove(task.scene, candidate.move, `${scope}/candidate-${candidateIndex + 1}`));
        }
      }
    }
  }

  return issues;
}

const centerHighlights = [
  highlight('d4', 'rgba(129, 196, 84, 0.35)'),
  highlight('e4', 'rgba(129, 196, 84, 0.35)'),
  highlight('d5', 'rgba(129, 196, 84, 0.35)'),
  highlight('e5', 'rgba(129, 196, 84, 0.35)'),
];

const realisticOpenFileBoard = board(
  ['a1', 'R', 'white'],
  ['b1', 'N', 'white'],
  ['c1', 'S', 'white'],
  ['c2', 'K', 'white'],
  ['e2', 'M', 'white'],
  ['d2', 'R', 'white'],
  ['e6', 'S', 'white'],
  ['f7', 'N', 'white'],
  ['a3', 'P', 'white'],
  ['b3', 'P', 'white'],
  ['b4', 'P', 'white'],
  ['c4', 'P', 'white'],
  ['e4', 'P', 'white'],
  ['f3', 'P', 'white'],
  ['g3', 'P', 'white'],
  ['h3', 'P', 'white'],
  ['a8', 'R', 'black'],
  ['b8', 'N', 'black'],
  ['c8', 'S', 'black'],
  ['b7', 'M', 'black'],
  ['e8', 'K', 'black'],
  ['f8', 'S', 'black'],
  ['g8', 'N', 'black'],
  ['h8', 'R', 'black'],
  ['a6', 'P', 'black'],
  ['b6', 'P', 'black'],
  ['c6', 'P', 'black'],
  ['f6', 'P', 'black'],
  ['g6', 'P', 'black'],
  ['h6', 'P', 'black'],
);

const realisticCoordinationBoard = board(
  ['f6', 'K', 'white'],
  ['f5', 'R', 'white'],
  ['d6', 'M', 'white'],
  ['c7', 'S', 'white'],
  ['g6', 'N', 'white'],
  ['a4', 'P', 'white'],
  ['b3', 'P', 'white'],
  ['c4', 'P', 'white'],
  ['h4', 'P', 'white'],
  ['e8', 'K', 'black'],
  ['h8', 'R', 'black'],
  ['b8', 'N', 'black'],
  ['a6', 'P', 'black'],
  ['b6', 'P', 'black'],
  ['c6', 'P', 'black'],
  ['d7', 'PM', 'black'],
  ['f7', 'PM', 'black'],
  ['h6', 'P', 'black'],
);

const realisticMetSupportBoard = board(
  ['c3', 'K', 'white'],
  ['e5', 'M', 'white'],
  ['g5', 'R', 'white'],
  ['h5', 'N', 'white'],
  ['f4', 'S', 'white'],
  ['a3', 'P', 'white'],
  ['b3', 'P', 'white'],
  ['c4', 'P', 'white'],
  ['e4', 'P', 'white'],
  ['g3', 'P', 'white'],
  ['g8', 'K', 'black'],
  ['a8', 'R', 'black'],
  ['h8', 'R', 'black'],
  ['f6', 'N', 'black'],
  ['a6', 'P', 'black'],
  ['b6', 'P', 'black'],
  ['c6', 'P', 'black'],
  ['e6', 'P', 'black'],
  ['g6', 'P', 'black'],
);

const realisticEarlyMistakesBoard = board(
  ['a1', 'R', 'white'],
  ['b1', 'N', 'white'],
  ['c1', 'S', 'white'],
  ['d1', 'K', 'white'],
  ['e1', 'M', 'white'],
  ['f1', 'S', 'white'],
  ['g1', 'N', 'white'],
  ['h1', 'R', 'white'],
  ['a3', 'P', 'white'],
  ['b3', 'P', 'white'],
  ['c3', 'P', 'white'],
  ['c4', 'P', 'white'],
  ['e4', 'P', 'white'],
  ['f3', 'P', 'white'],
  ['g3', 'P', 'white'],
  ['h3', 'P', 'white'],
  ['d8', 'R', 'black'],
  ['b8', 'N', 'black'],
  ['c8', 'S', 'black'],
  ['c7', 'M', 'black'],
  ['e8', 'K', 'black'],
  ['f8', 'S', 'black'],
  ['g8', 'N', 'black'],
  ['h8', 'R', 'black'],
  ['a6', 'P', 'black'],
  ['b6', 'P', 'black'],
  ['c6', 'P', 'black'],
  ['c5', 'P', 'black'],
  ['e6', 'P', 'black'],
  ['f6', 'P', 'black'],
  ['g6', 'P', 'black'],
  ['h6', 'P', 'black'],
);

const realisticPositionalBoard = board(
  ['a1', 'R', 'white'],
  ['c2', 'K', 'white'],
  ['e2', 'M', 'white'],
  ['f3', 'S', 'white'],
  ['f4', 'N', 'white'],
  ['a3', 'P', 'white'],
  ['b3', 'P', 'white'],
  ['c4', 'P', 'white'],
  ['e4', 'P', 'white'],
  ['g3', 'P', 'white'],
  ['h3', 'P', 'white'],
  ['a8', 'R', 'black'],
  ['b8', 'N', 'black'],
  ['f8', 'S', 'black'],
  ['g8', 'K', 'black'],
  ['a6', 'P', 'black'],
  ['b6', 'P', 'black'],
  ['f6', 'P', 'black'],
  ['g6', 'P', 'black'],
  ['h6', 'P', 'black'],
);

const realisticEndgameBoard = board(
  ['d4', 'K', 'white'],
  ['e4', 'P', 'white'],
  ['e5', 'R', 'black'],
  ['g7', 'K', 'black'],
);

const countingRuleBoard = board(
  ['c3', 'K', 'white'],
  ['d6', 'R', 'white'],
  ['h8', 'K', 'black'],
);

const khonPressureBoard = board(
  ['c2', 'K', 'white'],
  ['d4', 'S', 'white'],
  ['a1', 'R', 'white'],
  ['e6', 'P', 'black'],
  ['h8', 'K', 'black'],
);

const pawnStructureBoard = board(
  ['d1', 'K', 'white'],
  ['c4', 'P', 'white'],
  ['d4', 'P', 'white'],
  ['e6', 'R', 'black'],
  ['e8', 'K', 'black'],
);

const strategicPlanningBoard = board(
  ['a1', 'R', 'white'],
  ['g2', 'K', 'white'],
  ['e3', 'S', 'white'],
  ['e4', 'P', 'white'],
  ['f4', 'P', 'white'],
  ['d6', 'P', 'black'],
  ['f7', 'N', 'black'],
  ['h8', 'K', 'black'],
);

const sourceKhonExpansionBoard = board(
  ['g1', 'K', 'white'],
  ['e5', 'R', 'white'],
  ['d3', 'S', 'white'],
  ['h5', 'K', 'black'],
  ['d5', 'N', 'black'],
  ['f5', 'S', 'black'],
);

const sourceKnightClampBoard = board(
  ['e2', 'K', 'white'],
  ['d2', 'N', 'white'],
  ['e4', 'P', 'white'],
  ['c7', 'K', 'black'],
  ['b6', 'M', 'black'],
  ['c5', 'P', 'black'],
  ['e6', 'S', 'black'],
);

const LESSON_RULE_CONTEXTS: Record<string, LessonRuleContext> = {
  'board-and-battlefield': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: the starting board still has every unpromoted Bia, so neither Sak Mak nor Sak Kradan can start.',
  },
  'pawn-basics': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: this lesson is teaching how an unpromoted Bia moves and captures, so counting is automatically off.',
  },
  'knight-basics': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: this is a pure Ma movement and fork pattern, not a counted ending.',
  },
  'rook-basics': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: both sides still have several unpromoted Bia, so the open-file attack is judged by tactics, not by count pressure.',
  },
  'khon-basics': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: the lesson is about Khon placement in a live middlegame position, not a pawnless counted phase.',
  },
  'met-basics': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: the Met is removing a defender in a middlegame attack while unpromoted Bia still remain.',
  },
  'values-captures-and-safety': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: this lesson is about punishing a loose rook immediately, so there is no counted-endgame question to solve first.',
  },
  'check-and-checkmate': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: mate ends the game immediately, and a finished mating net matters more than any later counting rule.',
  },
  'opening-principles': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: opening lessons always begin before any counting rule can exist because the unpromoted pawns are still on the board.',
  },
  'pawn-role-in-the-opening': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: this is an opening-space lesson with unpromoted Bia in play, so counting is irrelevant here.',
  },
  'piece-coordination': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: the position is about an immediate coordinated attack, not converting a long endgame edge under a draw clock.',
  },
  'knight-forks': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: the fork wins by force in the current tactic and does not depend on any Sak Mak or Sak Kradan count.',
  },
  'pins-traps-and-forcing': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: the lesson is about restriction moves in an active position, not about proving a win before the count runs out.',
  },
  'common-mistakes': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: answering check is urgent in any phase, and this board is far from a counted ending.',
  },
  'positional-play': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: White is improving a Ma on an outpost while multiple unpromoted Bia remain, so no count has started.',
  },
  'pawn-structure': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: the c4 and d4 Bia are still unpromoted, so this space-gaining lesson is outside counted-endgame rules.',
  },
  'expand-advantage-with-khon': {
    dependsOnCounting: false,
    ruleImpact: 'ไม่มีผลจากกติกานับ เพราะตำแหน่งนี้ยังเป็นกลางกระดานและยังมีเบี้ยคว่ำอยู่หลายตัว การตัดสินใจจึงขึ้นกับการเพิ่มแรงกดและบีบตาเดิน ไม่ใช่การนับ Sak Mak หรือ Sak Kradan',
  },
  'knight-clamps-met-escape': {
    dependsOnCounting: false,
    ruleImpact: 'ไม่มีผลจากกติกานับ เพราะตำแหน่งนี้ยังไม่ใช่ช่วงไล่หมากและยังมีเบี้ยคว่ำอยู่ การประเมินจึงอยู่ที่จังหวะของม้าและทางหนีของเม็ด',
  },
  'endgame-fundamentals': {
    dependsOnCounting: true,
    ruleImpact: 'Counting matters here. In the counted Rua-versus-bare-Khun scene, Sak Mak starts automatically at count 3 and White only gets 16 counted moves with one Rua. If White delays with harmless checks or king shuffles, Black holds a draw after White spends the final attacking move without mate. So the position is not automatically winning just because White has a rook; it is winning only if White can finish before the count closes.',
  },
  'strategic-planning': {
    dependsOnCounting: false,
    ruleImpact: 'No counting issue: White is improving a rook in a middlegame structure with unpromoted Bia still present, so the plan is not constrained by a counting limit.',
  },
};

function withRuleContext(lesson: MakrukLessonDraft): MakrukLesson {
  const ruleContext = LESSON_RULE_CONTEXTS[lesson.id];

  if (!ruleContext) {
    throw new Error(`Missing lesson rule context for ${lesson.id}`);
  }

  return {
    ...lesson,
    ...ruleContext,
  };
}

const MODULE_DRAFTS: LessonModuleDraft[] = [
  {
    id: 'beginner-foundations',
    level: 'beginner',
    order: 1,
    title: 'Beginner Foundations',
    description: 'Learn the board, the pieces, basic safety, and your first clean mates.',
    lessons: [
      {
        id: 'board-and-battlefield',
        moduleId: 'beginner-foundations',
        level: 'beginner',
        order: 1,
        title: 'Board and Battlefield',
        shortTitle: 'Board',
        objective: 'See how Makruk starts and why the center matters from move one.',
        conceptExplanation: 'Makruk uses the same 8x8 board as chess, but the army has traditional names: Khun, Met, Khon, Ma, Rua, and Bia. The Bia already stand on the third rank, so the fight for d4, e4, d5, and e5 starts quickly and the opening feels active right away.',
        summary: 'Learn the board first, then look at the center. In Makruk, the center is where your pieces start to breathe.',
        estimatedMinutes: 4,
        concepts: ['board', 'opening'],
        puzzleConcepts: ['opening'],
        example: scene(createInitialBoard(), 'white', {
          highlights: centerHighlights,
          annotations: [
            annotation('d1', 'K', '#7cb342'),
            annotation('e1', 'M', '#607d8b'),
            annotation('d8', 'M', '#607d8b'),
            annotation('e8', 'K', '#ef5350'),
          ],
        }),
        guidedSteps: [
          {
            id: 'board-center',
            title: 'Start from the center',
            instruction: 'These four squares are your reference point. Most good Makruk plans either take this space or pressure it.',
            coachTip: 'You do not need to memorize theory yet. Just keep asking: who controls the center better?',
            scene: scene(createInitialBoard(), 'white', {
              highlights: centerHighlights,
            }),
          },
          {
            id: 'board-pawns',
            title: 'Notice the pawn line',
            instruction: 'Makruk pawns already begin on the third rank, so they reach the center with one step instead of two.',
            coachTip: 'This is one reason Makruk openings feel direct even when the attacks are slower.',
            scene: scene(createInitialBoard(), 'white', {
              highlights: [
                highlight('c3', 'rgba(255, 213, 79, 0.35)'),
                highlight('d3', 'rgba(255, 213, 79, 0.35)'),
                highlight('e3', 'rgba(255, 213, 79, 0.35)'),
                highlight('f3', 'rgba(255, 213, 79, 0.35)'),
              ],
            }),
          },
          {
            id: 'board-piece-names',
            title: 'Learn the traditional names',
            instruction: 'The royal pair is Khun and Met. The long pieces are Rua, the jumpers are Ma, the short diagonal helpers are Khon, and the pawns are Bia.',
            coachTip: 'Using the Makruk names early makes later study much easier.',
            scene: scene(createInitialBoard(), 'white', {
              annotations: [
                annotation('d1', 'Khun', '#7cb342'),
                annotation('e1', 'Met', '#607d8b'),
                annotation('a1', 'Rua', '#ffca28'),
                annotation('b1', 'Ma', '#26c6da'),
                annotation('c1', 'Khon', '#29b6f6'),
                annotation('d3', 'Bia', '#8bc34a'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'board-first-center-step',
            prompt: 'Push the d-pawn one step to claim central space.',
            coachTip: 'Simple, direct, and useful. That is often how good Makruk starts.',
            scene: scene(createInitialBoard(), 'white', {
              highlights: [
                highlight('d3', 'rgba(129, 196, 84, 0.35)'),
                highlight('d4', 'rgba(129, 196, 84, 0.35)'),
              ],
              arrows: [arrow('d3', 'd4', '#81c784')],
            }),
            expectedMove: move('d3', 'd4'),
            candidateMoves: [
              candidateMove('d3', 'd4', 'correct', 'd4 claims one of the key center squares immediately and gives your position more space.'),
              candidateMove('a3', 'a4', 'tempting', 'a4 is a legal pawn move, but it does not fight for the center at all. d4 is better because it claims the key square the lesson is pointing at.'),
            ],
            teaching: teaching(
              'White has not challenged the center yet, so the position is still passive.',
              'd4 claims a central square with a move that is easy to understand immediately.',
              'White now controls more central space and can build the opening around that square.',
              'The d-pawn steps straight into the center.',
              'White gains space on one of the four key opening squares.',
            ),
            successMessage: 'Nice. One quiet pawn step already improves your space.',
            wrongMoveMessage: 'Try the d-pawn. This task is about taking one useful center square.',
          },
        ],
      },
      {
        id: 'pawn-basics',
        moduleId: 'beginner-foundations',
        level: 'beginner',
        order: 2,
        title: 'Pawn Basics',
        shortTitle: 'Pawn',
        objective: 'Learn how the pawn moves, captures, and helps build the opening.',
        conceptExplanation: 'The Makruk pawn, or Bia, moves one square straight forward and captures one square diagonally forward. It is small, but it shapes the board, supports the center, and when it reaches the sixth rank it becomes a promoted pawn, often called Bia-ngai, which then moves like a Met.',
        summary: 'Pawns look modest, but they define space, support pieces, and decide many endings.',
        estimatedMinutes: 5,
        concepts: ['movement', 'opening', 'pawn-structure'],
        puzzleConcepts: ['opening', 'promotion'],
        example: scene(board(
          ['d1', 'K', 'white'],
          ['d3', 'P', 'white'],
          ['e4', 'P', 'black'],
          ['e8', 'K', 'black'],
        ), 'white', {
          highlights: [
            highlight('d3', 'rgba(129, 196, 84, 0.35)'),
            highlight('d4', 'rgba(129, 196, 84, 0.25)'),
            highlight('e4', 'rgba(255, 213, 79, 0.35)'),
          ],
          arrows: [
            arrow('d3', 'd4', '#81c784'),
            arrow('d3', 'e4', '#ffd54f'),
          ],
        }),
        guidedSteps: [
          {
            id: 'pawn-move',
            title: 'Forward to move',
            instruction: 'A pawn steps straight ahead one square. There is no two-square jump.',
            coachTip: 'Because there is no double push, pawn timing matters even more.',
            scene: scene(board(
              ['d1', 'K', 'white'],
              ['d3', 'P', 'white'],
              ['e8', 'K', 'black'],
            ), 'white', {
              highlights: [
                highlight('d3', 'rgba(129, 196, 84, 0.35)'),
                highlight('d4', 'rgba(129, 196, 84, 0.25)'),
              ],
              arrows: [arrow('d3', 'd4', '#81c784')],
            }),
          },
          {
            id: 'pawn-capture',
            title: 'Diagonal to capture',
            instruction: 'To take something, the pawn goes diagonally forward.',
            coachTip: 'This difference between move and capture is worth making automatic early.',
            scene: scene(board(
              ['d1', 'K', 'white'],
              ['d3', 'P', 'white'],
              ['e4', 'R', 'black'],
              ['e8', 'K', 'black'],
            ), 'white', {
              highlights: [
                highlight('d3', 'rgba(129, 196, 84, 0.35)'),
                highlight('e4', 'rgba(255, 213, 79, 0.35)'),
              ],
              arrows: [arrow('d3', 'e4', '#ffd54f')],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'pawn-capture-task',
            prompt: 'Use the pawn to capture the rook on e4.',
            coachTip: 'Small piece, big job. Pawns often win material when a file opens.',
            scene: scene(board(
              ['d1', 'K', 'white'],
              ['d3', 'P', 'white'],
              ['e4', 'R', 'black'],
              ['e8', 'K', 'black'],
            ), 'white', {
              highlights: [
                highlight('d3', 'rgba(129, 196, 84, 0.35)'),
                highlight('e4', 'rgba(255, 213, 79, 0.35)'),
              ],
            }),
            expectedMove: move('d3', 'e4'),
            candidateMoves: [
              candidateMove('d3', 'e4', 'correct', 'This wins a rook by using the pawn’s diagonal capture rule. It gains material right away.'),
              candidateMove('d3', 'd4', 'tempting', 'd4 looks natural, but it ignores the free rook on e4. When a pawn can win material safely, that is the better move.'),
            ],
            teaching: teaching(
              'A black rook is hanging on e4 and White can win it immediately.',
              'dxe4 uses the pawn’s real capture rule instead of making a quiet forward move.',
              'White wins a rook at once and turns a small pawn into a material gain.',
              'The pawn captures diagonally, not straight ahead.',
              'The black rook disappears immediately after the move.',
            ),
            successMessage: 'Good. You used the correct diagonal capture.',
            wrongMoveMessage: 'The pawn cannot take straight ahead. Capture diagonally on e4.',
          },
        ],
      },
      {
        id: 'knight-basics',
        moduleId: 'beginner-foundations',
        level: 'beginner',
        order: 3,
        title: 'Knight Patterns and L-Shape Thinking',
        shortTitle: 'Knight',
        objective: 'See the knight as a jumping piece and start recognizing its landing squares.',
        conceptExplanation: 'The Makruk knight, or Ma, moves exactly like the chess knight: an L-shape, two in one direction and one to the side. It jumps over pieces, so it stays dangerous even in crowded positions.',
        summary: 'Do not stare at the knight from where it stands. Picture the eight landing squares first.',
        estimatedMinutes: 5,
        concepts: ['movement', 'fork'],
        puzzleConcepts: ['fork'],
        example: scene(board(
          ['a1', 'K', 'white'],
          ['e4', 'N', 'white'],
          ['h8', 'K', 'black'],
        ), 'white', {
          highlights: [
            highlight('c3', 'rgba(129, 196, 84, 0.25)'),
            highlight('c5', 'rgba(129, 196, 84, 0.25)'),
            highlight('d2', 'rgba(129, 196, 84, 0.25)'),
            highlight('d6', 'rgba(129, 196, 84, 0.25)'),
            highlight('f2', 'rgba(129, 196, 84, 0.25)'),
            highlight('f6', 'rgba(129, 196, 84, 0.25)'),
            highlight('g3', 'rgba(129, 196, 84, 0.25)'),
            highlight('g5', 'rgba(129, 196, 84, 0.25)'),
          ],
          annotations: [annotation('e4', 'N', '#4fc3f7')],
        }),
        guidedSteps: [
          {
            id: 'knight-jump',
            title: 'Think in landing squares',
            instruction: 'The knight jumps. It does not slide. That means pieces in the way do not matter.',
            coachTip: 'A good habit is to count the legal landing squares before you calculate tactics.',
            scene: scene(board(
              ['a1', 'K', 'white'],
              ['e4', 'N', 'white'],
              ['h8', 'K', 'black'],
            ), 'white', {
              highlights: [
                highlight('c3', 'rgba(129, 196, 84, 0.25)'),
                highlight('c5', 'rgba(129, 196, 84, 0.25)'),
                highlight('d2', 'rgba(129, 196, 84, 0.25)'),
                highlight('d6', 'rgba(129, 196, 84, 0.25)'),
                highlight('f2', 'rgba(129, 196, 84, 0.25)'),
                highlight('f6', 'rgba(129, 196, 84, 0.25)'),
                highlight('g3', 'rgba(129, 196, 84, 0.25)'),
                highlight('g5', 'rgba(129, 196, 84, 0.25)'),
              ],
            }),
          },
          {
            id: 'knight-fork-idea',
            title: 'This is why forks happen',
            instruction: 'One knight jump can attack two valuable targets at once. Later lessons will turn this into full tactics.',
            coachTip: 'Knights are strongest when the opponent has many pieces clustered around the center.',
            scene: scene(board(
              ['a1', 'K', 'white'],
              ['e4', 'N', 'white'],
              ['e8', 'K', 'black'],
              ['h7', 'R', 'black'],
            ), 'white', {
              arrows: [arrow('e4', 'f6', '#4fc3f7')],
              highlights: [
                highlight('f6', 'rgba(79, 195, 247, 0.25)'),
                highlight('e8', 'rgba(255, 213, 79, 0.35)'),
                highlight('h7', 'rgba(255, 213, 79, 0.35)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'knight-fork-task',
            prompt: 'Jump the knight to the square that forks the king and rook.',
            coachTip: 'Look for the L-shape that checks the king and also hits h7.',
            scene: scene(board(
              ['a1', 'K', 'white'],
              ['e4', 'N', 'white'],
              ['e8', 'K', 'black'],
              ['h7', 'R', 'black'],
            ), 'white'),
            expectedMove: move('e4', 'f6'),
            candidateMoves: [
              candidateMove('e4', 'f6', 'correct', 'Nf6 checks the king and attacks the rook at the same time. One move creates two threats.'),
              candidateMove('e4', 'g5', 'tempting', 'Ng5 is active, but it does not fork anything. The lesson position is asking for the double attack on e8 and h7.'),
            ],
            teaching: teaching(
              'White needs one move that does more than attack a single target.',
              'Nf6 lands on the fork square where the knight attacks both the king and the rook.',
              'Black must answer the check, and the rook on h7 stays under threat next.',
              'The knight gives check immediately.',
              'The rook on h7 becomes a second target at the same time.',
            ),
            successMessage: 'Exactly. That is the classic fork pattern.',
            wrongMoveMessage: 'Try the jump that attacks both e8 and h7 together.',
          },
        ],
      },
      {
        id: 'rook-basics',
        moduleId: 'beginner-foundations',
        level: 'beginner',
        order: 4,
        title: 'Rook Activity and Open Files',
        shortTitle: 'Rook',
        objective: 'Use the rook as your strongest attacking and finishing piece.',
        conceptExplanation: 'The rook, or Rua, moves any number of squares along ranks and files. In Makruk it is usually the most powerful practical piece, especially once a file opens or the king gets exposed.',
        summary: 'Rooks love open files. If a file clears, look at it immediately.',
        estimatedMinutes: 4,
        concepts: ['movement', 'coordination', 'opening'],
        puzzleConcepts: ['opening', 'mate'],
        example: scene(realisticOpenFileBoard, 'white', {
          highlights: [
            highlight('d2', 'rgba(79, 195, 247, 0.32)'),
            highlight('d3', 'rgba(129, 196, 84, 0.18)'),
            highlight('d4', 'rgba(129, 196, 84, 0.18)'),
            highlight('d5', 'rgba(129, 196, 84, 0.18)'),
            highlight('d6', 'rgba(129, 196, 84, 0.18)'),
            highlight('d7', 'rgba(129, 196, 84, 0.18)'),
            highlight('d8', 'rgba(255, 213, 79, 0.34)'),
            highlight('e6', 'rgba(79, 195, 247, 0.24)'),
            highlight('f7', 'rgba(79, 195, 247, 0.24)'),
          ],
          arrows: [arrow('d2', 'd8', '#81c784')],
        }),
        guidedSteps: [
          {
            id: 'rook-lines',
            title: 'First make the file open',
            instruction: 'The d-file is strong here because the central d-pawns are gone. Nothing blocks the rook from d2 all the way to the back rank.',
            coachTip: 'When a central file clears, look at it before you look anywhere else.',
            scene: scene(realisticOpenFileBoard, 'white', {
              highlights: [
                highlight('d2', 'rgba(79, 195, 247, 0.3)'),
                highlight('d3', 'rgba(129, 196, 84, 0.18)'),
                highlight('d4', 'rgba(129, 196, 84, 0.18)'),
                highlight('d5', 'rgba(129, 196, 84, 0.18)'),
                highlight('d6', 'rgba(129, 196, 84, 0.18)'),
                highlight('d7', 'rgba(129, 196, 84, 0.18)'),
                highlight('d8', 'rgba(255, 213, 79, 0.28)'),
              ],
              arrows: [arrow('d2', 'd8', '#81c784')],
            }),
          },
          {
            id: 'rook-open-file',
            title: 'Open files are invitations',
            instruction: 'Now the lesson becomes concrete: the rook can invade on d8, check the king, and land on a square protected by the knight on f7 and the Khon on e6.',
            coachTip: 'An open file is best when the rook can invade with a real threat, not just grab a pawn.',
            scene: scene(realisticOpenFileBoard, 'white', {
              arrows: [arrow('d2', 'd8', '#81c784')],
              highlights: [
                highlight('d2', 'rgba(129, 196, 84, 0.35)'),
                highlight('d8', 'rgba(255, 213, 79, 0.38)'),
                highlight('e6', 'rgba(79, 195, 247, 0.24)'),
                highlight('f7', 'rgba(79, 195, 247, 0.24)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'rook-file-task',
            prompt: 'Use the open d-file to invade on d8 and check the king.',
            coachTip: 'The best rook move is the one that hits the king or the back rank with force.',
            scene: scene(realisticOpenFileBoard, 'white'),
            expectedMove: move('d2', 'd8'),
            candidateMoves: [
              candidateMove('d2', 'd8', 'correct', 'Rd8 invades the back rank with check. The open file becomes a real threat, not just activity for show.'),
              candidateMove('d2', 'd7', 'tempting', 'Rd7 looks active, but it does not check the king. On an open file, the best rook move is usually the one that invades with force.'),
            ],
            teaching: teaching(
              'The open file is available, but White still needs to use it with force.',
              'Rd8 turns the open file into a direct invasion instead of a slow improvement.',
              'The rook checks the king immediately and takes over the back rank.',
              'The rook reaches the back rank in one move.',
              'Black is in check as soon as the rook lands on d8.',
            ),
            successMessage: 'Good. The rook used the open file to invade with a real threat.',
            wrongMoveMessage: 'Use the rook on d2 and invade the back rank on d8.',
          },
        ],
      },
      {
        id: 'khon-basics',
        moduleId: 'beginner-foundations',
        level: 'beginner',
        order: 5,
        title: 'Khon Diagonal Control',
        shortTitle: 'Khon',
        objective: 'Understand the Khon as a careful piece that controls diagonals and one forward square.',
        conceptExplanation: 'The Khon moves one square diagonally or one square straight forward. It is not a long-range bishop. Its strength comes from controlling nearby squares and helping other pieces close space around the enemy king.',
        summary: 'Think of the Khon as a close-range coordinator. It wins by placement, not by speed.',
        estimatedMinutes: 4,
        concepts: ['movement', 'coordination'],
        puzzleConcepts: ['mate', 'coordination'],
        example: scene(khonPressureBoard, 'white', {
          highlights: [
            highlight('c5', 'rgba(129, 196, 84, 0.25)'),
            highlight('e5', 'rgba(129, 196, 84, 0.25)'),
            highlight('c3', 'rgba(129, 196, 84, 0.25)'),
            highlight('e3', 'rgba(129, 196, 84, 0.25)'),
            highlight('d5', 'rgba(79, 195, 247, 0.25)'),
            highlight('e6', 'rgba(255, 213, 79, 0.3)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'khon-nearby-control',
            title: 'Nearby squares matter',
            instruction: 'The Khon controls the diagonals around it and also one forward square.',
            coachTip: 'That forward move is why the Khon often helps fence off king escapes.',
            scene: scene(khonPressureBoard, 'white', {
              highlights: [
                highlight('c5', 'rgba(129, 196, 84, 0.25)'),
                highlight('e5', 'rgba(129, 196, 84, 0.25)'),
                highlight('c3', 'rgba(129, 196, 84, 0.25)'),
                highlight('e3', 'rgba(129, 196, 84, 0.25)'),
                highlight('d5', 'rgba(79, 195, 247, 0.25)'),
              ],
            }),
          },
          {
            id: 'khon-placement',
            title: 'Good Khons sit near the fight',
            instruction: 'A well-placed Khon does more than sit nicely. From e5 it starts to pressure e6 and helps your other pieces move with confidence.',
            coachTip: 'Do not leave the Khon sleeping on the back rank if the center is open.',
            scene: scene(khonPressureBoard, 'white', {
              highlights: [
                highlight('e5', 'rgba(129, 196, 84, 0.3)'),
                highlight('e6', 'rgba(255, 213, 79, 0.35)'),
              ],
              arrows: [arrow('d4', 'e5', '#81c784')],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'khon-diagonal-task',
            prompt: 'Improve the Khon to e5 so it starts attacking the pawn on e6.',
            coachTip: 'A good Khon move should touch something useful, not just change squares.',
            scene: scene(khonPressureBoard, 'white'),
            expectedMove: move('d4', 'e5'),
            candidateMoves: [
              candidateMove('d4', 'e5', 'correct', 'Se5 improves the Khon and starts pressuring the pawn on e6. The move creates immediate pressure.'),
              candidateMove('d4', 'd5', 'tempting', 'Sd5 is legal, but it does not hit the target on e6. e5 is better because it gives the move a concrete purpose.'),
            ],
            teaching: teaching(
              'The Khon is close to the fight but not yet touching a real target.',
              'Se5 puts the Khon on a square where its short-range control matters right away.',
              'From e5 the Khon starts pressuring e6 and helps future central play.',
              'The Khon begins attacking the pawn on e6 immediately.',
              'White’s piece activity becomes visible without waiting for a long sequence.',
            ),
            successMessage: 'Good. The Khon improved and created pressure at once.',
            wrongMoveMessage: 'Use the Khon move to e5. That is the square that starts pressuring e6.',
          },
        ],
      },
      {
        id: 'met-basics',
        moduleId: 'beginner-foundations',
        level: 'beginner',
        order: 6,
        title: 'Met Role and Limits',
        shortTitle: 'Met',
        objective: 'Use the Met well without treating it like a western queen.',
        conceptExplanation: 'The Met moves one square diagonally. In traditional descriptions it is a small court piece, not a western queen. It is useful, but much weaker than a western queen, so you usually should not expect it to attack alone. In Makruk it works best when it supports a rook, king, or Khon.',
        summary: 'The Met is a helper, not a superhero. Coordinate it with stronger pieces.',
        estimatedMinutes: 4,
        concepts: ['movement', 'coordination', 'piece-values'],
        puzzleConcepts: ['promotion', 'coordination'],
        example: scene(realisticMetSupportBoard, 'white', {
          highlights: [
            highlight('e5', 'rgba(79, 195, 247, 0.3)'),
            highlight('f6', 'rgba(255, 213, 79, 0.32)'),
            highlight('g5', 'rgba(129, 196, 84, 0.2)'),
            highlight('h5', 'rgba(79, 195, 247, 0.2)'),
          ],
          arrows: [arrow('e5', 'f6', '#81c784')],
        }),
        guidedSteps: [
          {
            id: 'met-short-range',
            title: 'Short range only',
            instruction: 'The Met only moves one square diagonally. That makes its role much more modest than a chess queen.',
            coachTip: 'If you overextend the Met, it often gets traded or trapped for little gain.',
            scene: scene(board(
              ['a1', 'K', 'white'],
              ['d4', 'M', 'white'],
              ['h8', 'K', 'black'],
            ), 'white', {
              highlights: [
                highlight('c5', 'rgba(129, 196, 84, 0.25)'),
                highlight('e5', 'rgba(129, 196, 84, 0.25)'),
                highlight('c3', 'rgba(129, 196, 84, 0.25)'),
                highlight('e3', 'rgba(129, 196, 84, 0.25)'),
              ],
            }),
          },
          {
            id: 'met-support',
            title: 'Best when removing a defender',
            instruction: 'A nearby Met often makes a rook attack work because it helps remove a defender. Here Mxf6 takes the knight on f6 and strips away one of Black’s main kingside guards.',
            coachTip: 'The Met is strongest when a bigger piece has already created the target and your move can cleanly remove it.',
            scene: scene(realisticMetSupportBoard, 'white', {
              highlights: [
                highlight('e5', 'rgba(79, 195, 247, 0.25)'),
                highlight('f6', 'rgba(255, 213, 79, 0.35)'),
                highlight('g5', 'rgba(129, 196, 84, 0.2)'),
                highlight('h5', 'rgba(79, 195, 247, 0.2)'),
              ],
              arrows: [arrow('e5', 'f6', '#81c784')],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'met-step-task',
            prompt: 'Use the Met to capture the knight on f6 and clear a defender away from the rook attack.',
            coachTip: 'The best Met move is the one that removes a real defender, not just floats to a nice square.',
            scene: scene(realisticMetSupportBoard, 'white'),
            expectedMove: move('e5', 'f6'),
            candidateMoves: [
              candidateMove('e5', 'f6', 'correct', 'Mxf6 removes the knight that was helping Black defend the kingside. The Met works because it takes a real defender off the board.'),
              candidateMove('e5', 'd6', 'tempting', 'Md6 is active, but it leaves the defender on f6 in place. If the Met can remove a key defender cleanly, that is the stronger move.'),
            ],
            teaching: teaching(
              'The rook attack is promising, but Black still has a defender on f6 holding the kingside together.',
              'Mxf6 uses the Met for a clean supporting job: it removes that defender instead of wandering.',
              'White wins the knight on f6 immediately and leaves the rook attack facing less resistance.',
              'The Met captures a key defender right away.',
              'Black’s kingside has one fewer piece guarding it after the move.',
            ),
            successMessage: 'Exactly. The Met earns its keep here by removing the defender for the rook attack.',
            wrongMoveMessage: 'Use the Met to take the defender on f6. That is the purposeful move here.',
          },
        ],
      },
      {
        id: 'values-captures-and-safety',
        moduleId: 'beginner-foundations',
        level: 'beginner',
        order: 7,
        title: 'Values, Captures, and Safety',
        shortTitle: 'Safety',
        objective: 'Learn simple relative values and stop hanging pieces for free.',
        conceptExplanation: 'You do not need perfect numbers, but relative strength matters. Rua is usually your strongest practical piece, Ma and Khon are valuable helpers, the Met is useful but smaller, and Bia are the smallest units. Before every move, ask what is attacked, what is defended, and what can be taken safely.',
        summary: 'Count attackers, count defenders, and do not leave a piece unsupported. Traditional players call that a loose piece.',
        estimatedMinutes: 5,
        concepts: ['piece-values', 'safety'],
        puzzleConcepts: ['hanging-piece', 'trap'],
        example: scene(board(
          ['a1', 'K', 'white'],
          ['e5', 'N', 'white'],
          ['f7', 'R', 'black'],
          ['h8', 'K', 'black'],
        ), 'white', {
          highlights: [
            highlight('e5', 'rgba(79, 195, 247, 0.35)'),
            highlight('f7', 'rgba(255, 213, 79, 0.35)'),
          ],
          arrows: [arrow('e5', 'f7', '#4fc3f7')],
        }),
        guidedSteps: [
          {
            id: 'values-order',
            title: 'Think in rough values',
            instruction: 'A simple beginner scale is enough: rook highest, knight and Khon next, Met below them, pawn smallest, king priceless.',
            coachTip: 'The exact decimals matter less than the order of importance.',
            scene: scene(board(
              ['a1', 'K', 'white'],
              ['c3', 'P', 'white'],
              ['d4', 'M', 'white'],
              ['e5', 'S', 'white'],
              ['f6', 'N', 'white'],
              ['g7', 'R', 'white'],
              ['h8', 'K', 'black'],
            ), 'white', {
              annotations: [
                annotation('c3', '1', '#8bc34a'),
                annotation('d4', '2', '#90a4ae'),
                annotation('e5', '2.5', '#29b6f6'),
                annotation('f6', '3', '#26c6da'),
                annotation('g7', '5', '#ffca28'),
              ],
            }),
          },
          {
            id: 'safety-check',
            title: 'Look for loose pieces',
            instruction: 'If a stronger piece is hanging and you can take it safely, that is often the right practical move.',
            coachTip: 'Traditional players call an unsupported piece loose or floating. Those are the easiest practical targets.',
            scene: scene(board(
              ['a1', 'K', 'white'],
              ['e5', 'N', 'white'],
              ['f7', 'R', 'black'],
              ['h8', 'K', 'black'],
            ), 'white'),
          },
        ],
        practiceTasks: [
          {
            id: 'safety-capture-task',
            prompt: 'Take the hanging rook with the knight.',
            coachTip: 'Winning a rook for a knight is usually excellent business.',
            scene: scene(board(
              ['a1', 'K', 'white'],
              ['e5', 'N', 'white'],
              ['f7', 'R', 'black'],
              ['h8', 'K', 'black'],
            ), 'white'),
            expectedMove: move('e5', 'f7'),
            candidateMoves: [
              candidateMove('e5', 'f7', 'correct', 'Nf7 wins the loose rook. That is a direct material gain against the biggest target on the board.'),
              candidateMove('e5', 'g6', 'tempting', 'Ng6 looks active, but it only pokes at a pawn. When a rook is hanging, taking it is clearly better.'),
            ],
            teaching: teaching(
              'Black has left a rook loose, and White should punish that immediately.',
              'Nf7 goes straight for the largest unprotected target instead of making a vague active move.',
              'White wins material on the spot and removes a major black piece from the board.',
              'The black rook on f7 is captured immediately.',
              'White turns a simple tactical observation into a clear material gain.',
            ),
            successMessage: 'Good. You noticed the loose high-value target.',
            wrongMoveMessage: 'The clean gain here is to capture the rook on f7.',
          },
        ],
      },
      {
        id: 'check-and-checkmate',
        moduleId: 'beginner-foundations',
        level: 'beginner',
        order: 8,
        title: 'Check, Checkmate, and King Safety',
        shortTitle: 'Checkmate',
        objective: 'Understand what check means and how a simple rook mate works.',
        conceptExplanation: 'Check means the king is attacked and must respond immediately. Checkmate means there is no legal escape. In Makruk, king safety still matters, but many beginner mates are built by a rook plus one supporting piece taking away the escape squares.',
        summary: 'A check is urgent. A mate is a check with no safe answer left.',
        estimatedMinutes: 5,
        concepts: ['safety', 'checkmate'],
        puzzleConcepts: ['mate'],
        example: scene(board(
          ['f6', 'K', 'white'],
          ['d5', 'S', 'white'],
          ['h7', 'R', 'white'],
          ['f8', 'K', 'black'],
        ), 'white', {
          arrows: [arrow('h7', 'h8', '#81c784')],
          highlights: [
            highlight('h8', 'rgba(129, 196, 84, 0.35)'),
            highlight('e8', 'rgba(255, 82, 82, 0.25)'),
            highlight('e7', 'rgba(255, 82, 82, 0.25)'),
            highlight('g7', 'rgba(255, 82, 82, 0.25)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'check-urgent',
            title: 'Check comes first',
            instruction: 'When your king is attacked, you must answer that threat before anything else.',
            coachTip: 'If you remember only one safety rule today, remember this one.',
            scene: scene(board(
              ['d1', 'K', 'white'],
              ['d8', 'R', 'black'],
              ['h8', 'K', 'black'],
            ), 'white', {
              priorityContext: 'check-defense',
              highlights: [
                highlight('d1', 'rgba(255, 82, 82, 0.35)'),
                highlight('d8', 'rgba(255, 213, 79, 0.35)'),
              ],
            }),
          },
          {
            id: 'mate-net',
            title: 'The rook needs help',
            instruction: 'The rook gives the check, but the king and Khon remove the escape squares. That is why the move is mate, not just check.',
            coachTip: 'Mates are usually about coordination, not one heroic piece.',
            scene: scene(board(
              ['f6', 'K', 'white'],
              ['d5', 'S', 'white'],
              ['h7', 'R', 'white'],
              ['f8', 'K', 'black'],
            ), 'white', {
              highlights: [
                highlight('e8', 'rgba(255, 82, 82, 0.25)'),
                highlight('e7', 'rgba(255, 82, 82, 0.25)'),
                highlight('g7', 'rgba(255, 82, 82, 0.25)'),
                highlight('h8', 'rgba(129, 196, 84, 0.35)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'mate-in-one-task',
            prompt: 'Deliver mate in one with the rook.',
            coachTip: 'The finish is simple because the supporting pieces already did the hard work.',
            scene: scene(board(
              ['f6', 'K', 'white'],
              ['d5', 'S', 'white'],
              ['h7', 'R', 'white'],
              ['f8', 'K', 'black'],
            ), 'white'),
            expectedMove: move('h7', 'h8'),
            candidateMoves: [
              candidateMove('h7', 'h8', 'correct', 'Rh8 is mate. It gives check and leaves the black king with no safe reply.'),
              candidateMove('h7', 'g7', 'tempting', 'Rg7 keeps the rook active, but it does not finish the game. When mate is available, that is always the best move.'),
            ],
            teaching: teaching(
              'Black’s king is boxed in, so White should finish the game instead of drifting.',
              'Rh8 uses the rook together with the king and Khon to seal every escape square.',
              'The move is not just check. It is mate, so the game ends immediately.',
              'The rook gives check on h8 right away.',
              'Black has no legal escape after the move.',
            ),
            successMessage: 'Perfect. That is a clean basic Makruk mate.',
            wrongMoveMessage: 'Look for the rook move that gives check and leaves the black king no safe square.',
          },
        ],
      },
    ],
  },
  {
    id: 'intermediate-principles',
    level: 'intermediate',
    order: 2,
    title: 'Intermediate Principles',
    description: 'Move from piece rules into real Makruk ideas: development, coordination, tactics, and discipline.',
    lessons: [
      {
        id: 'opening-principles',
        moduleId: 'intermediate-principles',
        level: 'intermediate',
        order: 9,
        title: 'Opening Principles',
        shortTitle: 'Openings',
        objective: 'Use simple rules for the first phase: center control, development, and king safety.',
        conceptExplanation: 'Makruk openings are less about memorized forcing lines and more about healthy structure. Fight for central squares, bring your minor pieces out, and keep your king from sitting on open lines.',
        summary: 'In the opening, ask for three things: center, development, and safety.',
        estimatedMinutes: 5,
        concepts: ['opening', 'safety'],
        puzzleConcepts: ['opening'],
        example: scene(createInitialBoard(), 'white', {
          highlights: [
            ...centerHighlights,
            highlight('b1', 'rgba(79, 195, 247, 0.2)'),
            highlight('g1', 'rgba(79, 195, 247, 0.2)'),
            highlight('d2', 'rgba(79, 195, 247, 0.25)'),
            highlight('e2', 'rgba(79, 195, 247, 0.25)'),
          ],
          arrows: [
            arrow('b1', 'd2', '#4fc3f7'),
            arrow('g1', 'e2', '#4fc3f7'),
          ],
        }),
        guidedSteps: [
          {
            id: 'opening-center',
            title: 'The center comes first',
            instruction: 'Central space gives your short-range pieces better squares and makes tactical ideas easier to spot.',
            coachTip: 'Because the Met and Khon are short-range pieces, central squares matter even more.',
            scene: scene(createInitialBoard(), 'white', {
              highlights: centerHighlights,
            }),
          },
          {
            id: 'opening-develop',
            title: 'Develop the pieces that need room',
            instruction: 'Knights and Khons should step into useful squares before you start side adventures.',
            coachTip: 'A developed piece can help in the center. An undeveloped piece only watches.',
            scene: scene(createInitialBoard(), 'white', {
              arrows: [arrow('b1', 'd2', '#4fc3f7')],
              highlights: [
                highlight('b1', 'rgba(79, 195, 247, 0.35)'),
                highlight('d2', 'rgba(79, 195, 247, 0.25)'),
                highlight('g1', 'rgba(79, 195, 247, 0.2)'),
                highlight('e2', 'rgba(79, 195, 247, 0.2)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'opening-knight-task',
            prompt: 'Develop the knight from b1 to its natural square.',
            coachTip: 'A quiet developing move is often stronger than a flashy pawn chase.',
            scene: scene(createInitialBoard(), 'white'),
            expectedMove: move('b1', 'd2'),
            candidateMoves: [
              candidateMove('b1', 'd2', 'correct', 'Nd2 develops the b1-knight toward the center and improves coordination right away.'),
              candidateMove('a3', 'a4', 'tempting', 'a4 is legal, but it spends a move on the wing instead of developing or fighting for the center. Nd2 is better because it follows the opening priorities directly.'),
            ],
            teaching: teaching(
              'White still has an undeveloped knight while the central fight is about to begin.',
              'Nd2 brings that knight into the game and points it toward useful central squares.',
              'The knight now helps contest e4 and c4, so White’s opening plan becomes clearer.',
              'The knight leaves the back rank and joins the center fight.',
              'White gains visible control over central squares the knight did not touch before.',
            ),
            successMessage: 'Good. This is healthy opening play.',
            wrongMoveMessage: 'Try the simple developing move from b1 to d2.',
          },
        ],
      },
      {
        id: 'pawn-role-in-the-opening',
        moduleId: 'intermediate-principles',
        level: 'intermediate',
        order: 10,
        title: 'Pawn Role in the Opening',
        shortTitle: 'Opening Pawns',
        objective: 'Use pawns to claim space without creating weak shapes too early.',
        conceptExplanation: 'Opening pawns do two jobs at once: they take space and they decide which squares your pieces can use. A useful pawn move supports the center, opens a line, or limits the opponent. A random pawn move usually creates holes.',
        summary: 'Push pawns with a reason: space, support, or a clear line.',
        estimatedMinutes: 5,
        concepts: ['opening', 'pawn-structure'],
        puzzleConcepts: ['opening'],
        example: scene(createInitialBoard(), 'white', {
          highlights: [
            highlight('d4', 'rgba(129, 196, 84, 0.25)'),
            highlight('e4', 'rgba(129, 196, 84, 0.25)'),
          ],
          arrows: [
            arrow('d3', 'd4', '#81c784'),
            arrow('e3', 'e4', '#81c784'),
          ],
        }),
        guidedSteps: [
          {
            id: 'pawn-support-center',
            title: 'Pawns support the center',
            instruction: 'The best early pawn pushes usually help a central square or open a useful line for a piece.',
            coachTip: 'Makruk rewards restrained pawn play. Do not spend moves on edge pawns without a reason.',
            scene: scene(createInitialBoard(), 'white', {
              highlights: [
                highlight('d4', 'rgba(129, 196, 84, 0.25)'),
                highlight('e4', 'rgba(129, 196, 84, 0.25)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'opening-pawn-task',
            prompt: 'Push the e-pawn one square to gain central space.',
            coachTip: 'This is the kind of pawn move that helps your whole position.',
            scene: scene(createInitialBoard(), 'white', {
              highlights: [
                highlight('e3', 'rgba(129, 196, 84, 0.35)'),
                highlight('e4', 'rgba(129, 196, 84, 0.25)'),
              ],
            }),
            expectedMove: move('e3', 'e4'),
            candidateMoves: [
              candidateMove('e3', 'e4', 'correct', 'e4 gains central space and helps your whole position breathe.'),
              candidateMove('a3', 'a4', 'tempting', 'a4 is legal, but it does not help the center or development. Central pawn moves are more purposeful here.'),
            ],
            teaching: teaching(
              'White needs a pawn move that helps the whole position, not a side move with no target.',
              'e4 puts a pawn into the center where it supports space and future development.',
              'White now claims a key central square and makes future piece play easier to understand.',
              'The e-pawn advances into the center immediately.',
              'White gains visible space where the main opening fight happens.',
            ),
            successMessage: 'Nice. Space first, then piece play.',
            wrongMoveMessage: 'This task is about the useful center push with the e-pawn.',
          },
        ],
      },
      {
        id: 'piece-coordination',
        moduleId: 'intermediate-principles',
        level: 'intermediate',
        order: 11,
        title: 'Piece Coordination',
        shortTitle: 'Coordination',
        objective: 'Make pieces work together instead of attacking one by one.',
        conceptExplanation: 'Makruk is full of short-range pieces, so coordination matters more than lone attacks. Good positions let one piece create the threat while another covers the escape squares or the key defenders.',
        summary: 'Ask not only what a move attacks, but also which friendly piece makes that attack possible.',
        estimatedMinutes: 5,
        concepts: ['coordination', 'checkmate'],
        puzzleConcepts: ['mate', 'coordination'],
        example: scene(realisticCoordinationBoard, 'white', {
          arrows: [arrow('f5', 'e5', '#81c784')],
          highlights: [
            highlight('c7', 'rgba(79, 195, 247, 0.25)'),
            highlight('d6', 'rgba(79, 195, 247, 0.25)'),
            highlight('g6', 'rgba(79, 195, 247, 0.25)'),
            highlight('e5', 'rgba(129, 196, 84, 0.35)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'coordination-support',
            title: 'Support turns a move into a finish',
            instruction: 'The rook is the visible attacker here, but the king, knight, Met, and Khon all make the rook lift work together.',
            coachTip: 'Many strong Makruk moves look simple only because the support was prepared earlier.',
            scene: scene(realisticCoordinationBoard, 'white', {
              highlights: [
                highlight('c7', 'rgba(255, 213, 79, 0.25)'),
                highlight('d6', 'rgba(255, 213, 79, 0.25)'),
                highlight('g6', 'rgba(255, 213, 79, 0.25)'),
                highlight('e5', 'rgba(129, 196, 84, 0.35)'),
                highlight('e8', 'rgba(255, 82, 82, 0.2)'),
              ],
              arrows: [arrow('f5', 'e5', '#81c784')],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'coordination-mate-task',
            prompt: 'Start the coordinated attack with the supported rook lift to e5.',
            coachTip: 'The rook can step in because the other white pieces already cover the important replies.',
            scene: scene(realisticCoordinationBoard, 'white'),
            expectedMove: move('f5', 'e5'),
            candidateMoves: [
              candidateMove('f5', 'e5', 'correct', 'Re5 is the supported attacking move. It improves the rook and starts a direct kingside threat.'),
              candidateMove('f5', 'h5', 'tempting', 'Rh5 looks active on the flank, but it ignores the prepared pressure around e8. Re5 is better because it coordinates with the rest of the attack immediately.'),
            ],
            teaching: teaching(
              'White has attacking pieces, but the rook is not yet on the line where those pieces matter most.',
              'Re5 brings the rook onto the key file where the king, knight, Met, and Khon all support it.',
              'The move checks Black immediately, so the coordination becomes visible at once.',
              'The rook enters the attack on a supported square.',
              'Black is in check the moment the rook reaches e5.',
              'White\'s other pieces now clearly work with the rook instead of attacking alone.',
            ),
            successMessage: 'Exactly. The quiet rook move works because the whole position supports it.',
            wrongMoveMessage: 'Begin with the rook move to e5. That is the coordinated move here.',
          },
        ],
      },
      {
        id: 'knight-forks',
        moduleId: 'intermediate-principles',
        level: 'intermediate',
        order: 12,
        title: 'Knight Forks',
        shortTitle: 'Forks',
        objective: 'Turn L-shape recognition into a real tactical weapon.',
        conceptExplanation: 'A fork attacks two targets at once. Knights are famous for this because they jump into crowded positions and often hit the king plus a rook or other heavy piece.',
        summary: 'Before every knight move, check whether one landing square attacks two targets.',
        estimatedMinutes: 4,
        concepts: ['fork', 'forcing'],
        puzzleConcepts: ['fork'],
        example: scene(board(
          ['a1', 'K', 'white'],
          ['e4', 'N', 'white'],
          ['e8', 'K', 'black'],
          ['h7', 'R', 'black'],
        ), 'white', {
          arrows: [arrow('e4', 'f6', '#4fc3f7')],
          highlights: [
            highlight('f6', 'rgba(79, 195, 247, 0.25)'),
            highlight('e8', 'rgba(255, 213, 79, 0.35)'),
            highlight('h7', 'rgba(255, 213, 79, 0.35)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'fork-forcing',
            title: 'Checks make forks harder to ignore',
            instruction: 'The strongest forks are forcing. If one target is the king, your opponent has fewer choices.',
            coachTip: 'That is why king-plus-rook forks are such clean practical tactics.',
            scene: scene(board(
              ['a1', 'K', 'white'],
              ['e4', 'N', 'white'],
              ['e8', 'K', 'black'],
              ['h7', 'R', 'black'],
            ), 'white', {
              arrows: [arrow('e4', 'f6', '#4fc3f7')],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'fork-repeat-task',
            prompt: 'Find the knight fork again without the extra hints.',
            coachTip: 'This should start feeling automatic now.',
            scene: scene(board(
              ['a1', 'K', 'white'],
              ['e4', 'N', 'white'],
              ['e8', 'K', 'black'],
              ['h7', 'R', 'black'],
            ), 'white'),
            expectedMove: move('e4', 'f6'),
            candidateMoves: [
              candidateMove('e4', 'f6', 'correct', 'Nf6 is the fork that attacks the king and rook together.'),
              candidateMove('e4', 'g5', 'tempting', 'Ng5 is active, but it only attacks one area. The fork is better because it creates two threats at once.'),
            ],
            teaching: teaching(
              'White needs one forcing move, not just another active knight jump.',
              'Nf6 places the knight on the square where it attacks two valuable targets at once.',
              'Black must answer the check while the rook on h7 stays under threat.',
              'The black king is checked immediately.',
              'The rook on h7 becomes a second target on the same move.',
            ),
            successMessage: 'Well found. One jump, two threats.',
            wrongMoveMessage: 'Look for the landing square that checks the king and hits h7.',
          },
        ],
      },
      {
        id: 'pins-traps-and-forcing',
        moduleId: 'intermediate-principles',
        level: 'intermediate',
        order: 13,
        title: 'Pins, Traps, and Forcing Moves',
        shortTitle: 'Pins and Traps',
        objective: 'Recognize the tactical ideas that restrict the opponent before material falls.',
        conceptExplanation: 'Not every strong move is an immediate capture. Some moves pin a piece to the king, trap it with no safe squares, or force the opponent into a narrow set of replies. Makruk tactics often start with that quiet restriction move first.',
        summary: 'If a capture is not ready yet, look for the move that makes the capture unavoidable next.',
        estimatedMinutes: 6,
        concepts: ['pin', 'trap', 'forcing'],
        puzzleConcepts: ['pin', 'trap'],
        example: scene(board(
          ['a1', 'R', 'white'],
          ['c1', 'K', 'white'],
          ['d2', 'M', 'white'],
          ['h1', 'R', 'white'],
          ['e7', 'N', 'black'],
          ['e8', 'K', 'black'],
        ), 'white', {
          arrows: [arrow('h1', 'e1', '#ffb74d')],
          highlights: [
            highlight('e7', 'rgba(255, 213, 79, 0.35)'),
            highlight('e8', 'rgba(255, 82, 82, 0.25)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'pin-first',
            title: 'Pin before you win',
            instruction: 'A pinned piece is frozen because moving it would expose something more important behind it.',
            coachTip: 'The most useful pins are practical ones, where the follow-up win is easy to convert.',
            scene: scene(board(
              ['a1', 'R', 'white'],
              ['c1', 'K', 'white'],
              ['d2', 'M', 'white'],
              ['h1', 'R', 'white'],
              ['e7', 'N', 'black'],
              ['e8', 'K', 'black'],
            ), 'white', {
              arrows: [arrow('h1', 'e1', '#ffb74d')],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'pin-task',
            prompt: 'Start the pin by sliding the rook to e1.',
            coachTip: 'The first move does not win material yet. It makes the win inevitable.',
            scene: scene(board(
              ['a1', 'R', 'white'],
              ['c1', 'K', 'white'],
              ['d2', 'M', 'white'],
              ['h1', 'R', 'white'],
              ['e7', 'N', 'black'],
              ['e8', 'K', 'black'],
            ), 'white'),
            expectedMove: move('h1', 'e1'),
            candidateMoves: [
              candidateMove('h1', 'e1', 'correct', 'Re1 pins the knight to the king and creates a serious follow-up threat.'),
              candidateMove('h1', 'h6', 'tempting', 'Rh6 looks aggressive, but it does not restrict the knight. The pin is better because it changes the position immediately.'),
            ],
            teaching: teaching(
              'White cannot win the knight yet because it still moves freely.',
              'Re1 pins the knight to the king and changes the position immediately.',
              'The knight is now restricted, so the follow-up attack becomes much easier to understand.',
              'The knight on e7 is pinned in place.',
              'White creates a forcing problem before trying to win material.',
            ),
            successMessage: 'Good. The knight is pinned and under real pressure.',
            wrongMoveMessage: 'Start with the quiet rook move to e1. That is the whole lesson here.',
          },
          {
            id: 'trap-task',
            prompt: 'Now practice a trap: move the Khon to b2 to box in the knight.',
            coachTip: 'The strongest move is often the one that shuts the door.',
            scene: scene(board(
              ['a1', 'N', 'black'],
              ['c1', 'S', 'white'],
              ['d1', 'K', 'white'],
              ['e1', 'M', 'white'],
              ['e8', 'K', 'black'],
            ), 'white', {
              arrows: [arrow('c1', 'b2', '#ffb74d')],
            }),
            expectedMove: move('c1', 'b2'),
            candidateMoves: [
              candidateMove('c1', 'b2', 'correct', 'Sb2 traps the knight by closing one of its useful exits.'),
              candidateMove('c1', 'd2', 'tempting', 'Sd2 is a normal move, but it does not box the knight in. The trapping move is more purposeful.'),
            ],
            teaching: teaching(
              'The knight still has room unless White closes the escape route first.',
              'Sb2 puts the Khon on the square that shuts one of those exits.',
              'The knight becomes visibly easier to trap because its space shrinks immediately.',
              'The Khon move closes a door instead of chasing the knight blindly.',
              'Black has fewer useful knight escapes after the move.',
            ),
            successMessage: 'Exactly. You trapped first and only capture later.',
            wrongMoveMessage: 'The quiet trapping move is Khon to b2.',
          },
        ],
      },
      {
        id: 'common-mistakes',
        moduleId: 'intermediate-principles',
        level: 'intermediate',
        order: 14,
        title: 'Common Beginner Mistakes',
        shortTitle: 'Mistakes',
        objective: 'Spot the habits that cause most early losses.',
        conceptExplanation: 'Most beginner errors in Makruk are not deep tactical blunders. They are practical mistakes: ignoring check, pushing wing pawns without purpose, leaving a rook loose, or trying to attack with one piece while the rest of the army stays asleep.',
        summary: 'If the move ignores king safety, leaves a piece hanging, or delays development for no reason, be suspicious.',
        estimatedMinutes: 5,
        concepts: ['common-mistakes', 'safety', 'opening'],
        puzzleConcepts: ['opening', 'mate'],
        example: scene(realisticEarlyMistakesBoard, 'white', {
          priorityContext: 'check-defense',
          highlights: [
            highlight('d1', 'rgba(255, 82, 82, 0.35)'),
            highlight('d8', 'rgba(255, 213, 79, 0.25)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'mistake-urgency',
            title: 'Do not ignore urgent threats',
            instruction: 'When your king is in check, nothing else matters until you fix it.',
            coachTip: 'Many losses come from thinking about your own idea before answering the opponent’s threat.',
            scene: scene(realisticEarlyMistakesBoard, 'white', {
              priorityContext: 'check-defense',
              highlights: [
                highlight('d1', 'rgba(255, 82, 82, 0.35)'),
                highlight('d8', 'rgba(255, 213, 79, 0.3)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'mistake-king-task',
            prompt: 'Step out of check with the king.',
            coachTip: 'Disciplined defense is part of good strategy, not a separate skill.',
            scene: scene(realisticEarlyMistakesBoard, 'white', {
              priorityContext: 'check-defense',
              arrows: [arrow('d1', 'e2', '#ef5350')],
            }),
            expectedMove: move('d1', 'e2'),
            candidateMoves: [
              candidateMove('d1', 'e2', 'correct', 'Ke2 gets out of check cleanly and solves the urgent problem.'),
              candidateMove('e1', 'd2', 'tempting', 'Md2 tries to block, but the lesson is about making the direct king-safety move first.'),
            ],
            teaching: teaching(
              'White is in check, so every other idea is secondary.',
              'Ke2 removes the king from the attack immediately.',
              'Once the check is gone, White can return to normal play.',
              'The check disappears as soon as the king reaches e2.',
              'White stops the urgent threat instead of pretending it is not there.',
            ),
            successMessage: 'Good. First solve the urgent problem, then think bigger.',
            wrongMoveMessage: 'You must answer the check. Move the king to safety.',
          },
        ],
      },
    ],
  },
  {
    id: 'advanced-strategy',
    level: 'advanced',
    order: 3,
    title: 'Advanced Strategy',
    description: 'Turn sound piece play into long-term plans, better structures, and cleaner endgames.',
    lessons: [
      {
        id: 'positional-play',
        moduleId: 'advanced-strategy',
        level: 'advanced',
        order: 15,
        title: 'Positional Play and Good Squares',
        shortTitle: 'Positional Play',
        objective: 'Improve pieces toward stable, useful squares instead of chasing short-term threats.',
        conceptExplanation: 'Positional play in Makruk is often about activity and placement. A piece on a strong square can control key files, support tactics later, and limit the opponent without any immediate fireworks.',
        summary: 'A better square today often becomes the tactic tomorrow.',
        estimatedMinutes: 5,
        concepts: ['positional-play', 'planning'],
        puzzleConcepts: ['fork', 'opening'],
        example: scene(realisticPositionalBoard, 'white', {
          arrows: [arrow('f4', 'd5', '#4fc3f7')],
          highlights: [
            highlight('d5', 'rgba(79, 195, 247, 0.25)'),
            highlight('c4', 'rgba(129, 196, 84, 0.25)'),
            highlight('e4', 'rgba(129, 196, 84, 0.25)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'outpost-idea',
            title: 'Look for stable squares',
            instruction: 'A strong square is one your piece can use while being hard for the opponent to challenge.',
            coachTip: 'Knights become much stronger when they reach an outpost near the center.',
            scene: scene(realisticPositionalBoard, 'white', {
              arrows: [arrow('f4', 'd5', '#4fc3f7')],
              highlights: [
                highlight('d5', 'rgba(79, 195, 247, 0.25)'),
                highlight('c4', 'rgba(129, 196, 84, 0.25)'),
                highlight('e4', 'rgba(129, 196, 84, 0.25)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'outpost-task',
            prompt: 'Move the knight to the stronger square on d5.',
            coachTip: 'No tactic yet. Just a better square and a better future.',
            scene: scene(realisticPositionalBoard, 'white'),
            expectedMove: move('f4', 'd5'),
            candidateMoves: [
              candidateMove('f4', 'd5', 'correct', 'Nd5 reaches the stable outpost the whole position is pointing toward.'),
              candidateMove('f4', 'g6', 'tempting', 'Ng6 is active, but it does not claim the strong central square. d5 is better because it improves the knight long term.'),
            ],
            teaching: teaching(
              'The knight is active, but it has not yet reached the strongest stable square.',
              'Nd5 brings the knight to the outpost supported by White\'s pawns.',
              'From d5 the knight becomes harder to chase and controls more useful squares.',
              'The knight lands on a central square supported by White.',
              'Black cannot challenge that square with a pawn immediately.',
            ),
            successMessage: 'Good. That is positional improvement in one move.',
            wrongMoveMessage: 'Choose the central outpost square on d5.',
          },
        ],
      },
      {
        id: 'pawn-structure',
        moduleId: 'advanced-strategy',
        level: 'advanced',
        order: 16,
        title: 'Pawn Structure',
        shortTitle: 'Structure',
        objective: 'Read pawn chains and use them to guide your plan.',
        conceptExplanation: 'Pawn structure tells you where the game wants to happen. A chain points toward space, weak pawns reveal targets, and fixed pawns often create the files your rooks will later use.',
        summary: 'Your pawn structure is a map. Follow what it says about space, weakness, and direction.',
        estimatedMinutes: 5,
        concepts: ['pawn-structure', 'planning'],
        puzzleConcepts: ['opening', 'endgame'],
        example: scene(pawnStructureBoard, 'white', {
          arrows: [arrow('d4', 'd5', '#81c784')],
          highlights: [
            highlight('c4', 'rgba(129, 196, 84, 0.25)'),
            highlight('d4', 'rgba(129, 196, 84, 0.35)'),
            highlight('d5', 'rgba(129, 196, 84, 0.25)'),
            highlight('e6', 'rgba(255, 213, 79, 0.28)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'structure-chain',
            title: 'Pawn chains point the way',
            instruction: 'Your pawns show where you already have support. That usually tells you where your pieces should play too.',
            coachTip: 'A pawn move can be strategic even when it wins nothing immediately.',
            scene: scene(pawnStructureBoard, 'white'),
          },
        ],
        practiceTasks: [
          {
            id: 'structure-space-task',
            prompt: 'Advance the d-pawn to strengthen your chain and gain space.',
            coachTip: 'This is a structure move first, and only later a tactical one.',
            scene: scene(pawnStructureBoard, 'white'),
            expectedMove: move('d4', 'd5'),
            candidateMoves: [
              candidateMove('d4', 'd5', 'correct', 'd5 extends the chain and gains space where your structure already has support while attacking the loose rook on e6.'),
              candidateMove('c4', 'c5', 'tempting', 'c5 also advances, but it does not strengthen the main chain as directly as d5.'),
            ],
            teaching: teaching(
              'White can gain space, but the best push should also point at something concrete.',
              'd5 extends the pawn chain where another white pawn already backs it up.',
              'After the push, White starts pressuring the loose rook on e6 as well as gaining space.',
              'The pawn chain stretches farther into the center.',
              'White\'s d-pawn begins attacking the black rook on e6 immediately.',
            ),
            successMessage: 'Good. Your pawns now claim more space together.',
            wrongMoveMessage: 'Use the d-pawn to extend the chain forward.',
          },
        ],
      },
      {
        id: 'expand-advantage-with-khon',
        moduleId: 'advanced-strategy',
        level: 'advanced',
        order: 17,
        title: 'ขยายความได้เปรียบด้วยโคน',
        shortTitle: 'โคนเพิ่มแรงกด',
        objective: 'เมื่อได้เปรียบนิดเดียว ให้เพิ่มแรงกดใส่สองจุดพร้อมกันก่อน ไม่ใช่รีบเปิดเกม',
        conceptExplanation: 'แนวคิดจากต้นทางคือ เมื่อขาวมีจังหวะเล่นที่สบายกว่านิดหนึ่ง ตาที่ดีไม่จำเป็นต้องเป็นตาหักทันที แต่ควรเป็นตาที่ทำให้ดำอึดอัดขึ้นก่อน ในรูปนี้เรือขาวที่ จ5 กดโคนดำ ฉ5 อยู่แล้ว พอขาวเดินโคน ง3-จ4 ก็จะกดทั้งม้า ง5 และเพิ่มตัวช่วยใส่โคน ฉ5 พร้อมกัน จึงเป็นการขยายความได้เปรียบแบบหมากรุกไทยแท้ ๆ',
        summary: 'ถ้าได้เปรียบยังไม่ขาด ให้หาตาที่เพิ่มแรงกดหลายจุดพร้อมกันก่อน',
        estimatedMinutes: 5,
        concepts: ['planning', 'positional-play', 'coordination'],
        puzzleConcepts: ['coordination', 'opening'],
        example: scene(sourceKhonExpansionBoard, 'white', {
          arrows: [arrow('d3', 'e4', '#4fc3f7')],
          highlights: [
            highlight('e4', 'rgba(79, 195, 247, 0.25)'),
            highlight('d5', 'rgba(255, 213, 79, 0.28)'),
            highlight('f5', 'rgba(255, 213, 79, 0.28)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'khon-pressure-first',
            title: 'เพิ่มแรงกดก่อนเร่งเกม',
            instruction: 'ขาวยังไม่ต้องรีบแตกหัก เพราะเรือ จ5 กดโคน ฉ5 อยู่แล้ว และโคนที่ ง3 มีตาไป จ4 เพื่อเพิ่มแรงกดอีกชั้นหนึ่ง',
            coachTip: 'ต้นฉบับพูดถึงการขยายความได้เปรียบ ไม่ใช่การรีบรุก ตานี้จึงเด่นเพราะทำให้ดำต้องรับแรงกดหลายด้านพร้อมกัน',
            scene: scene(sourceKhonExpansionBoard, 'white', {
              arrows: [arrow('d3', 'e4', '#4fc3f7')],
              highlights: [
                highlight('e4', 'rgba(79, 195, 247, 0.25)'),
                highlight('d5', 'rgba(255, 213, 79, 0.28)'),
                highlight('f5', 'rgba(255, 213, 79, 0.28)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'khon-expansion-task',
            prompt: 'เดินโคนจาก ง3 ไป จ4 เพื่อเพิ่มแรงกดใส่ม้าและโคนดำพร้อมกัน',
            coachTip: 'บทนี้ไม่ได้ถามหาตารุกแรงที่สุด แต่ถามหาตาที่ทำให้ดำเดินลำบากขึ้นทันที โดยมีเรือ จ5 ช่วยกดอยู่แล้ว',
            scene: scene(sourceKhonExpansionBoard, 'white'),
            expectedMove: move('d3', 'e4'),
            candidateMoves: [
              candidateMove('d3', 'e4', 'correct', 'โคนไป จ4 แล้วแตะทั้งม้า ง5 และโคน ฉ5 พร้อมกัน อีกทั้งยังช่วยเรือ จ5 กดโคน ฉ5 ให้หนักขึ้น'),
              candidateMove('g1', 'h2', 'tempting', 'ขยับขุนปลอดภัยดี แต่ไม่ได้เพิ่มแรงกดต่อม้า ง5 และโคน ฉ5 ในทันที'),
            ],
            teaching: teaching(
              'ขาวมีจังหวะเล่นที่สบายกว่านิดหนึ่ง แต่ถ้าไม่เพิ่มแรงกด ดำก็ยังมีเวลาจัดรูปได้',
              'โคน ง3-จ4 เอาหมากระยะสั้นเข้าจุดที่ทำงานจริงทันที และไปประสานกับเรือ จ5',
              'จาก จ4 โคนขาวแตะทั้งม้า ง5 และโคน ฉ5 ทำให้ดำต้องรับมือมากกว่าหนึ่งจุดในตาเดียว',
              'เรือขาวที่ จ5 กับโคนที่ จ4 เริ่มกดโคนดำ ฉ5 ร่วมกัน',
              'ม้าดำ ง5 กลายเป็นเป้ากดดันในทันที',
              'โคนดำ ฉ5 ต้องระวังมากขึ้น เพราะไม่ได้ถูกเรือกดอยู่ตัวเดียวอีกแล้ว',
            ),
            successMessage: 'ถูกต้อง ตานี้ขยายความได้เปรียบของขาวให้เป็นแรงกดจริงโดยไม่ต้องรีบแตกหัก',
            wrongMoveMessage: 'มองหาตาที่ทำให้ดำต้องห่วงสองจุดพร้อมกัน คือ โคน ง3-จ4',
          },
        ],
      },
      {
        id: 'knight-clamps-met-escape',
        moduleId: 'advanced-strategy',
        level: 'advanced',
        order: 18,
        title: 'ม้า ง2-ค4 จี้เม็ดและปิด ก5',
        shortTitle: 'ม้ากดเม็ด',
        objective: 'มองหาตาม้าที่ทำสองงานพร้อมกัน คือจี้เม็ดและตัดช่องหนี',
        conceptExplanation: 'เม็ดดำที่ ข6 ยังไม่ตายทันทีถ้าขาวเดินช้า เพราะมันยังคิดเรื่องถอยไป ก5 ได้ ตาที่แรงจริงจึงไม่ใช่ตาปรับหมากธรรมดา แต่เป็น ม้า ง2-ค4 ซึ่งทั้งจี้เม็ด ข6 และคุม ก5 ในตาเดียว ทำให้แรงกดของขาวอยู่ต่อเนื่อง',
        summary: 'ตาม้าที่ดีในหมากรุกไทยมักทำสองงานพร้อมกัน ทั้งกดตัวสำคัญและลดทางหนี',
        estimatedMinutes: 5,
        concepts: ['planning', 'coordination', 'positional-play'],
        puzzleConcepts: ['fork', 'coordination'],
        example: scene(sourceKnightClampBoard, 'white', {
          arrows: [arrow('d2', 'c4', '#81c784')],
          highlights: [
            highlight('c4', 'rgba(129, 196, 84, 0.25)'),
            highlight('b6', 'rgba(255, 213, 79, 0.28)'),
            highlight('a5', 'rgba(255, 213, 79, 0.22)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'knight-two-jobs',
            title: 'ตาม้าที่ดีต้องทำสองงาน',
            instruction: 'ถ้าม้าไปช่องที่แค่คุมทางหนี แต่ยังไม่กดเม็ด ก็ยังไม่คมพอ ตาที่ต้องเห็นคือช่องที่ทำสองอย่างพร้อมกัน',
            coachTip: 'อย่ามองม้าแค่เป็นตัวกระโดด ให้มองว่าหลังลงแล้วมันเปลี่ยนเงื่อนไขของกระดานอย่างไร',
            scene: scene(sourceKnightClampBoard, 'white', {
              arrows: [arrow('d2', 'c4', '#81c784')],
              highlights: [
                highlight('c4', 'rgba(129, 196, 84, 0.25)'),
                highlight('b6', 'rgba(255, 213, 79, 0.28)'),
                highlight('a5', 'rgba(255, 213, 79, 0.22)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'knight-clamp-task',
            prompt: 'กระโดดม้าไปช่องที่ทั้งจี้เม็ด ข6 และคุม ก5',
            coachTip: 'ถ้าตานั้นทำได้แค่อย่างเดียว ยังไม่ใช่คำตอบของบทนี้',
            scene: scene(sourceKnightClampBoard, 'white'),
            expectedMove: move('d2', 'c4'),
            candidateMoves: [
              candidateMove('d2', 'c4', 'correct', 'ม้าไป ค4 แล้วโจมตีเม็ด ข6 พร้อมกับคุม ก5 ขาวจึงเก็บแรงกดไว้ได้'),
              candidateMove('d2', 'b3', 'tempting', 'ม้าไป ข3 ช่วยคุม ก5 ได้ แต่ยังไม่จี้เม็ด ข6 โดยตรง จึงทำได้ไม่ครบสองงาน'),
            ],
            teaching: teaching(
              'ขาวมีแรงกดต่อเม็ดดำอยู่แล้ว แต่ถ้าไม่ตัดช่องหนีด้วย เม็ดอาจคลายตัวได้',
              'ม้า ง2-ค4 วางม้าไว้ในช่องที่โจมตีเม็ด ข6 และปิด ก5 พร้อมกัน',
              'ดำต้องคิดเรื่องเม็ดและทางหนีในเวลาเดียวกัน ทำให้รูปดำแคบลงทันที',
              'ม้าขาวจาก ค4 จี้เม็ดดำ ข6 โดยตรง',
              'ช่อง ก5 ถูกม้าคุมไว้ เม็ดจึงถอยตัวลื่น ๆ ไม่ได้',
              'แรงกดของขาวเปลี่ยนจากชั่วคราวเป็นแรงกดต่อเนื่อง',
            ),
            successMessage: 'ใช่เลย ม้า ค4 เป็นตาที่ทำสองงานพร้อมกันตามแนวคิดของรูปนี้',
            wrongMoveMessage: 'มองหาตาม้าที่ทั้งแตะเม็ด ข6 และปิด ก5 พร้อมกัน คือ ง2-ค4',
          },
        ],
      },
      {
        id: 'endgame-fundamentals',
        moduleId: 'advanced-strategy',
        level: 'advanced',
        order: 19,
        title: 'Endgame Fundamentals',
        shortTitle: 'Endgames',
        objective: 'Activate the king, convert promotion carefully, and understand the traditional counting rule.',
        conceptExplanation: 'Makruk endgames are technical because activity alone is not enough. The king must step toward the fight, promotion only creates a Met, and some endings are judged by counting. In the counted Rua-versus-bare-Khun scene shown later in this lesson, White starts at count 3 and only has 16 counted moves to finish. If White delays, the position that looks winning by material becomes a draw by rule.',
        summary: 'In Makruk endgames, improve the king and pawn play quickly, then ask whether the count still leaves enough moves to prove a win.',
        estimatedMinutes: 6,
        concepts: ['endgame', 'planning', 'safety'],
        puzzleConcepts: ['endgame', 'promotion'],
        example: scene(realisticEndgameBoard, 'white', {
          arrows: [
            arrow('d4', 'e5', '#4fc3f7'),
            arrow('e5', 'e6', '#81c784'),
          ],
          highlights: [
            highlight('e5', 'rgba(79, 195, 247, 0.25)'),
            highlight('e5', 'rgba(255, 213, 79, 0.28)'),
            highlight('e6', 'rgba(129, 196, 84, 0.25)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'endgame-king',
            title: 'The king joins the fight',
            instruction: 'In this scene the unpromoted Bia on e4 is still on the board, so counting has not started yet. That means White should first improve the king and win the loose rook cleanly.',
            coachTip: 'This is one of the biggest mindset shifts for newer players: first ask whether counting is active, then choose the most active king move.',
            scene: scene(realisticEndgameBoard, 'white', {
              arrows: [arrow('d4', 'e5', '#4fc3f7')],
              highlights: [
                highlight('e5', 'rgba(79, 195, 247, 0.25)'),
                highlight('e5', 'rgba(255, 213, 79, 0.28)'),
              ],
            }),
          },
          {
            id: 'endgame-promotion',
            title: 'Promotion is useful, not magical',
            instruction: 'When the pawn reaches e6 it becomes Bia-ngai, not a western queen. In this exact scene that move also removes the last unpromoted Bia, so Sak Mak begins immediately at count 3 with a 64-move limit for White.',
            coachTip: 'Promotion helps, but it also turns the ending into a counted win attempt. If White drifts after promoting, Black can still hold the draw.',
            scene: scene(board(
              ['e4', 'K', 'white'],
              ['e5', 'P', 'white'],
              ['g7', 'K', 'black'],
            ), 'white', {
              arrows: [arrow('e5', 'e6', '#81c784')],
            }),
          },
          {
            id: 'endgame-counting',
            title: 'Know when counting starts',
            instruction: 'In this exact scene, White has a lone Rua against a bare black Khun and there are no unpromoted Bia left. That means Sak Mak starts automatically right now at count 3, and White has a 16-move limit for this one-Rua case.',
            coachTip: 'If White spends those counted moves without mate, the game is drawn. In this codebase the Sak Mak limits are 8 for two Rua, 16 for one Rua, 22 for two Khon, 32 for two Ma, 44 for one Khon, and 64 for the remaining minor-piece cases.',
            scene: scene(countingRuleBoard, 'white', {
              highlights: [
                highlight('c3', 'rgba(79, 195, 247, 0.28)'),
                highlight('d6', 'rgba(129, 196, 84, 0.32)'),
                highlight('h8', 'rgba(255, 82, 82, 0.28)'),
              ],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'endgame-king-task',
            prompt: 'Activate the king by stepping from d4 to e5.',
            coachTip: 'Because the Bia on e4 is still unpromoted, no count is running yet. Start by winning the rook and centralizing the king.',
            scene: scene(realisticEndgameBoard, 'white'),
            expectedMove: move('d4', 'e5'),
            candidateMoves: [
              candidateMove('d4', 'e5', 'correct', 'Ke5 takes a stronger central square and steps closer to helping the pawn advance. Active kings should move toward the critical squares.'),
              candidateMove('d4', 'c4', 'tempting', 'Kc4 is legal, but it moves away from the main action. In endgames, the king should head toward the important squares.'),
            ],
            teaching: teaching(
              'White can win the rook immediately, and counting is still off because the unpromoted Bia on e4 remains.',
              'Ke5 centralizes the king by capturing the loose rook on e5 before any counted phase begins.',
              'White improves the king and removes a major black piece in one move while the ending is still not under Sak Mak pressure.',
              'The king reaches a strong central square immediately.',
              'The black rook on e5 disappears right away.',
            ),
            successMessage: 'Good. Active king play is real endgame technique.',
            wrongMoveMessage: 'The king belongs closer to the center here. Move it to e5.',
          },
          {
            id: 'endgame-promotion-task',
            prompt: 'Now promote the pawn by pushing it to e6.',
            coachTip: 'After e6, White gets a Bia-ngai and Sak Mak starts at count 3 with a 64-move limit. Promote now, then convert without drifting.',
            scene: scene(board(
              ['e4', 'K', 'white'],
              ['e5', 'P', 'white'],
              ['g7', 'K', 'black'],
            ), 'white'),
            expectedMove: move('e5', 'e6'),
            candidateMoves: [
              candidateMove('e5', 'e6', 'correct', 'e6 promotes the pawn, starts Sak Mak at count 3, and gives White the strongest practical winning try.'),
              candidateMove('e4', 'f4', 'tempting', 'Kf4 improves the king a little, but it misses the ready promotion. When promotion is safe, it is the stronger move.'),
            ],
            teaching: teaching(
              'White has one last unpromoted Bia on e5. Promoting it now is the move that improves the position and also defines the counted phase correctly.',
              'e6 promotes the pawn immediately, and that same move starts Sak Mak at count 3 with the 64-move met-like limit.',
              'White is still winning after promotion, but only if White converts before the new count runs out instead of drifting.',
              'The pawn promotes on this move.',
              'Sak Mak begins as soon as the pawn becomes Bia-ngai.',
            ),
            successMessage: 'Exactly. The pawn promotes and your endgame resources improve.',
            wrongMoveMessage: 'Push the pawn to the sixth rank on e6.',
          },
        ],
      },
      {
        id: 'strategic-planning',
        moduleId: 'advanced-strategy',
        level: 'advanced',
        order: 20,
        title: 'Strategic Planning',
        shortTitle: 'Planning',
        objective: 'Turn static features into a practical next move.',
        conceptExplanation: 'A plan in Makruk usually grows from small truths: an open file, a weak pawn, an active king, or a bad piece that needs improvement. Strategic planning is the skill of choosing the move that serves those truths instead of making a random threatening move.',
        summary: 'Build plans from the position itself: improve your worst piece, aim at weakness, and keep your pieces coordinated.',
        estimatedMinutes: 5,
        concepts: ['planning', 'coordination', 'positional-play'],
        puzzleConcepts: ['opening', 'mate'],
        example: scene(board(
          ['a1', 'R', 'white'],
          ['d2', 'K', 'white'],
          ['e3', 'S', 'white'],
          ['d4', 'P', 'white'],
          ['e4', 'P', 'white'],
          ['h8', 'K', 'black'],
        ), 'white', {
          arrows: [arrow('a1', 'd1', '#81c784')],
          highlights: [
            highlight('d1', 'rgba(129, 196, 84, 0.25)'),
            highlight('d4', 'rgba(129, 196, 84, 0.2)'),
            highlight('e4', 'rgba(129, 196, 84, 0.2)'),
          ],
        }),
        guidedSteps: [
          {
            id: 'plan-improve-worst-piece',
            title: 'Start with your worst piece',
            instruction: 'If your rook is inactive while a weakness sits on an open file, a good plan is to bring the rook over and start hitting that weakness.',
            coachTip: 'Simple improvement beats random aggression surprisingly often.',
            scene: scene(strategicPlanningBoard, 'white', {
              highlights: [
                highlight('d1', 'rgba(129, 196, 84, 0.28)'),
                highlight('d6', 'rgba(255, 213, 79, 0.3)'),
              ],
              arrows: [arrow('a1', 'd1', '#81c784')],
            }),
          },
        ],
        practiceTasks: [
          {
            id: 'planning-rook-task',
            prompt: 'Improve the rook by moving it from a1 to d1.',
            coachTip: 'The best plan move is the one that improves a piece and points it at a real weakness.',
            scene: scene(strategicPlanningBoard, 'white'),
            expectedMove: move('a1', 'd1'),
            candidateMoves: [
              candidateMove('a1', 'd1', 'correct', 'Rd1 improves the rook and immediately points it at the weak pawn on d6. The plan becomes visible at once.'),
              candidateMove('e3', 'd4', 'tempting', 'Sd4 centralizes the Khon a little, but it does not attack the weakness on d6 or activate the worst piece. Rd1 is the clearer plan move.'),
            ],
            teaching: teaching(
              'The rook on a1 is doing nothing while Black already has a clear weakness on d6.',
              'Rd1 brings the rook onto the open file where it can finally influence the center.',
              'The rook now attacks d6 and sets up direct pressure on the whole d-file.',
              'The rook leaves the corner and takes over the d-file.',
              'Black\'s pawn on d6 becomes an immediate target.',
              'Your next moves are easier to understand because the plan is now visible on one file.',
            ),
            successMessage: 'Good. Your rook is now part of the plan instead of watching it.',
            wrongMoveMessage: 'Use the rook improvement move to d1.',
          },
        ],
      },
    ],
  },
];

const MODULES: LessonModule[] = MODULE_DRAFTS.map(module => ({
  ...module,
  lessons: module.lessons.map(withRuleContext),
}));

const lessonValidationIssues = validateLessonCatalog(MODULES);
if (lessonValidationIssues.length > 0) {
  throw new Error(`Invalid lesson catalog:\n${lessonValidationIssues.map(issue => `- ${issue.scope}: ${issue.message}`).join('\n')}`);
}

export const LESSON_MODULES = MODULES;
export const MAKRUK_LESSONS = MODULES
  .flatMap(module => module.lessons)
  .sort((left, right) => left.order - right.order);

const LESSON_BY_ID = new Map(MAKRUK_LESSONS.map(lesson => [lesson.id, lesson]));

export function getLessonById(id: string): MakrukLesson | undefined {
  return LESSON_BY_ID.get(id);
}

export function getLessonIndex(id: string): number {
  return MAKRUK_LESSONS.findIndex(lesson => lesson.id === id);
}

export function getNextLessonId(id: string): string | null {
  const index = getLessonIndex(id);
  if (index < 0 || index >= MAKRUK_LESSONS.length - 1) return null;
  return MAKRUK_LESSONS[index + 1]?.id ?? null;
}

export function getPreviousLessonId(id: string): string | null {
  const index = getLessonIndex(id);
  if (index <= 0) return null;
  return MAKRUK_LESSONS[index - 1]?.id ?? null;
}

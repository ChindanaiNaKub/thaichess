import { describe, expect, it } from 'vitest';
import { getLegalMoves, isInCheck, makeMove } from '@shared/engine';
import { evaluatePosition } from '@shared/analysis';
import type { Board, GameState, Piece, PieceColor, Position } from '@shared/types';
import { LESSON_MODULES, MAKRUK_LESSONS, getLessonById, validateLessonCatalog } from '../lib/lessons';
import { isLessonUnlocked } from '../lib/lessonProgress';

function createLessonState(board: Board, turn: PieceColor = 'white'): GameState {
  return {
    board,
    turn,
    moveHistory: [],
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

function sameSquare(left: Position, right: Position): boolean {
  return left.row === right.row && left.col === right.col;
}

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function getAttackSquares(board: Board, from: Position): Position[] {
  const piece = board[from.row][from.col];
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
          if (board[row][col]) break;
        }
      }
      return attacks;
    }
  }
}

function findAttackers(board: Board, target: Position, color: PieceColor): Piece[] {
  const attackers: Piece[] = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      if (getAttackSquares(board, { row, col }).some(pos => sameSquare(pos, target))) {
        attackers.push(piece);
      }
    }
  }

  return attackers;
}

function countAttackedEnemyPieces(board: Board, from: Position): number {
  const piece = board[from.row][from.col];
  if (!piece) return 0;

  return getAttackSquares(board, from)
    .filter(pos => board[pos.row][pos.col]?.color === (piece.color === 'white' ? 'black' : 'white'))
    .length;
}

function centerDistance(pos: Position): number {
  return Math.min(
    Math.abs(pos.row - 3) + Math.abs(pos.col - 3),
    Math.abs(pos.row - 3) + Math.abs(pos.col - 4),
    Math.abs(pos.row - 4) + Math.abs(pos.col - 3),
    Math.abs(pos.row - 4) + Math.abs(pos.col - 4),
  );
}

function nearestEnemyDistance(board: Board, from: Position): number {
  const piece = board[from.row][from.col];
  if (!piece) return Number.POSITIVE_INFINITY;

  let nearest = Number.POSITIVE_INFINITY;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const target = board[row][col];
      if (!target || target.color === piece.color) continue;
      nearest = Math.min(nearest, Math.abs(from.row - row) + Math.abs(from.col - col));
    }
  }

  return nearest;
}

function getAllMovesForColor(board: Board, color: PieceColor): Array<{ from: Position; to: Position }> {
  const moves: Array<{ from: Position; to: Position }> = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;

      for (const to of getLegalMoves(board, { row, col })) {
        moves.push({
          from: { row, col },
          to,
        });
      }
    }
  }

  return moves;
}

function getPracticeTask(lessonId: string, taskId: string) {
  const lesson = getLessonById(lessonId);
  expect(lesson, lessonId).toBeDefined();
  const task = lesson?.practiceTasks.find(entry => entry.id === taskId);
  expect(task, `${lessonId}/${taskId}`).toBeDefined();
  return task!;
}

describe('Makruk lessons curriculum', () => {
  it('ships a three-stage curriculum with ordered lessons', () => {
    expect(LESSON_MODULES.map(module => module.level)).toEqual(['beginner', 'intermediate', 'advanced']);
    expect(MAKRUK_LESSONS).toHaveLength(18);
    expect(MAKRUK_LESSONS.map(lesson => lesson.order)).toEqual(Array.from({ length: 18 }, (_, index) => index + 1));
  });

  it('keeps every lesson scene legal and gives the move to the correct side', () => {
    expect(validateLessonCatalog(LESSON_MODULES)).toEqual([]);
  });

  it('includes the core piece lessons and guided practice structure', () => {
    const requiredLessonIds = [
      'pawn-basics',
      'knight-basics',
      'rook-basics',
      'khon-basics',
      'met-basics',
      'check-and-checkmate',
      'endgame-fundamentals',
    ];

    for (const lessonId of requiredLessonIds) {
      const lesson = getLessonById(lessonId);
      expect(lesson, lessonId).toBeDefined();
      expect(lesson?.guidedSteps.length).toBeGreaterThan(0);
      expect(lesson?.practiceTasks.length).toBeGreaterThan(0);
    }
  });

  it('covers the requested puzzle bridge concepts across the course', () => {
    const puzzleConcepts = new Set(MAKRUK_LESSONS.flatMap(lesson => lesson.puzzleConcepts));
    expect(puzzleConcepts.has('fork')).toBe(true);
    expect(puzzleConcepts.has('pin')).toBe(true);
    expect(puzzleConcepts.has('opening')).toBe(true);
    expect(puzzleConcepts.has('endgame')).toBe(true);
  });

  it('uses legal expected moves for every guided step and practice task', () => {
    for (const lesson of MAKRUK_LESSONS) {
      for (const step of lesson.guidedSteps) {
        if (!step.expectedMove) continue;
        const legalMoves = getLegalMoves(step.scene.board, step.expectedMove.from);
        expect(
          legalMoves.some(move => sameSquare(move, step.expectedMove!.to)),
          `${lesson.id}/${step.id} should use a legal guided move`,
        ).toBe(true);
      }

      for (const task of lesson.practiceTasks) {
        const legalMoves = getLegalMoves(task.scene.board, task.expectedMove.from);
        expect(
          legalMoves.some(move => sameSquare(move, task.expectedMove.to)),
          `${lesson.id}/${task.id} should use a legal practice move`,
        ).toBe(true);

        const nextState = makeMove(createLessonState(task.scene.board), task.expectedMove.from, task.expectedMove.to);
        expect(nextState, `${lesson.id}/${task.id} should produce a valid follow-up position`).not.toBeNull();
      }
    }
  });

  it('gives every practice task a best move and a tempting alternative', () => {
    for (const lesson of MAKRUK_LESSONS) {
      for (const task of lesson.practiceTasks) {
        expect(task.candidateMoves.length, `${lesson.id}/${task.id} should compare at least two moves`).toBeGreaterThanOrEqual(2);

        const correctCandidates = task.candidateMoves.filter(candidate => candidate.verdict === 'correct');
        const temptingCandidates = task.candidateMoves.filter(candidate => candidate.verdict === 'tempting');

        expect(correctCandidates, `${lesson.id}/${task.id} should have exactly one best move`).toHaveLength(1);
        expect(temptingCandidates.length, `${lesson.id}/${task.id} should have at least one tempting alternative`).toBeGreaterThanOrEqual(1);
        expect(
          sameSquare(correctCandidates[0].move.from, task.expectedMove.from)
            && sameSquare(correctCandidates[0].move.to, task.expectedMove.to),
          `${lesson.id}/${task.id} should align its best candidate with expectedMove`,
        ).toBe(true);

        for (const candidate of task.candidateMoves) {
          expect(candidate.explanation.trim().length, `${lesson.id}/${task.id} candidate explanations should not be empty`).toBeGreaterThan(0);

          const legalMoves = getLegalMoves(task.scene.board, candidate.move.from);
          expect(
            legalMoves.some(move => sameSquare(move, candidate.move.to)),
            `${lesson.id}/${task.id} candidate ${candidate.move.from.row},${candidate.move.from.col}->${candidate.move.to.row},${candidate.move.to.col} should be legal`,
          ).toBe(true);

          const nextState = makeMove(
            createLessonState(task.scene.board, task.scene.toMove),
            candidate.move.from,
            candidate.move.to,
          );
          expect(nextState, `${lesson.id}/${task.id} candidate move should create a valid next state`).not.toBeNull();
        }
      }
    }
  });

  it('keeps core teaching moves tactically sensible', () => {
    const rookTask = getLessonById('rook-basics')?.practiceTasks.find(task => task.id === 'rook-file-task');
    expect(rookTask).toBeDefined();
    const rookState = makeMove(
      createLessonState(rookTask!.scene.board),
      rookTask!.expectedMove.from,
      rookTask!.expectedMove.to,
    );
    expect(rookState).not.toBeNull();
    expect(rookState!.isCheck).toBe(true);
    const rookReplies = getAllMovesForColor(rookState!.board, 'black');
    expect(
      rookReplies.some(reply => sameSquare(reply.to, rookTask!.expectedMove.to)),
      'the rook lesson should not be refuted by an immediate capture on d8',
    ).toBe(false);
    const rookBeforeEval = evaluatePosition(rookTask!.scene.board, 'white');
    const rookWorstReplyEval = Math.min(
      ...rookReplies.map((reply) => {
        const replyState = makeMove(rookState!, reply.from, reply.to);
        expect(replyState).not.toBeNull();
        return evaluatePosition(replyState!.board, 'white');
      }),
    );
    expect(rookWorstReplyEval).toBeGreaterThanOrEqual(rookBeforeEval + 8);

    const coordinationTask = getLessonById('piece-coordination')?.practiceTasks.find(task => task.id === 'coordination-mate-task');
    expect(coordinationTask).toBeDefined();
    const coordinationState = makeMove(
      createLessonState(coordinationTask!.scene.board),
      coordinationTask!.expectedMove.from,
      coordinationTask!.expectedMove.to,
    );
    expect(coordinationState).not.toBeNull();
    expect(findAttackers(coordinationState!.board, coordinationTask!.expectedMove.to, 'white').length).toBeGreaterThan(0);

    const positionalTask = getLessonById('positional-play')?.practiceTasks.find(task => task.id === 'outpost-task');
    expect(positionalTask).toBeDefined();
    const positionalState = makeMove(
      createLessonState(positionalTask!.scene.board),
      positionalTask!.expectedMove.from,
      positionalTask!.expectedMove.to,
    );
    expect(positionalState).not.toBeNull();
    const pawnAttackers = findAttackers(positionalState!.board, positionalTask!.expectedMove.to, 'black')
      .filter(piece => piece.type === 'P');
    expect(pawnAttackers).toHaveLength(0);
  });

  it('gives every practice move a concrete gameplay reason', () => {
    const boardTask = getPracticeTask('board-and-battlefield', 'board-first-center-step');
    const boardState = makeMove(createLessonState(boardTask.scene.board), boardTask.expectedMove.from, boardTask.expectedMove.to);
    expect(boardState?.board[3][3]?.type).toBe('P');

    const pawnTask = getPracticeTask('pawn-basics', 'pawn-capture-task');
    expect(pawnTask.scene.board[pawnTask.expectedMove.to.row][pawnTask.expectedMove.to.col]?.type).toBe('R');

    const knightTask = getPracticeTask('knight-basics', 'knight-fork-task');
    const knightState = makeMove(createLessonState(knightTask.scene.board), knightTask.expectedMove.from, knightTask.expectedMove.to);
    expect(findAttackers(knightState!.board, { row: 7, col: 4 }, 'white').some(piece => piece.type === 'N')).toBe(true);
    expect(findAttackers(knightState!.board, { row: 6, col: 7 }, 'white').some(piece => piece.type === 'N')).toBe(true);

    const khonTask = getPracticeTask('khon-basics', 'khon-diagonal-task');
    const khonState = makeMove(createLessonState(khonTask.scene.board), khonTask.expectedMove.from, khonTask.expectedMove.to);
    expect(findAttackers(khonState!.board, { row: 5, col: 5 }, 'white').some(piece => piece.type === 'S')).toBe(true);

    const metTask = getPracticeTask('met-basics', 'met-step-task');
    const metState = makeMove(createLessonState(metTask.scene.board), metTask.expectedMove.from, metTask.expectedMove.to);
    expect(metState?.board[5][5]?.type).toBe('M');
    expect(metState?.board[5][5]?.color).toBe('white');

    const safetyTask = getPracticeTask('values-captures-and-safety', 'safety-capture-task');
    expect(safetyTask.scene.board[safetyTask.expectedMove.to.row][safetyTask.expectedMove.to.col]?.type).toBe('R');

    const mateTask = getPracticeTask('check-and-checkmate', 'mate-in-one-task');
    const mateState = makeMove(createLessonState(mateTask.scene.board), mateTask.expectedMove.from, mateTask.expectedMove.to);
    expect(mateState?.isCheckmate).toBe(true);

    const openingKnightTask = getPracticeTask('opening-principles', 'opening-knight-task');
    const openingKnightState = makeMove(createLessonState(openingKnightTask.scene.board), openingKnightTask.expectedMove.from, openingKnightTask.expectedMove.to);
    expect(findAttackers(openingKnightState!.board, { row: 3, col: 4 }, 'white').some(piece => piece.type === 'N')).toBe(true);

    const openingPawnTask = getPracticeTask('pawn-role-in-the-opening', 'opening-pawn-task');
    const openingPawnState = makeMove(createLessonState(openingPawnTask.scene.board), openingPawnTask.expectedMove.from, openingPawnTask.expectedMove.to);
    expect(openingPawnState?.board[3][4]?.type).toBe('P');

    const coordinationTask = getPracticeTask('piece-coordination', 'coordination-mate-task');
    const coordinationState = makeMove(createLessonState(coordinationTask.scene.board), coordinationTask.expectedMove.from, coordinationTask.expectedMove.to);
    expect(coordinationState?.isCheck).toBe(true);

    const forkRepeatTask = getPracticeTask('knight-forks', 'fork-repeat-task');
    const forkRepeatState = makeMove(createLessonState(forkRepeatTask.scene.board), forkRepeatTask.expectedMove.from, forkRepeatTask.expectedMove.to);
    expect(findAttackers(forkRepeatState!.board, { row: 7, col: 4 }, 'white').some(piece => piece.type === 'N')).toBe(true);
    expect(findAttackers(forkRepeatState!.board, { row: 6, col: 7 }, 'white').some(piece => piece.type === 'N')).toBe(true);

    const pinTask = getPracticeTask('pins-traps-and-forcing', 'pin-task');
    const pinState = makeMove(createLessonState(pinTask.scene.board), pinTask.expectedMove.from, pinTask.expectedMove.to);
    expect(pinState?.board[6][4]?.type).toBe('N');
    expect(pinState?.board[7][4]?.type).toBe('K');
    expect(pinState?.board[0][4]?.type).toBe('R');

    const trapTask = getPracticeTask('pins-traps-and-forcing', 'trap-task');
    const trapState = makeMove(createLessonState(trapTask.scene.board), trapTask.expectedMove.from, trapTask.expectedMove.to);
    expect(findAttackers(trapState!.board, { row: 0, col: 0 }, 'white').some(piece => piece.type === 'S')).toBe(true);

    const mistakesTask = getPracticeTask('common-mistakes', 'mistake-king-task');
    expect(isInCheck(mistakesTask.scene.board, 'white')).toBe(true);
    const mistakesState = makeMove(createLessonState(mistakesTask.scene.board), mistakesTask.expectedMove.from, mistakesTask.expectedMove.to);
    expect(isInCheck(mistakesState!.board, 'white')).toBe(false);

    const outpostTask = getPracticeTask('positional-play', 'outpost-task');
    const outpostState = makeMove(createLessonState(outpostTask.scene.board), outpostTask.expectedMove.from, outpostTask.expectedMove.to);
    const outpostPawnAttackers = findAttackers(outpostState!.board, outpostTask.expectedMove.to, 'black').filter(piece => piece.type === 'P');
    expect(outpostPawnAttackers).toHaveLength(0);

    const structureTask = getPracticeTask('pawn-structure', 'structure-space-task');
    const structureState = makeMove(createLessonState(structureTask.scene.board), structureTask.expectedMove.from, structureTask.expectedMove.to);
    expect(findAttackers(structureState!.board, { row: 4, col: 3 }, 'white').some(piece => piece.type === 'P')).toBe(true);

    const endgameKingTask = getPracticeTask('endgame-fundamentals', 'endgame-king-task');
    const endgameKingState = makeMove(createLessonState(endgameKingTask.scene.board), endgameKingTask.expectedMove.from, endgameKingTask.expectedMove.to);
    expect(endgameKingState?.board[4][4]?.type).toBe('K');
    expect(endgameKingState?.board[3][4]?.type).toBe('P');

    const endgamePromotionTask = getPracticeTask('endgame-fundamentals', 'endgame-promotion-task');
    const endgamePromotionState = makeMove(createLessonState(endgamePromotionTask.scene.board), endgamePromotionTask.expectedMove.from, endgamePromotionTask.expectedMove.to);
    expect(endgamePromotionState?.moveHistory.at(-1)?.promoted).toBe(true);

    const planningTask = getPracticeTask('strategic-planning', 'planning-rook-task');
    const planningState = makeMove(createLessonState(planningTask.scene.board), planningTask.expectedMove.from, planningTask.expectedMove.to);
    expect(planningState?.board[0][3]?.type).toBe('R');
    expect(planningTask.scene.board[5][3]?.type).toBe('P');
  });

  it('keeps lesson solutions sound against the opponent\'s obvious reply', () => {
    for (const lesson of MAKRUK_LESSONS) {
      for (const step of lesson.guidedSteps) {
        if (!step.expectedMove) continue;

        const beforeEval = evaluatePosition(step.scene.board, step.scene.toMove);
        const nextState = makeMove(createLessonState(step.scene.board, step.scene.toMove), step.expectedMove.from, step.expectedMove.to);
        expect(nextState, `${lesson.id}/${step.id} should have a valid follow-up state`).not.toBeNull();

        const replies = getAllMovesForColor(nextState!.board, nextState!.turn);
        if (replies.length === 0) continue;

        const worstReplyEval = Math.min(
          ...replies.map((reply) => {
            const replyState = makeMove(nextState!, reply.from, reply.to);
            expect(replyState, `${lesson.id}/${step.id} reply should be legal`).not.toBeNull();
            return evaluatePosition(replyState!.board, step.scene.toMove);
          }),
        );

        expect(
          worstReplyEval,
          `${lesson.id}/${step.id} should still make sense after the opponent's best immediate reply`,
        ).toBeGreaterThanOrEqual(beforeEval - 20);
      }

      for (const task of lesson.practiceTasks) {
        const beforeEval = evaluatePosition(task.scene.board, task.scene.toMove);
        const nextState = makeMove(createLessonState(task.scene.board, task.scene.toMove), task.expectedMove.from, task.expectedMove.to);
        expect(nextState, `${lesson.id}/${task.id} should have a valid follow-up state`).not.toBeNull();

        const replies = getAllMovesForColor(nextState!.board, nextState!.turn);
        if (replies.length === 0) continue;

        const worstReplyEval = Math.min(
          ...replies.map((reply) => {
            const replyState = makeMove(nextState!, reply.from, reply.to);
            expect(replyState, `${lesson.id}/${task.id} reply should be legal`).not.toBeNull();
            return evaluatePosition(replyState!.board, task.scene.toMove);
          }),
        );

        expect(
          worstReplyEval,
          `${lesson.id}/${task.id} should remain tactically sound after the opponent's best reply`,
        ).toBeGreaterThanOrEqual(beforeEval - 30);
      }
    }
  });

  it('requires the correct practice move to clearly improve the position', () => {
    for (const lesson of MAKRUK_LESSONS) {
      for (const task of lesson.practiceTasks) {
        const perspective = task.scene.toMove;
        const beforeEval = evaluatePosition(task.scene.board, perspective);
        const correctState = makeMove(
          createLessonState(task.scene.board, perspective),
          task.expectedMove.from,
          task.expectedMove.to,
        );

        expect(correctState, `${lesson.id}/${task.id} should have a valid follow-up state`).not.toBeNull();

        const afterEval = evaluatePosition(correctState!.board, perspective);
        const beforeTargets = countAttackedEnemyPieces(task.scene.board, task.expectedMove.from);
        const afterTargets = countAttackedEnemyPieces(correctState!.board, task.expectedMove.to);
        const beforeMobility = getLegalMoves(task.scene.board, task.expectedMove.from).length;
        const afterMobility = getLegalMoves(correctState!.board, task.expectedMove.to).length;
        const beforeCenterDistance = centerDistance(task.expectedMove.from);
        const afterCenterDistance = centerDistance(task.expectedMove.to);
        const beforeEnemyDistance = nearestEnemyDistance(task.scene.board, task.expectedMove.from);
        const afterEnemyDistance = nearestEnemyDistance(correctState!.board, task.expectedMove.to);
        const capturedPiece = task.scene.board[task.expectedMove.to.row][task.expectedMove.to.col];
        const promoted = correctState!.moveHistory.at(-1)?.promoted === true;

        const clearlyImproves =
          afterEval - beforeEval >= 8
          || correctState!.isCheck
          || correctState!.isCheckmate
          || Boolean(capturedPiece)
          || promoted
          || afterTargets > beforeTargets
          || afterMobility > beforeMobility
          || afterCenterDistance < beforeCenterDistance
          || afterEnemyDistance < beforeEnemyDistance;

        expect(
          clearlyImproves,
          `${lesson.id}/${task.id} should improve the position in a clear way, not leave it essentially unchanged`,
        ).toBe(true);

        const temptingCandidates = task.candidateMoves.filter(candidate => candidate.verdict === 'tempting');
        for (const candidate of temptingCandidates) {
          const temptingState = makeMove(
            createLessonState(task.scene.board, perspective),
            candidate.move.from,
            candidate.move.to,
          );
          expect(temptingState, `${lesson.id}/${task.id} tempting move should have a valid follow-up state`).not.toBeNull();
        }
      }
    }
  });
});

describe('lesson unlock order', () => {
  it('unlocks only the first lesson by default and then progresses sequentially', () => {
    expect(isLessonUnlocked('board-and-battlefield', new Set())).toBe(true);
    expect(isLessonUnlocked('pawn-basics', new Set())).toBe(false);
    expect(isLessonUnlocked('pawn-basics', new Set(['board-and-battlefield']))).toBe(true);
    expect(isLessonUnlocked('opening-principles', new Set(['board-and-battlefield', 'pawn-basics']))).toBe(false);
  });
});

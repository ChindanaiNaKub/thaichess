import { describe, expect, it } from 'vitest';

import {
  ALL_PUZZLES,
  CURATED_PUBLISH_FAILURES,
  CURATED_PUZZLES,
  GENERATED_PUBLISH_FAILURES,
  GENERATED_PUZZLES,
  PUBLISHABLE_CURATED_PUZZLES,
  PUBLISHABLE_GENERATED_PUZZLES,
  PUZZLE_POOL_BREAKDOWN,
  PUZZLE_PUBLISH_AUDIT,
  PUZZLE_POOL_DIAGNOSTICS,
  PUZZLES,
  QUARANTINED_PUZZLES,
  getPuzzlePublishAuditById,
  isPuzzleReadyToShip,
  type Puzzle,
} from '@shared/puzzles';
import { finalizePuzzle, type RawPuzzle } from '@shared/puzzleCatalog';
import { IMPORTED_PUZZLE_CANDIDATES, createImportedPuzzleCandidate } from '@shared/puzzleImportQueue';
import { validatePuzzle, validatePuzzles, validatePuzzleTurn } from '@shared/puzzleValidation';
import { validateMakrukPosition, validateMakrukPuzzlePosition } from '@shared/makrukPositionValidation';
import {
  createGameStateFromPuzzle,
  findObjectivePreservingFirstMoves,
  findGoalSatisfyingFirstMoves,
  getForcingMoves,
} from '@shared/puzzleSolver';
import { makeMove } from '@shared/engine';
import type { Board, Piece, PieceColor, PieceType, Position } from '@shared/types';

function p(type: PieceType, color: PieceColor): Piece {
  return { type, color };
}

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function square(name: string): Position {
  return {
    col: name.charCodeAt(0) - 97,
    row: parseInt(name[1], 10) - 1,
  };
}

function boardFromPlacements(...placements: Array<[string, PieceType, PieceColor]>): Board {
  const board = emptyBoard();

  for (const [name, type, color] of placements) {
    const { row, col } = square(name);
    board[row][col] = p(type, color);
  }

  return board;
}

function line(...steps: string[]): { from: Position; to: Position }[] {
  return steps.map(step => {
    const [from, to] = step.split('-');
    return {
      from: square(from),
      to: square(to),
    };
  });
}

function move(from: string, to: string): { from: Position; to: Position } {
  return {
    from: square(from),
    to: square(to),
  };
}

function createTestPuzzle(puzzle: RawPuzzle): Puzzle {
  return finalizePuzzle({
    hint1: 'Look for the forcing move first.',
    hint2: 'Do not cash out early if it lets the defender escape.',
    keyIdea: 'Preserve the real puzzle objective instead of settling for a superficial gain.',
    ...puzzle,
  });
}

function getPuzzle(id: number): Puzzle {
  const puzzle = ALL_PUZZLES.find(candidate => candidate.id === id);
  expect(puzzle).toBeDefined();
  return puzzle!;
}

describe('puzzleValidation', () => {
  it('accepts the shipped live puzzle pool', () => {
    const results = validatePuzzles(PUZZLES);

    expect(results.filter(result => result.errors.length > 0)).toEqual([]);
  }, 25000);

  it('ships a replay-backed live pool and quarantines the illegal screenshot sample', () => {
    expect(PUZZLES.map(puzzle => puzzle.id)).toContain(7001);
    expect(PUZZLES.map(puzzle => puzzle.id)).toContain(7003);
    expect(PUZZLES.map(puzzle => puzzle.id)).toContain(7004);
    expect(PUZZLES.map(puzzle => puzzle.id)).not.toContain(7002);
    expect(CURATED_PUZZLES).toHaveLength(4);
    expect(GENERATED_PUZZLES).toHaveLength(24);
    expect(PUBLISHABLE_CURATED_PUZZLES.map(puzzle => puzzle.id)).toEqual([7001, 7003, 7004]);
    expect(PUBLISHABLE_GENERATED_PUZZLES).toHaveLength(22);
    expect(PUZZLES).toHaveLength(25);
    expect(PUZZLES.every(isPuzzleReadyToShip)).toBe(true);
    expect(PUZZLE_POOL_DIAGNOSTICS).toMatchObject({
      totalCandidates: 28,
      validCandidates: 25,
      shippedCandidates: 25,
      rejectedCandidates: 3,
    });

    expect(IMPORTED_PUZZLE_CANDIDATES).toHaveLength(24);
    expect(IMPORTED_PUZZLE_CANDIDATES.every(candidate => isPuzzleReadyToShip(candidate))).toBe(true);
    expect(QUARANTINED_PUZZLES.map(puzzle => puzzle.id)).toContain(7002);
    expect(QUARANTINED_PUZZLES).toHaveLength(3);
  });

  it('aligns every live puzzle sideToMove with its first solution move', () => {
    const mismatches = ALL_PUZZLES.flatMap(puzzle => {
      const firstMove = puzzle.solutionLines[0]?.moves[0] ?? puzzle.solution[0];
      if (!firstMove) {
        return [`${puzzle.id}: missing first move`];
      }

      const firstPiece = puzzle.board[firstMove.from.row]?.[firstMove.from.col];
      if (!firstPiece || firstPiece.color !== puzzle.sideToMove || puzzle.toMove !== puzzle.sideToMove) {
        return [`${puzzle.id}: ${puzzle.sideToMove} vs ${firstPiece?.color ?? 'none'}`];
      }

      return [];
    });

    expect(mismatches).toEqual([]);
  });

  it('rejects impossible Makruk boards before puzzle logic runs', () => {
    const illegalBoard = boardFromPlacements(
      ['d1', 'K', 'white'],
      ['e1', 'R', 'white'],
      ['f1', 'R', 'white'],
      ['g1', 'R', 'white'],
      ['e8', 'K', 'black'],
      ['a6', 'P', 'black'],
      ['b6', 'P', 'black'],
      ['c6', 'P', 'black'],
      ['d6', 'P', 'black'],
      ['e6', 'P', 'black'],
      ['f6', 'P', 'black'],
      ['g6', 'P', 'black'],
      ['h6', 'P', 'black'],
    );

    expect(validateMakrukPosition(illegalBoard)).toBe(false);
  });

  it('returns structured legality errors for impossible duplicate met inventories', () => {
    const illegalBoard = boardFromPlacements(
      ['d1', 'K', 'white'],
      ['e1', 'M', 'white'],
      ['f1', 'M', 'white'],
      ['e8', 'K', 'black'],
    );

    expect(validateMakrukPuzzlePosition(illegalBoard)).toEqual({
      isValid: false,
      errors: expect.arrayContaining([
        'white has too many M pieces for a legal Makruk game.',
      ]),
    });
  });

  it('rejects the exact illegal screenshot board with a black bia on g7', () => {
    const screenshotBoard = boardFromPlacements(
      ['h5', 'K', 'white'],
      ['e6', 'M', 'white'],
      ['g6', 'PM', 'white'],
      ['h8', 'K', 'black'],
      ['h7', 'R', 'black'],
      ['h6', 'P', 'black'],
      ['g7', 'P', 'black'],
    );

    expect(validateMakrukPosition(screenshotBoard)).toBe(false);
  });

  it('defaults imported puzzle candidates to quarantine', () => {
    const basePuzzle = getPuzzle(7001);
    const candidate = createImportedPuzzleCandidate({
      ...basePuzzle,
      id: 9999,
      source: 'Generated candidate import',
    });

    expect(candidate.reviewStatus).toBe('quarantine');
    expect(candidate.reviewChecklist).toEqual({
      themeClarity: 'unreviewed',
      teachingValue: 'unreviewed',
      duplicateRisk: 'unreviewed',
      reviewNotes: '',
    });
    expect(isPuzzleReadyToShip(candidate)).toBe(false);
  });

  it('rejects puzzles whose sideToMove does not match the solution line or board state', () => {
    const puzzle = createTestPuzzle({
      id: 1009,
      title: 'Turn mismatch',
      description: 'White to move. Find mate in one.',
      explanation: 'The move is legal only for White.',
      source: 'test fixture',
      theme: 'MateIn1',
      motif: 'turn mismatch',
      difficulty: 'beginner',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Checkmate Black in one move.',
      whyPositionMatters: 'This test proves the publish gate rejects puzzles when the stored side to move disagrees with the board and solution line.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue applies.',
      commonWrongMove: move('d7', 'd6'),
      wrongMoveExplanation: 'That move is irrelevant because the puzzle is already invalid on turn metadata.',
      takeaway: 'Turn metadata must align with the board and the first solution move.',
      toMove: 'white',
      board: boardFromPlacements(
        ['c6', 'K', 'white'],
        ['d7', 'R', 'white'],
        ['d8', 'K', 'black'],
      ),
      solution: line('d7-d8'),
    });

    const brokenPuzzle = {
      ...puzzle,
      sideToMove: 'black' as const,
    };

    expect(validatePuzzleTurn(brokenPuzzle)).toEqual({
      isValid: false,
      errors: expect.arrayContaining([
        'sideToMove does not match legacy toMove field.',
        'sideToMove does not match solution line or board state',
      ]),
    });
    expect(validatePuzzle(brokenPuzzle).errors).toEqual(expect.arrayContaining([
      'sideToMove does not match legacy toMove field.',
      'sideToMove does not match solution line or board state',
    ]));
  });

  it('finalizePuzzle canonicalizes sideToMove from the first solution move', () => {
    const puzzle = finalizePuzzle({
      id: 1010,
      title: 'Canonical turn',
      description: 'White to move. Mate in one.',
      explanation: 'The solution starts with a white move.',
      source: 'test fixture',
      theme: 'MateIn1',
      motif: 'canonical turn',
      difficulty: 'beginner',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Checkmate Black in one move.',
      whyPositionMatters: 'The first move color should define the canonical side to move for user-facing consistency.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue applies.',
      hint1: 'Look for the forcing move first.',
      hint2: 'The canonical turn must match the published solution.',
      keyIdea: 'The first move color is the turn source of truth when a solution is present.',
      commonWrongMove: move('d7', 'd6'),
      wrongMoveExplanation: 'That move is not the published mating move.',
      takeaway: 'Turn metadata must follow the solution line.',
      sideToMove: 'black',
      toMove: 'black',
      board: boardFromPlacements(
        ['c6', 'K', 'white'],
        ['d7', 'R', 'white'],
        ['d8', 'K', 'black'],
      ),
      solution: line('d7-d8'),
    });

    expect(puzzle.sideToMove).toBe('white');
    expect(puzzle.toMove).toBe('white');
  });

  it('allows reviewed imported candidates to become ship-ready', () => {
    const basePuzzle = getPuzzle(7001);
    const candidate = {
      ...createImportedPuzzleCandidate({
        ...basePuzzle,
        id: 10000,
        source: 'Generated candidate import',
      }),
      reviewStatus: 'ship' as const,
      reviewChecklist: {
        themeClarity: 'pass' as const,
        teachingValue: 'pass' as const,
        duplicateRisk: 'clear' as const,
        reviewNotes: 'Reviewed and approved for shipping.',
      },
    };

    expect(isPuzzleReadyToShip(candidate)).toBe(true);
  });

  it('publishes curated and generated puzzles separately with visible failure audits', () => {
    const publishableRows = PUZZLE_PUBLISH_AUDIT.filter(row => row.publishable);
    const keepCount = PUZZLE_PUBLISH_AUDIT.filter(row => row.classification === 'Keep').length;
    const rewriteCount = PUZZLE_PUBLISH_AUDIT.filter(row => row.classification === 'Rewrite').length;
    const rejectCount = PUZZLE_PUBLISH_AUDIT.filter(row => row.classification === 'Reject').length;

    expect(publishableRows.map(row => row.id)).toEqual(expect.arrayContaining([7001, 7003, 7004, 9000, 9001, 9023]));
    expect({ keepCount, rewriteCount, rejectCount }).toEqual({
      keepCount: 25,
      rewriteCount: 0,
      rejectCount: 3,
    });
    expect(PUZZLE_POOL_BREAKDOWN.publishableBySource).toEqual({
      curated: 3,
      generated: 22,
    });
    expect(PUZZLE_POOL_BREAKDOWN.publishableByDifficulty).toEqual({
      beginner: 8,
      intermediate: 7,
      advanced: 10,
    });
    expect(CURATED_PUBLISH_FAILURES).toHaveLength(1);
    expect(CURATED_PUBLISH_FAILURES[0]).toMatchObject({
      id: 7002,
      sourceType: 'curated',
      classification: 'Reject',
      classificationReasons: expect.arrayContaining([
        'Black bia cannot be behind its starting rank.',
      ]),
    });
    expect(GENERATED_PUBLISH_FAILURES.map(row => row.id)).toEqual([9002, 9004]);
    expect(getPuzzlePublishAuditById(9002)).toMatchObject({
      classification: 'Reject',
      publishable: false,
      validationErrors: expect.arrayContaining([
        'Fork puzzle accepted move d5-c3 must lead to a line where the forking piece collects a target.',
      ]),
    });
  });

  it('accepts only the exact Ma fork in the tactical sample', () => {
    const puzzle = getPuzzle(7001);
    const state = createGameStateFromPuzzle(puzzle);
    const forcingMoves = getForcingMoves(state, puzzle);
    const engineWinningMoves = findGoalSatisfyingFirstMoves(puzzle);

    expect(validatePuzzle(puzzle).errors).toEqual([]);
    expect(puzzle.motif).toBe('Ma fork');
    expect(forcingMoves).toHaveLength(1);
    expect(engineWinningMoves).toHaveLength(1);
    expect(forcingMoves[0]).toMatchObject(puzzle.acceptedMoves[0]?.move);
    expect(engineWinningMoves[0]).toMatchObject(puzzle.acceptedMoves[0]?.move);
  });

  it('quarantines the illegal defensive sample instead of shipping it', () => {
    const puzzle = getPuzzle(7002);
    const result = validatePuzzle(puzzle);

    expect(result.errors).toContain('Black bia cannot be behind its starting rank.');
    expect(PUZZLES.map(candidate => candidate.id)).not.toContain(7002);
    expect(QUARANTINED_PUZZLES.map(candidate => candidate.id)).toContain(7002);
  });

  it('accepts only the immediate mate in the counting-aware sample', () => {
    const puzzle = getPuzzle(7003);
    const state = createGameStateFromPuzzle(puzzle);
    const move = puzzle.acceptedMoves[0]?.move;
    const solvedState = move ? makeMove(state, move.from, move.to) : null;

    expect(validatePuzzle(puzzle).errors).toEqual([]);
    expect(puzzle.dependsOnCounting).toBe(true);
    expect(puzzle.counting).toMatchObject({
      active: true,
      type: 'pieces_honor',
      countingColor: 'black',
      strongerColor: 'white',
      currentCount: 15,
      limit: 16,
    });
    expect(getForcingMoves(state, puzzle)).toHaveLength(1);
    expect(findGoalSatisfyingFirstMoves(puzzle)).toHaveLength(1);
    expect(solvedState?.isCheckmate).toBe(true);
    expect(solvedState?.resultReason).toBe('checkmate');
  });

  it('locks the capstone mate to an explicit piece list and authoritative line', () => {
    const puzzle = getPuzzle(7004);
    const state = createGameStateFromPuzzle(puzzle);
    const move = puzzle.acceptedMoves[0]?.move;
    const solvedState = move ? makeMove(state, move.from, move.to) : null;
    const rawGoalMoves = findGoalSatisfyingFirstMoves(puzzle)
      .map(candidate => `${String.fromCharCode(97 + candidate.from.col)}${candidate.from.row + 1}-${String.fromCharCode(97 + candidate.to.col)}${candidate.to.row + 1}`);
    const objectiveMoves = findObjectivePreservingFirstMoves(puzzle)
      .map(candidate => `${String.fromCharCode(97 + candidate.from.col)}${candidate.from.row + 1}-${String.fromCharCode(97 + candidate.to.col)}${candidate.to.row + 1}`);

    expect(validatePuzzle(puzzle).errors).toEqual([]);
    expect(puzzle.theme).toBe('MateIn3');
    expect(puzzle.motif).toBe('forced mate');
    expect(puzzle.positionAuthority).toBe('explicit_piece_list');
    expect(puzzle.solutionAuthority).toBe('authoritative_line');
    expect(puzzle.boardOrientation).toBe('white');
    expect(puzzle.progressionStage).toBe('late');
    expect(puzzle.pool).toBe('advanced_only');
    expect(puzzle.minimumStreakRequired).toBe(8);
    expect(getForcingMoves(state, puzzle)).toHaveLength(1);
    expect(rawGoalMoves).toEqual(expect.arrayContaining(['e4-d6', 'f3-f8']));
    expect(objectiveMoves).toEqual(['e4-d6']);
    expect(puzzle.pieceList).toEqual([
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
    ]);
    expect(move).toMatchObject({
      from: square('e4'),
      to: square('d6'),
    });
    expect(solvedState?.isCheck).toBe(true);
  }, 30000);

  it('confirms the authoritative capstone line has forced defender replies and ends in mate', () => {
    const puzzle = getPuzzle(7004);
    let state = createGameStateFromPuzzle(puzzle);

    const first = makeMove(state, square('e4'), square('d6'));
    expect(first).not.toBeNull();
    state = first!;
    expect(state.isCheck).toBe(true);
    expect(getForcingMoves(state, puzzle)).toEqual([move('e7', 'd6')]);

    const second = makeMove(state, square('e7'), square('d6'));
    expect(second).not.toBeNull();
    state = second!;

    const third = makeMove(state, square('f3'), square('f8'));
    expect(third).not.toBeNull();
    state = third!;
    expect(state.isCheck).toBe(true);
    expect(getForcingMoves(state, puzzle)).toEqual([move('g8', 'f8')]);

    const fourth = makeMove(state, square('g8'), square('f8'));
    expect(fourth).not.toBeNull();
    state = fourth!;

    const fifth = makeMove(state, square('e6'), square('g7'));
    expect(fifth).not.toBeNull();
    expect(fifth?.isCheckmate).toBe(true);
    expect(fifth?.resultReason).toBe('checkmate');
  });

  it('rejects puzzles with additional goal-satisfying first moves', () => {
    const puzzle = createTestPuzzle({
      id: 999,
      title: 'Ambiguous Double Rua',
      description: 'White to move. Find the mating move.',
      explanation: 'Either rook can mate, so the puzzle should be rejected as ambiguous.',
      source: 'test fixture',
      theme: 'Checkmate',
      motif: 'Ambiguous rook mate',
      difficulty: 'beginner',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Checkmate Black in one move.',
      whyPositionMatters: 'The position demonstrates why a publishable puzzle must have one exact first move, not multiple interchangeable mates.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue: the test is about uniqueness of the mating move.',
      commonWrongMove: { from: square('c7'), to: square('c6') },
      wrongMoveExplanation: 'Rc6 is legal, but it does not mate and therefore misses the objective.',
      takeaway: 'A strong puzzle needs one exact first move.',
      toMove: 'white',
      board: boardFromPlacements(
        ['a8', 'K', 'black'],
        ['b6', 'K', 'white'],
        ['c7', 'R', 'white'],
        ['d7', 'R', 'white'],
      ),
      solution: line('c7-c8'),
    });

    const result = validatePuzzle(puzzle);

    expect(findGoalSatisfyingFirstMoves(puzzle)).toHaveLength(2);
    expect(result.errors.some(error => error.startsWith('Puzzle has additional objective-preserving first move(s):'))).toBe(true);
  });

  it('requires hints before a puzzle can be publishable', () => {
    const puzzle = createTestPuzzle({
      id: 1006,
      title: 'Hintless Fork',
      description: 'White to move. Win the black Rua with a fork.',
      explanation: 'Nf6+ forks the king and rook.',
      source: 'test fixture',
      theme: 'Fork',
      motif: 'Ma fork',
      difficulty: 'beginner',
      reviewStatus: 'ship',
      reviewChecklist: {
        themeClarity: 'pass',
        teachingValue: 'pass',
        duplicateRisk: 'clear',
        reviewNotes: 'ready',
      },
      objective: 'Win the black Rua with the only forcing Ma fork.',
      whyPositionMatters: 'The line is legal and clear, but it should still fail without explicit teaching hints.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue applies here.',
      hint1: '',
      hint2: '',
      keyIdea: '',
      acceptedMoves: [
        {
          move: move('e4', 'f6'),
          lineId: 'main',
          explanation: 'Nf6+ is the fork.',
        },
      ],
      solutionLines: [
        {
          id: 'main',
          label: 'Fork',
          moves: line('e4-f6', 'e8-f8', 'f6-h7'),
          outcome: {
            result: 'white-win',
            reason: 'material_win',
            explanation: 'White wins the rook.',
          },
        },
      ],
      commonWrongMove: move('e4', 'g5'),
      wrongMoveExplanation: 'Ng5 loses the fork.',
      takeaway: 'Forcing forks need clear hints in the publish pipeline.',
      toMove: 'white',
      board: boardFromPlacements(
        ['c2', 'K', 'white'],
        ['e4', 'N', 'white'],
        ['e8', 'K', 'black'],
        ['h7', 'R', 'black'],
      ),
      goal: {
        kind: 'material-win',
        result: 'white-win',
        reason: 'material_win',
        minMaterialSwing: 500,
      },
      solution: line('e4-f6', 'e8-f8', 'f6-h7'),
    });

    expect(validatePuzzle(puzzle).errors).toEqual(expect.arrayContaining([
      'Puzzle must include a short first hint.',
      'Puzzle must include a stronger second hint.',
      'Puzzle must include the key idea it teaches.',
    ]));
  });

  it('rejects puzzles with an unclear objective', () => {
    const puzzle = createTestPuzzle({
      id: 1007,
      title: 'Vague Task',
      description: 'White to move.',
      explanation: 'Nf6+ is strong.',
      source: 'test fixture',
      theme: 'Fork',
      motif: 'Ma fork',
      difficulty: 'beginner',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Find the best move.',
      whyPositionMatters: 'The validator should reject puzzles that never state what the player is trying to preserve.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue applies here.',
      acceptedMoves: [
        {
          move: move('e4', 'f6'),
          lineId: 'main',
          explanation: 'Nf6+ is the fork.',
        },
      ],
      solutionLines: [
        {
          id: 'main',
          label: 'Fork',
          moves: line('e4-f6', 'e8-f8', 'f6-h7'),
          outcome: {
            result: 'white-win',
            reason: 'material_win',
            explanation: 'White wins the rook.',
          },
        },
      ],
      commonWrongMove: move('e4', 'g5'),
      wrongMoveExplanation: 'Ng5 loses the fork.',
      takeaway: 'A puzzle must say what it wants the player to achieve.',
      toMove: 'white',
      board: boardFromPlacements(
        ['c2', 'K', 'white'],
        ['e4', 'N', 'white'],
        ['e8', 'K', 'black'],
        ['h7', 'R', 'black'],
      ),
      goal: {
        kind: 'material-win',
        result: 'white-win',
        reason: 'material_win',
        minMaterialSwing: 500,
      },
      solution: line('e4-f6', 'e8-f8', 'f6-h7'),
    });

    expect(validatePuzzle(puzzle).errors).toEqual(expect.arrayContaining([
      'Puzzle objective is too vague. It must state the exact result to preserve.',
      'Puzzle objective must name a concrete result such as mate, draw, promotion, or material/conversion.',
      'Puzzle objective does not match the declared material goal.',
    ]));
  });

  it('prefers a forcing tactical win over a smaller knight capture that cashes out too early', () => {
    const puzzle = createTestPuzzle({
      id: 1003,
      title: 'Force First, Capture Later',
      description: 'White to move. Find the only move that keeps the tactical win alive.',
      explanation: 'Nf6+ forces the black king away and leaves the rook on h7 trapped; grabbing the met on d2 takes material but gives up the main fork.',
      source: 'test fixture',
      theme: 'Fork',
      motif: 'Ma fork',
      difficulty: 'intermediate',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Keep the attack and win the black Rua with the only forcing Ma fork.',
      whyPositionMatters: 'The position tests whether the evaluator can reject a small material grab when a stronger forcing fork wins much more and keeps the initiative.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue applies. The puzzle is about preserving initiative and the fork idea instead of cashing out for a small capture.',
      goal: {
        kind: 'material-win',
        result: 'white-win',
        reason: 'material_win',
        minMaterialSwing: 200,
      },
      acceptedMoves: [
        {
          move: move('e4', 'f6'),
          lineId: 'main',
          explanation: 'Nf6+ is the only move that keeps the king under pressure and wins the trapped Rua next.',
        },
      ],
      solutionLines: [
        {
          id: 'main',
          label: 'Main fork',
          moves: line('e4-f6', 'e8-f8', 'f6-h7'),
          outcome: {
            result: 'white-win',
            reason: 'material_win',
            explanation: 'White wins the full Rua after the forced king move.',
          },
        },
      ],
      commonWrongMove: move('e4', 'd2'),
      wrongMoveExplanation: 'Nxd2 wins a met, but it releases the black king from the fork and gives Black time to reorganize. White cashes out too early and misses the stronger tactical win.',
      takeaway: 'In Makruk tactics, keep the forcing fork if it wins the bigger target. A small capture is often the wrong cash-out.',
      toMove: 'white',
      board: boardFromPlacements(
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
        ['d2', 'PM', 'black'],
        ['f6', 'P', 'black'],
        ['g6', 'P', 'black'],
        ['h6', 'P', 'black'],
        ['c5', 'P', 'black'],
      ),
      solution: line('e4-f6', 'e8-f8', 'f6-h7'),
    });

    expect(findGoalSatisfyingFirstMoves(puzzle)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: square('e4'), to: square('f6') }),
        expect.objectContaining({ from: square('e4'), to: square('d2') }),
      ]),
    );
    expect(findObjectivePreservingFirstMoves(puzzle)).toEqual([
      expect.objectContaining({ from: square('e4'), to: square('f6') }),
    ]);
    expect(validatePuzzle(puzzle).errors).toEqual([]);
  }, 20000);

  it('rejects fork puzzles whose published move is not uniquely tied to the fork motif', () => {
    const puzzle = createTestPuzzle({
      id: 1008,
      title: 'Fake Fork Label',
      description: 'White to move. Win material.',
      explanation: 'Nf6+ is a fork, but the published line cashes in with the rook instead of the forking piece, so it should not pass as a fork lesson.',
      source: 'test fixture',
      theme: 'Fork',
      motif: 'Ma fork',
      difficulty: 'intermediate',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Win material with the only forcing fork.',
      whyPositionMatters: 'The theme says fork, so the validator should insist that the forking piece is the one that collects after the forced reply.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue applies.',
      acceptedMoves: [
        {
          move: move('e4', 'f6'),
          lineId: 'main',
          explanation: 'Nf6+ is forcing.',
        },
      ],
      solutionLines: [
        {
          id: 'main',
          label: 'Fork but wrong collector',
          moves: line('e4-f6', 'e8-f8', 'h1-h7'),
          outcome: {
            result: 'white-win',
            reason: 'material_win',
            explanation: 'White wins the rook, but the moved knight was not the collecting piece.',
          },
        },
      ],
      commonWrongMove: move('e4', 'g5'),
      wrongMoveExplanation: 'Rxf7 is an immediate grab that misses the published idea.',
      takeaway: 'A fork puzzle must actually teach a fork.',
      toMove: 'white',
      board: boardFromPlacements(
        ['c3', 'K', 'white'],
        ['h1', 'R', 'white'],
        ['e4', 'N', 'white'],
        ['e8', 'K', 'black'],
        ['h7', 'R', 'black'],
      ),
      goal: {
        kind: 'material-win',
        result: 'white-win',
        reason: 'material_win',
        minMaterialSwing: 500,
      },
      solution: line('e4-f6', 'e8-f8', 'h1-h7'),
    });

    expect(validatePuzzle(puzzle).errors).toEqual(expect.arrayContaining([
      'Fork puzzle accepted move e4-f6 is not the same piece that collects the second target later in line "main".',
    ]));
  });

  it('rejects a rook capture that wins material but gives up the stronger tactical net', () => {
    const puzzle = createTestPuzzle({
      id: 1005,
      title: 'Rook Grab or Rook Net',
      description: 'White to move. Find the stronger tactical win.',
      explanation: 'Rf8+ is the forcing move. Rxf7 wins a met, but the rook check wins the full black Rua because the knight controls f8 and the king has no better defense.',
      source: 'test fixture',
      theme: 'TacticalWin',
      motif: 'forcing rook net',
      difficulty: 'intermediate',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Keep the tactical net and win the black Rua, not just the loose met.',
      whyPositionMatters: 'The position checks that a rook capture is rejected when a forcing rook move wins much more and leaves Black with fewer resources.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue applies. White must value forcing geometry over an immediate side capture.',
      goal: {
        kind: 'material-win',
        result: 'white-win',
        reason: 'material_win',
        minMaterialSwing: 200,
      },
      acceptedMoves: [
        {
          move: move('f3', 'f8'),
          lineId: 'main',
          explanation: 'Rf8+ is forcing because Kxf8 is illegal and Black is left with only Rxf8, after which the Ma takes the Rua.',
        },
      ],
      solutionLines: [
        {
          id: 'main',
          label: 'Force the rook',
          moves: line('f3-f8', 'h8-f8', 'e6-f8'),
          outcome: {
            result: 'white-win',
            reason: 'material_win',
            explanation: 'White wins the full Rua instead of cashing out for the met.',
          },
        },
      ],
      commonWrongMove: move('f3', 'f7'),
      wrongMoveExplanation: 'Rxf7 wins a met, but it is the wrong priority. Black keeps the Rua and the king escapes the tighter net, so White misses the bigger tactical prize.',
      takeaway: 'When a rook move can force the defender into one reply, that net usually matters more than a small free capture.',
      toMove: 'white',
      board: boardFromPlacements(
        ['c3', 'K', 'white'],
        ['a7', 'R', 'white'],
        ['f3', 'R', 'white'],
        ['e6', 'N', 'white'],
        ['e8', 'K', 'black'],
        ['h8', 'R', 'black'],
        ['f7', 'M', 'black'],
      ),
      solution: line('f3-f8', 'h8-f8', 'e6-f8'),
    });

    const rawGoalMoves = findGoalSatisfyingFirstMoves(puzzle);
    const objectiveMoves = findObjectivePreservingFirstMoves(puzzle);

    expect(rawGoalMoves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: square('f3'), to: square('f7') }),
      ]),
    );
    expect(objectiveMoves.length).toBeGreaterThan(0);
    expect(objectiveMoves).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: square('f3'), to: square('f7') }),
      ]),
    );
  }, 20000);

  it('rejects a tempting knight capture when it gives up the only mating line', () => {
    const puzzle = createTestPuzzle({
      id: 1004,
      title: 'Do Not Take the Met',
      description: 'White to move. Find the only mate in 3.',
      explanation: 'Nd6+ is the interference move. Capturing the met on d8 looks attractive, but it lets Black reorganize and the mating net disappears.',
      source: 'test fixture',
      theme: 'MateIn3',
      motif: 'double Ma mating net',
      difficulty: 'advanced',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Checkmate Black in three moves with the only forcing interference move.',
      whyPositionMatters: 'The position punishes the natural material grab. White must interfere on d6 first, or Black keeps enough defenders to escape.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue applies. The puzzle is decided by Makruk king safety and the forcing mating net.',
      goal: {
        kind: 'checkmate',
        result: 'white-win',
        reason: 'checkmate',
      },
      acceptedMoves: [
        {
          move: move('f5', 'd6'),
          lineId: 'main',
          explanation: 'Nd6+ is the only move that forces the recapture and fixes Black’s defenders.',
        },
      ],
      solutionLines: [
        {
          id: 'main',
          label: 'Forced mate',
          moves: line('f5-d6', 'e7-d6', 'f3-f8', 'g8-f8', 'e6-g7'),
          outcome: {
            result: 'white-win',
            reason: 'checkmate',
            explanation: 'White mates after the forced interference and rook invasion.',
          },
        },
      ],
      commonWrongMove: move('e6', 'd8'),
      wrongMoveExplanation: 'Nxd8 wins the met, but it is the wrong kind of gain. Black keeps enough time and squares to break the mating net, so the attack is gone.',
      takeaway: 'Do not grab a side piece if the real Makruk idea is a forcing interference on the king side.',
      toMove: 'white',
      board: boardFromPlacements(
        ['a7', 'R', 'white'],
        ['e6', 'N', 'white'],
        ['c5', 'P', 'white'],
        ['f5', 'N', 'white'],
        ['c3', 'K', 'white'],
        ['f3', 'R', 'white'],
        ['b8', 'R', 'black'],
        ['d8', 'M', 'black'],
        ['e8', 'K', 'black'],
        ['e7', 'S', 'black'],
        ['f8', 'S', 'black'],
        ['g8', 'R', 'black'],
      ),
      solution: line('f5-d6', 'e7-d6', 'f3-f8', 'g8-f8', 'e6-g7'),
    });

    expect(findObjectivePreservingFirstMoves(puzzle)).toEqual([
      expect.objectContaining({ from: square('f5'), to: square('d6') }),
    ]);
    expect(validatePuzzle(puzzle).errors).toEqual([]);
  }, 30000);

  it('prefers the pressure move over a quiet move that throws away the count-aware win', () => {
    const puzzle = getPuzzle(7003);

    expect(findObjectivePreservingFirstMoves(puzzle)).toEqual([
      expect.objectContaining({ from: square('h7'), to: square('h8') }),
    ]);
    expect(findGoalSatisfyingFirstMoves(puzzle)).toEqual([
      expect.objectContaining({ from: square('h7'), to: square('h8') }),
    ]);
    expect(validatePuzzle(puzzle).errors).toEqual([]);
  });

  it('rejects positions where the non-moving side is already in check', () => {
    const puzzle = createTestPuzzle({
      id: 1001,
      title: 'Broken Double Met Mate',
      description: 'White to move. This should be rejected because Black is already in check before White moves.',
      explanation: 'A legal Makruk puzzle cannot start with the defender already in check.',
      source: 'test fixture',
      theme: 'Checkmate',
      motif: 'Illegal start in check',
      difficulty: 'beginner',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Checkmate Black in one move.',
      whyPositionMatters: 'The validator should reject illegal start positions before a puzzle can be published.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue: the position is illegal because the defender already starts in check.',
      commonWrongMove: { from: square('c7'), to: square('b8') },
      wrongMoveExplanation: 'Even if the move is legal, the puzzle still starts from an illegal position.',
      takeaway: 'Start positions must be legal before theme quality even matters.',
      toMove: 'white',
      board: boardFromPlacements(
        ['d8', 'K', 'black'],
        ['d6', 'K', 'white'],
        ['c7', 'M', 'white'],
        ['e6', 'M', 'white'],
      ),
      solution: line('e6-d7'),
    });

    const result = validatePuzzle(puzzle);

    expect(result.errors).toContain('Starting position is illegal: the non-moving side is already in check.');
  });

  it('rejects counting themes that omit the explicit counting state', () => {
    const puzzle = createTestPuzzle({
      id: 1002,
      title: 'Missing Sak Mak Data',
      description: 'White to move. Mate before the count closes.',
      explanation: 'Rh8 mates immediately, but the puzzle forgot to encode the Sak Mak state.',
      source: 'test fixture',
      theme: 'WinBeforeCountExpires',
      motif: 'final attack before Sak Mak draw',
      difficulty: 'intermediate',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Checkmate now before the Sak Mak count closes.',
      whyPositionMatters: 'The whole teaching point is count awareness, so the counting state must be part of the puzzle definition.',
      dependsOnCounting: true,
      ruleImpact: 'Mate quickly.',
      goal: {
        kind: 'checkmate',
        result: 'white-win',
        reason: 'win_before_count',
      },
      commonWrongMove: { from: square('f6'), to: square('e6') },
      wrongMoveExplanation: 'A quiet king move wastes time and misses the count-aware objective.',
      takeaway: 'Count-aware puzzles need explicit rule context.',
      toMove: 'white',
      board: boardFromPlacements(
        ['f6', 'K', 'white'],
        ['h7', 'R', 'white'],
        ['f8', 'K', 'black'],
      ),
      solution: line('h7-h8'),
    });

    const result = validatePuzzle(puzzle);

    expect(result.errors).toContain('Counting-dependent puzzle must mention Sak Mak, Sak Kradan, the count, or the final attack in ruleImpact.');
    expect(result.errors).toContain('Counting-dependent puzzle must include an explicit counting state.');
  });
});

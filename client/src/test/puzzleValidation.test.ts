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
import { buildPuzzlePublishAuditRow } from '@shared/puzzlePublishing';
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

  it('ships only the generated real-game live pool and quarantines the legacy screenshot sample', () => {
    expect(PUZZLES.map(puzzle => puzzle.id)).not.toContain(7001);
    expect(PUZZLES.map(puzzle => puzzle.id)).not.toContain(7003);
    expect(PUZZLES.map(puzzle => puzzle.id)).not.toContain(7004);
    expect(PUZZLES.map(puzzle => puzzle.id)).not.toContain(7002);
    expect(CURATED_PUZZLES).toHaveLength(4);
    expect(GENERATED_PUZZLES).toHaveLength(34);
    expect(PUBLISHABLE_CURATED_PUZZLES).toHaveLength(3);
    expect(PUBLISHABLE_GENERATED_PUZZLES).toHaveLength(32);
    expect(PUZZLES).toHaveLength(19);
    expect(PUZZLES.every(isPuzzleReadyToShip)).toBe(true);
    expect(PUZZLES.every(puzzle => !puzzle.source.startsWith('Makruk-native sample pack:'))).toBe(true);
    expect(PUZZLES.every(puzzle => !/selfplay|offline self-play/i.test(puzzle.title))).toBe(true);
    expect(PUZZLES.every(puzzle => !/offline self-play/i.test(puzzle.source))).toBe(true);
    expect(PUZZLES.every(puzzle => puzzle.tags.includes('editorial-live'))).toBe(true);
    expect(PUZZLES.every(puzzle => puzzle.streakTier)).toBe(true);
    expect(PUZZLES.some(puzzle => puzzle.streakTier === 'foundation')).toBe(true);
    expect(PUZZLES.some(puzzle => puzzle.streakTier === 'practical_attack')).toBe(true);
    expect(PUZZLES.some(puzzle => puzzle.streakTier === 'forcing_conversion')).toBe(true);
    expect(PUZZLES.some(puzzle => puzzle.streakTier === 'mate_pressure')).toBe(true);
    expect(PUZZLES.filter(puzzle => puzzle.tags.includes('fork')).length).toBeGreaterThanOrEqual(2);
    expect(PUZZLES.some(puzzle => puzzle.theme === 'Fork')).toBe(true);
    expect(PUZZLES.map(puzzle => puzzle.id)).toContain(9103);
    expect(PUZZLES.map(puzzle => puzzle.id)).not.toContain(9003);
    expect(PUZZLES.map(puzzle => puzzle.id)).toContain(9007);
    expect(PUZZLES.map(puzzle => puzzle.id)).not.toContain(9009);
    expect(PUZZLES.map(puzzle => puzzle.id)).toContain(9015);
    expect(PUZZLES.map(puzzle => puzzle.id)).not.toContain(9020);
    expect(PUZZLES.map(puzzle => puzzle.id)).not.toContain(9023);
    expect(PUZZLES.some(puzzle => puzzle.title === 'Fork the Back Guard')).toBe(false);
    expect(PUZZLES.some(puzzle => puzzle.title === 'Overload the Met Guard')).toBe(false);
    expect(PUZZLES.some(puzzle => puzzle.title === 'Late Pin, Clean Pickup')).toBe(false);
    expect(PUZZLES.some(puzzle => puzzle.title === 'Take the Loose Knight, Keep the Initiative')).toBe(false);
    expect(new Set(PUZZLES.map(puzzle => puzzle.theme)).size).toBeGreaterThanOrEqual(7);
    expect(PUZZLES.filter(puzzle => puzzle.tags.includes('mate-preparation')).length).toBeGreaterThanOrEqual(2);
    expect(PUZZLES.some(puzzle => puzzle.theme === 'WinBeforeCountExpires')).toBe(true);
    expect(PUZZLES.some(puzzle => ['MateIn2', 'MateIn3', 'MatingNet'].includes(puzzle.theme))).toBe(true);
    expect(PUZZLE_POOL_DIAGNOSTICS.totalCandidates).toBeGreaterThanOrEqual(35);
    expect(PUZZLE_POOL_DIAGNOSTICS.validCandidates).toBe(35);
    expect(PUZZLE_POOL_DIAGNOSTICS.shippedCandidates).toBe(19);
    expect(PUZZLE_POOL_DIAGNOSTICS.rejectedCandidates).toBe(3);

    expect(IMPORTED_PUZZLE_CANDIDATES).toHaveLength(34);
    expect(IMPORTED_PUZZLE_CANDIDATES.filter(candidate => isPuzzleReadyToShip(candidate))).toHaveLength(32);
    expect(IMPORTED_PUZZLE_CANDIDATES.find(candidate => candidate.id === 9199)).toMatchObject({
      reviewStatus: 'quarantine',
    });
    expect(IMPORTED_PUZZLE_CANDIDATES.find(candidate => candidate.id === 9200)).toMatchObject({
      reviewStatus: 'quarantine',
    });
    expect(QUARANTINED_PUZZLES.map(puzzle => puzzle.id)).toContain(7002);
    expect(QUARANTINED_PUZZLES.map(puzzle => puzzle.id)).toContain(9199);
    expect(QUARANTINED_PUZZLES.map(puzzle => puzzle.id)).toContain(9200);
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

  it('fails counting-sensitive lines when the active count expires before the claimed win', () => {
    const puzzle = createTestPuzzle({
      id: 1991,
      title: 'Count expires before the capture',
      description: 'White to move. Win the rook before the count runs out.',
      explanation: 'White appears to win the rook, but the count closes the game first.',
      source: 'Generated review batch',
      theme: 'HangingPiece',
      motif: 'count expiry',
      difficulty: 'intermediate',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Win the black rook before Sak Mak ends the game.',
      whyPositionMatters: 'This fixture proves count-aware validation rejects lines that only win material when counting is ignored.',
      dependsOnCounting: true,
      ruleImpact: 'Sak Mak is already active for White and the current count is at the limit, so any slow conversion immediately fails.',
      commonWrongMove: move('a1', 'a7'),
      wrongMoveExplanation: 'A waiting move is even worse because White loses the count without changing the result.',
      takeaway: 'Count-aware puzzles must validate the real Makruk result, not just the material snapshot.',
      toMove: 'white',
      counting: {
        active: true,
        type: 'board_honor',
        countingColor: 'white',
        strongerColor: 'white',
        currentCount: 64,
        startCount: 1,
        limit: 64,
        finalAttackPending: false,
      },
      board: boardFromPlacements(
        ['c1', 'K', 'white'],
        ['a1', 'R', 'white'],
        ['h8', 'K', 'black'],
        ['a8', 'R', 'black'],
      ),
      goal: {
        kind: 'material-win',
        result: 'white-win',
        reason: 'material_win',
        minMaterialSwing: 500,
      },
      acceptedMoves: [
        {
          move: move('a1', 'a2'),
          lineId: 'main',
          explanation: 'A waiting rook move proves the count expires before White can convert the position.',
        },
      ],
      solutionLines: [
        {
          id: 'main',
          label: 'Count-invalid waiting move',
          moves: line('a1-a2'),
          outcome: {
            result: 'white-win',
            reason: 'material_win',
            explanation: 'The claimed line says White wins the rook.',
          },
        },
      ],
      verification: {
        engineSource: 'binary',
        searchDepth: 12,
        searchNodes: 9000,
        multiPvGap: 120,
        onlyMoveChainLength: 1,
        countCriticality: 'critical',
        verificationStatus: 'engine_verified',
      },
    });

    expect(validatePuzzle(puzzle).errors).toEqual(expect.arrayContaining([
      'Solution line "main" fails because Makruk counting expires before the claimed objective is reached.',
    ]));
  });

  it('rejects generated puzzles that remain ambiguous after verification', () => {
    const basePuzzle = finalizePuzzle({
      ...getPuzzle(7001),
      id: 1992,
      source: 'Generated candidate import',
      origin: 'engine-generated',
      reviewStatus: 'ship',
      reviewChecklist: {
        themeClarity: 'pass',
        teachingValue: 'pass',
        duplicateRisk: 'clear',
        reviewNotes: 'Used for ambiguity fixture.',
      },
      verification: {
        engineSource: 'binary',
        searchDepth: 10,
        searchNodes: 8000,
        multiPvGap: 15,
        onlyMoveChainLength: 1,
        countCriticality: 'none',
        verificationStatus: 'ambiguous',
      },
    });

    expect(validatePuzzle(basePuzzle).errors).toEqual(expect.arrayContaining([
      'Generated puzzle is still ambiguous after verification and cannot be shipped.',
    ]));
  });

  it('rejects a puzzle whose motif claims mate preparation but the line never creates a mating net', () => {
    const puzzle = finalizePuzzle({
      ...getPuzzle(7001),
      id: 1993,
      motif: 'mate-preparation',
      explanation: 'The first move is supposed to seal the mating net.',
      tags: [...getPuzzle(7001).tags.filter(tag => tag !== 'fork'), 'mate-preparation'],
    });

    expect(validatePuzzle(puzzle).errors).toEqual(expect.arrayContaining([
      'Puzzle motif says mate preparation, but the verified line does not create a clear mating-net restriction.',
    ]));
  });

  it('rejects a material puzzle when the only gain is incidental', () => {
    const puzzle = createTestPuzzle({
      id: 1994,
      title: 'Incidental Pawn Grab',
      description: 'White to move. Win the loose pawn.',
      explanation: 'Nf6+ wins a pawn, but that gain does not create a meaningful conversion.',
      source: 'test fixture',
      theme: 'HangingPiece',
      motif: 'incidental pawn win',
      difficulty: 'beginner',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      objective: 'Win the loose pawn on f6.',
      whyPositionMatters: 'This fixture proves the validator rejects material-win puzzles that only pick up incidental material.',
      dependsOnCounting: false,
      ruleImpact: 'No counting issue applies here. The problem is that the published gain is too small to be a meaningful puzzle lesson.',
      goal: {
        kind: 'material-win',
        result: 'white-win',
        reason: 'material_win',
        minMaterialSwing: 100,
      },
      acceptedMoves: [
        {
          move: move('e4', 'f6'),
          lineId: 'main',
          explanation: 'Nf6+ captures the pawn, but that is all White gets.',
        },
      ],
      solutionLines: [
        {
          id: 'main',
          label: 'Incidental pawn capture',
          moves: line('e4-f6'),
          outcome: {
            result: 'white-win',
            reason: 'material_win',
            explanation: 'White wins one pawn and nothing more.',
          },
        },
      ],
      commonWrongMove: move('e4', 'g5'),
      wrongMoveExplanation: 'Ng5 keeps the knight active, but it does not win material at all.',
      takeaway: 'Not every legal pawn grab deserves to be a published puzzle.',
      toMove: 'white',
      board: boardFromPlacements(
        ['c2', 'K', 'white'],
        ['e4', 'N', 'white'],
        ['e8', 'K', 'black'],
        ['f6', 'P', 'black'],
      ),
      solution: line('e4-f6'),
    });

    expect(validatePuzzle(puzzle).errors).toEqual(expect.arrayContaining([
      'Puzzle wins only incidental material and does not teach a meaningful conversion.',
    ]));
  });

  it('uses verification metadata when seeding difficulty for otherwise similar puzzles', () => {
    const baseRaw = {
      ...getPuzzle(7001),
      id: 1993,
      reviewStatus: 'quarantine' as const,
      reviewChecklist: {
        themeClarity: 'unreviewed' as const,
        teachingValue: 'unreviewed' as const,
        duplicateRisk: 'unreviewed' as const,
        reviewNotes: '',
      },
      difficultyScore: undefined,
      verification: {
        engineSource: 'local' as const,
        searchDepth: null,
        searchNodes: null,
        multiPvGap: 40,
        onlyMoveChainLength: 1,
        countCriticality: 'none' as const,
        verificationStatus: 'solver_verified' as const,
      },
    };

    const easier = finalizePuzzle(baseRaw);
    const harder = finalizePuzzle({
      ...baseRaw,
      id: 1994,
      verification: {
        engineSource: 'binary',
        searchDepth: 16,
        searchNodes: 22000,
        multiPvGap: 210,
        onlyMoveChainLength: 3,
        countCriticality: 'critical',
        verificationStatus: 'engine_verified',
      },
    });

    expect(harder.difficultyScore).toBeGreaterThan(easier.difficultyScore);
  });

  it('exposes duplicate and verification status through the publish audit row', () => {
    const puzzle = finalizePuzzle({
      ...getPuzzle(7001),
      id: 1995,
      source: 'Generated candidate import',
      origin: 'engine-generated',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'duplicate',
        reviewNotes: 'Duplicate of a stronger real-game position.',
      },
      duplicateOf: 7001,
      verification: {
        engineSource: 'binary',
        searchDepth: 11,
        searchNodes: 12000,
        multiPvGap: 125,
        onlyMoveChainLength: 1,
        countCriticality: 'none',
        verificationStatus: 'solver_verified',
      },
    });

    const auditRow = buildPuzzlePublishAuditRow(puzzle);

    expect(auditRow.positionKey).toBe(puzzle.positionKey);
    expect(auditRow.duplicateOf).toBe(7001);
    expect(auditRow.verificationStatus).toBe('solver_verified');
    expect(auditRow.classification).toBe('Rewrite');
    expect(auditRow.classificationReasons).toEqual(expect.arrayContaining([
      'Puzzle is marked as a duplicate of #7001.',
    ]));
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

  it('keeps curated audits visible while the live published pool stays editorial-generated only', () => {
    const publishableRows = PUZZLE_PUBLISH_AUDIT.filter(row => row.publishable);
    const keepCount = PUZZLE_PUBLISH_AUDIT.filter(row => row.classification === 'Keep').length;
    const rewriteCount = PUZZLE_PUBLISH_AUDIT.filter(row => row.classification === 'Rewrite').length;
    const rejectCount = PUZZLE_PUBLISH_AUDIT.filter(row => row.classification === 'Reject').length;

    expect(publishableRows.map(row => row.id)).toEqual(expect.arrayContaining([7001, 7003, 7004, 9001, 9007, 9022, 9100, 9101, 9102, 9103, 9104, 9105, 9106, 9107]));
    expect(keepCount).toBe(35);
    expect(rewriteCount).toBe(0);
    expect(rejectCount).toBe(3);
    expect(PUZZLE_POOL_BREAKDOWN.publishableBySource).toEqual({
      curated: 3,
      generated: 32,
    });
    expect(PUZZLE_POOL_BREAKDOWN.publishableByDifficulty.beginner).toBeGreaterThanOrEqual(3);
    expect(PUZZLE_POOL_BREAKDOWN.publishableByDifficulty.intermediate).toBeGreaterThanOrEqual(3);
    expect(PUZZLE_POOL_BREAKDOWN.publishableByDifficulty.advanced).toBeGreaterThanOrEqual(8);
    expect(CURATED_PUBLISH_FAILURES).toHaveLength(3);
    expect(CURATED_PUBLISH_FAILURES.find(row => row.id === 7002)).toMatchObject({
      id: 7002,
      sourceType: 'curated',
      classification: 'Reject',
      classificationReasons: expect.arrayContaining([
        'Black bia cannot be behind its starting rank.',
      ]),
    });
    expect(CURATED_PUBLISH_FAILURES.find(row => row.id === 9199)).toMatchObject({
      id: 9199,
      sourceType: 'curated',
      classification: 'Reject',
      classificationReasons: expect.arrayContaining([
        'Accepted move set includes non-winning move(s): e4-f3.',
        'Puzzle has additional objective-preserving first move(s): g3-f3.',
      ]),
    });
    expect(CURATED_PUBLISH_FAILURES.find(row => row.id === 9200)).toMatchObject({
      id: 9200,
      sourceType: 'curated',
      classification: 'Reject',
      classificationReasons: expect.arrayContaining([
        'Accepted move set includes non-winning move(s): e4-f3.',
      ]),
    });
    expect(GENERATED_PUBLISH_FAILURES).toEqual([]);
    expect(getPuzzlePublishAuditById(9002)).toMatchObject({
      classification: 'Keep',
      publishable: true,
      validationWarnings: expect.arrayContaining([
        'Puzzle has lower-quality goal move(s) that reach the raw goal but do not preserve the main idea cleanly: d5-e3.',
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

  it('keeps outstanding generated drafts internally valid while image-import drafts remain quarantined for review', () => {
    const generatedFailures = [9002, 9004]
      .map((puzzleId) => ({
        puzzleId,
        errors: validatePuzzle(getPuzzle(puzzleId)).errors,
      }))
      .filter((result) => result.errors.length > 0);

    expect(generatedFailures).toEqual([]);
    expect(validatePuzzle(getPuzzle(9199)).errors).toEqual(expect.arrayContaining([
      'Accepted move set includes non-winning move(s): e4-f3.',
      'Puzzle has additional objective-preserving first move(s): g3-f3.',
    ]));
    expect(validatePuzzle(getPuzzle(9200)).errors).toEqual(expect.arrayContaining([
      'Accepted move set includes non-winning move(s): e4-f3.',
    ]));
  });

  it('stores the imported image-based black follow-up draft in quarantine until its line is reviewed', () => {
    const puzzleId = 9200;
    const quarantined = QUARANTINED_PUZZLES.find(candidate => candidate.id === puzzleId);

    expect(quarantined).toBeDefined();
    expect(quarantined).toMatchObject({
      id: puzzleId,
      reviewStatus: 'quarantine',
      toMove: 'black',
      sideToMove: 'black',
      theme: 'MateIn3',
      motif: 'Met takes ma, then rook mate from imported board image',
    });
    expect(quarantined?.source).toContain('image intake');
    expect(quarantined?.tags).toEqual(expect.arrayContaining(['image-import', 'candidate-from-photo', 'mate-candidate', 'material-vs-mate']));
    expect(PUZZLES.map(candidate => candidate.id)).not.toContain(puzzleId);
  });

  it('stores the imported conversion branch as the primary quarantine draft from the same image', () => {
    const puzzleId = 9199;
    const quarantined = QUARANTINED_PUZZLES.find(candidate => candidate.id === puzzleId);

    expect(quarantined).toBeDefined();
    expect(quarantined).toMatchObject({
      id: puzzleId,
      reviewStatus: 'quarantine',
      toMove: 'black',
      sideToMove: 'black',
      theme: 'TrappedPiece',
      motif: 'Met takes ma, then rook win from imported board image',
    });
    expect(quarantined?.source).toContain('image intake');
    expect(quarantined?.tags).toEqual(expect.arrayContaining(['image-import', 'candidate-from-photo', 'conversion-candidate', 'material-vs-mate']));
    expect(PUZZLES.map(candidate => candidate.id)).not.toContain(puzzleId);
  });

  it('keeps the imported mate draft focused on met takes ma before the rook attack', () => {
    const puzzle = getPuzzle(9200);
    let state = createGameStateFromPuzzle(puzzle);

    const first = makeMove(state, square('e4'), square('f3'));
    expect(first).not.toBeNull();
    state = first!;
    expect(state.isCheck).toBe(false);
    expect(state.board[square('f3').row]?.[square('f3').col]).toMatchObject({
      type: 'M',
      color: 'black',
    });

    const whiteGrab = makeMove(state, square('e3'), square('e6'));
    expect(whiteGrab).not.toBeNull();
    state = whiteGrab!;

    const rookCheck = makeMove(state, square('g3'), square('g2'));
    expect(rookCheck).not.toBeNull();
    expect(rookCheck?.isCheck).toBe(true);
  });

  it('keeps the imported conversion branch focused on met takes ma instead of the immediate rook check', () => {
    const puzzle = getPuzzle(9199);
    const state = createGameStateFromPuzzle(puzzle);

    const metCapture = makeMove(state, square('e4'), square('f3'));
    expect(metCapture).not.toBeNull();
    expect(metCapture?.isCheck).toBe(false);

    expect(puzzle.acceptedMoves[0]?.move).toMatchObject(move('e4', 'f3'));
    expect(puzzle.commonWrongMove).toMatchObject(move('g3', 'g2'));
  });

  it('ships the imported white knight net as a forced branching mate', () => {
    const puzzle = getPuzzle(9104);
    let state = createGameStateFromPuzzle(puzzle);

    expect(PUZZLES.map(candidate => candidate.id)).toContain(9104);
    expect(validatePuzzle(puzzle).errors).toEqual([]);
    expect(puzzle.title).toBe('Take the Ma, Net the Khun');
    expect(puzzle.source).toBe('Facebook group: คุยหมากรุกกับเซียนบอล · post "ตาขาวเดินชนะ"');
    expect(puzzle.sourceLicense).toBe('ดัดแปลงเฉพาะตำแหน่งเพื่อการศึกษา · ไม่นำภาพต้นฉบับมาใช้');
    expect(puzzle.sourceAuthor).toBe('คุยหมากรุกกับเซียนบอล');
    expect(puzzle.sourcePermissionStatus).toBe('position-only');
    expect(puzzle.sideToMove).toBe('white');
    expect(puzzle.theme).toBe('MateIn3');
    expect(puzzle.motif).toBe('Pawn capture clears the Ma net');
    expect(puzzle.acceptedMoves[0]?.move).toMatchObject(move('h2', 'g3'));
    expect(puzzle.solutionLines.map(line => line.moves.map(step => `${String.fromCharCode(97 + step.from.col)}${step.from.row + 1}-${String.fromCharCode(97 + step.to.col)}${step.to.row + 1}`))).toEqual([
      ['h2-g3', 'f4-g3', 'e7-f5'],
      ['h2-g3', 'h4-g3', 'e7-f5', 'g3-f3', 'e6-g5'],
    ]);

    const first = makeMove(state, square('h2'), square('g3'));
    expect(first).not.toBeNull();
    state = first!;
    expect(state.isCheck).toBe(true);

    const pawnBlock = makeMove(state, square('f4'), square('g3'));
    expect(pawnBlock?.isCheckmate).toBe(false);
    const pawnBlockMate = pawnBlock ? makeMove(pawnBlock, square('e7'), square('f5')) : null;
    expect(pawnBlockMate?.isCheckmate).toBe(true);
    expect(pawnBlockMate?.winner).toBe('white');

    const kingCapture = makeMove(state, square('h4'), square('g3'));
    expect(kingCapture).not.toBeNull();
    const knightCheck = kingCapture ? makeMove(kingCapture, square('e7'), square('f5')) : null;
    expect(knightCheck?.isCheck).toBe(true);
    const forcedKing = knightCheck ? makeMove(knightCheck, square('g3'), square('f3')) : null;
    expect(forcedKing).not.toBeNull();
    const finalMate = forcedKing ? makeMove(forcedKing, square('e6'), square('g5')) : null;
    expect(finalMate?.isCheckmate).toBe(true);
    expect(finalMate?.winner).toBe('white');
  });

  it('ships the imported back-rank ruea mate from a Facebook board image', () => {
    const puzzle = getPuzzle(9105);
    const state = createGameStateFromPuzzle(puzzle);
    const mate = makeMove(state, square('g7'), square('g8'));

    expect(PUZZLES.map(candidate => candidate.id)).toContain(9105);
    expect(validatePuzzle(puzzle).errors).toEqual([]);
    expect(puzzle.title).toBe('Ruea to the Back Rank');
    expect(puzzle.source).toBe('User-supplied Facebook Makruk board image · post "ตาขาวเดินชนะ"');
    expect(puzzle.sourceAuthor).toBeNull();
    expect(puzzle.sourcePermissionStatus).toBe('position-only');
    expect(puzzle.sideToMove).toBe('white');
    expect(puzzle.theme).toBe('MateIn1');
    expect(puzzle.motif).toBe('Back-rank ruea mate');
    expect(puzzle.acceptedMoves[0]?.move).toMatchObject(move('g7', 'g8'));
    expect(mate?.isCheckmate).toBe(true);
    expect(mate?.winner).toBe('white');
  });

  it('ships the imported fast-score ma net as a verified long forcing mate', () => {
    const puzzle = getPuzzle(9106);
    let state = createGameStateFromPuzzle(puzzle);

    expect(PUZZLES.map(candidate => candidate.id)).toContain(9106);
    expect(validatePuzzle(puzzle).errors).toEqual([]);
    expect(puzzle.title).toBe('Ma Check, Close the Score');
    expect(puzzle.source).toBe('User-supplied Facebook Makruk board image · prompt "ทีขาวเดิน จะปิดสกอร์อย่างไรให้เร็วที่สุด"');
    expect(puzzle.sourceAuthor).toBeNull();
    expect(puzzle.sourcePermissionStatus).toBe('position-only');
    expect(puzzle.sideToMove).toBe('white');
    expect(puzzle.theme).toBe('MateIn3');
    expect(puzzle.motif).toBe('Ma check starts a long forced mate');
    expect(puzzle.acceptedMoves[0]?.move).toMatchObject(move('a6', 'c5'));

    for (const step of line(
      'a6-c5',
      'b7-c7',
      'c2-b4',
      'h2-d2',
      'e3-d2',
      'c4-d6',
      'b4-a6',
      'c7-c6',
      'f8-d8',
      'e7-f5',
      'd8-c8',
      'h7-c7',
      'a6-b4',
      'c6-c5',
      'c8-c7',
    )) {
      const nextState = makeMove(state, step.from, step.to);
      expect(nextState).not.toBeNull();
      state = nextState!;
    }

    expect(state.isCheckmate).toBe(true);
    expect(state.winner).toBe('white');
  });

  it('ships the imported quiet ruea net before the ma mate', () => {
    const puzzle = getPuzzle(9107);
    let state = createGameStateFromPuzzle(puzzle);

    expect(PUZZLES.map(candidate => candidate.id)).toContain(9107);
    expect(validatePuzzle(puzzle).errors).toEqual([]);
    expect(puzzle.title).toBe('Quiet Ruea Net Before Ma Mate');
    expect(puzzle.source).toBe('Facebook group: หมากรุกไทย อ.ไพโรจน์ สุวรรณ์ · post "ตาขาวเดินชนะ!!"');
    expect(puzzle.sourceAuthor).toBe('หมากรุกไทย อ.ไพโรจน์ สุวรรณ์');
    expect(puzzle.sourcePermissionStatus).toBe('position-only');
    expect(puzzle.sideToMove).toBe('white');
    expect(puzzle.theme).toBe('MateIn2');
    expect(puzzle.motif).toBe('Quiet ruea net threatens unavoidable ma mate');
    expect(puzzle.acceptedMoves[0]?.move).toMatchObject(move('h7', 'b7'));

    for (const step of line('h7-b7', 'a4-c3', 'e6-c7')) {
      const nextState = makeMove(state, step.from, step.to);
      expect(nextState).not.toBeNull();
      state = nextState!;
    }

    expect(state.isCheckmate).toBe(true);
    expect(state.winner).toBe('white');
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
  }, 60000);

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

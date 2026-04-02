import { describe, expect, it } from 'vitest';
import { getLegalMoves } from '@shared/engine';
import {
  getMakrukCountingState,
  getMakrukPieceHonorLimit,
  hasMakrukTimeoutWinningMaterial,
  resolveMakrukTimeoutOutcome,
} from '@shared/makrukRules';
import { MAKRUK_RULE_PUZZLE_SYSTEM } from '@shared/makrukRulePuzzles';
import { EXAMPLE_MAKRUK_RULE_LESSON, MAKRUK_RULE_LESSONS, MAKRUK_RULE_LESSON_TRACKS } from '../lib/makrukRuleLessons';

describe('Makruk rule system', () => {
  it('uses the Gameindy Sak Mak limits', () => {
    const twoRooks = Array.from({ length: 8 }, () => Array(8).fill(null));
    twoRooks[0][0] = { type: 'K', color: 'white' };
    twoRooks[0][1] = { type: 'R', color: 'white' };
    twoRooks[0][2] = { type: 'R', color: 'white' };
    twoRooks[7][7] = { type: 'K', color: 'black' };

    const oneRook = Array.from({ length: 8 }, () => Array(8).fill(null));
    oneRook[0][0] = { type: 'K', color: 'white' };
    oneRook[0][1] = { type: 'R', color: 'white' };
    oneRook[7][7] = { type: 'K', color: 'black' };

    expect(getMakrukPieceHonorLimit(twoRooks, 'white')).toBe(8);
    expect(getMakrukPieceHonorLimit(oneRook, 'white')).toBe(16);
  });

  it('starts Sak Mak automatically when one side is bare king and no unpromoted pawns remain', () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[0][0] = { type: 'K', color: 'white' };
    board[0][1] = { type: 'R', color: 'white' };
    board[7][7] = { type: 'K', color: 'black' };

    expect(getMakrukCountingState(board)).toMatchObject({
      active: true,
      type: 'pieces_honor',
      countingColor: 'black',
      strongerColor: 'white',
      currentCount: 3,
      limit: 16,
    });
  });

  it('resolves timeout only when the side with time left has an official winning material set', () => {
    const winningBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
    winningBoard[0][0] = { type: 'K', color: 'white' };
    winningBoard[2][2] = { type: 'N', color: 'white' };
    winningBoard[3][3] = { type: 'M', color: 'white' };
    winningBoard[7][7] = { type: 'K', color: 'black' };

    const drawingBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
    drawingBoard[0][0] = { type: 'K', color: 'white' };
    drawingBoard[2][2] = { type: 'N', color: 'white' };
    drawingBoard[7][7] = { type: 'K', color: 'black' };

    expect(hasMakrukTimeoutWinningMaterial(winningBoard, 'white')).toBe(true);
    expect(resolveMakrukTimeoutOutcome(winningBoard, 'black')).toEqual({ winner: 'white', isDraw: false });

    expect(hasMakrukTimeoutWinningMaterial(drawingBoard, 'white')).toBe(false);
    expect(resolveMakrukTimeoutOutcome(drawingBoard, 'black')).toEqual({ winner: null, isDraw: true });
  });

  it('ships a rule-native puzzle system with counting goals and a legal counted win example', () => {
    expect(MAKRUK_RULE_PUZZLE_SYSTEM.supportedGoals).toContain('evaluate-counting-outcome');
    expect(MAKRUK_RULE_PUZZLE_SYSTEM.supportedGoals).toContain('choose-counting-action');

    const winBeforeCountPuzzle = MAKRUK_RULE_PUZZLE_SYSTEM.examplePuzzles.find(
      puzzle => puzzle.id === 'win-before-sak-mak-closes',
    );

    expect(winBeforeCountPuzzle).toBeDefined();
    const expectedMove = winBeforeCountPuzzle!.expectedAction.type === 'move' ? winBeforeCountPuzzle!.expectedAction.move : null;
    expect(expectedMove).not.toBeNull();
    expect(
      getLegalMoves(winBeforeCountPuzzle!.board, expectedMove!.from).some(
        candidate => candidate.row === expectedMove!.to.row && candidate.col === expectedMove!.to.col,
      ),
    ).toBe(true);
  });

  it('ships rule lessons as board scenarios with coach questions', () => {
    expect(MAKRUK_RULE_LESSON_TRACKS).toHaveLength(2);
    expect(MAKRUK_RULE_LESSONS.length).toBeGreaterThanOrEqual(5);
    expect(EXAMPLE_MAKRUK_RULE_LESSON.id).toBe('when-sak-mak-starts');
    expect(EXAMPLE_MAKRUK_RULE_LESSON.steps.some(step => step.kind === 'choice')).toBe(true);
    expect(EXAMPLE_MAKRUK_RULE_LESSON.steps.some(step => step.kind === 'wrap')).toBe(true);
  });
});

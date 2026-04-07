import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createInitialGameState, makeMove } from '@shared/engine';
import { serializeBoardPosition } from '@shared/engineAdapter';
import { usePostGameReview } from '../hooks/usePostGameReview';

function createSampleGame() {
  const initial = createInitialGameState(0, 0);
  const afterWhite = makeMove(initial, { row: 2, col: 0 }, { row: 3, col: 0 });
  if (!afterWhite) {
    throw new Error('Failed to build first sample move');
  }

  const afterBlack = makeMove(afterWhite, { row: 5, col: 0 }, { row: 4, col: 0 });
  if (!afterBlack) {
    throw new Error('Failed to build second sample move');
  }

  return {
    afterWhite,
    finalState: afterBlack,
  };
}

describe('usePostGameReview', () => {
  it('keeps analysis mode active when switching the analysis root through move selection', () => {
    const { finalState } = createSampleGame();
    const { result } = renderHook(() => usePostGameReview({
      enabled: true,
      mainLine: finalState.moveHistory,
      finalState,
    }));

    act(() => {
      result.current.jumpToMainLine(0);
    });

    act(() => {
      result.current.enterAnalysis();
    });

    act(() => {
      result.current.handlePieceDrop({ row: 5, col: 1 }, { row: 4, col: 1 });
    });

    expect(result.current.mode).toBe('analysis');
    expect(result.current.analysisRootMoveIndex).toBe(0);
    expect(result.current.analysisLine).toHaveLength(1);

    act(() => {
      result.current.jumpToAnalysisRoot(1);
    });

    expect(result.current.mode).toBe('analysis');
    expect(result.current.selectedMainLineMoveIndex).toBe(1);
    expect(result.current.analysisRootMoveIndex).toBe(1);
    expect(result.current.analysisLine).toHaveLength(0);
    expect(result.current.currentMoveHistory).toHaveLength(finalState.moveHistory.length);

    act(() => {
      result.current.jumpToAnalysisRoot(0);
    });

    expect(result.current.mode).toBe('analysis');
    expect(result.current.analysisRootMoveIndex).toBe(0);
    expect(result.current.analysisLine).toHaveLength(1);
  });

  it('restores the exact official board after leaving an analysis branch', () => {
    const { afterWhite, finalState } = createSampleGame();
    const { result } = renderHook(() => usePostGameReview({
      enabled: true,
      mainLine: finalState.moveHistory,
      finalState,
    }));

    act(() => {
      result.current.jumpToMainLine(0);
    });

    const officialBoard = serializeBoardPosition(result.current.currentState.board);

    act(() => {
      result.current.enterAnalysis();
    });

    act(() => {
      result.current.handlePieceDrop({ row: 5, col: 1 }, { row: 4, col: 1 });
    });

    act(() => {
      result.current.handlePieceDrop({ row: 2, col: 1 }, { row: 3, col: 1 });
    });

    expect(result.current.mode).toBe('analysis');
    expect(result.current.currentMoveHistory.length).toBe(afterWhite.moveHistory.length + 2);

    act(() => {
      result.current.returnToMainLine();
    });

    expect(result.current.mode).toBe('mainLine');
    expect(result.current.selectedMainLineMoveIndex).toBe(0);
    expect(result.current.currentMoveHistory).toHaveLength(afterWhite.moveHistory.length);
    expect(serializeBoardPosition(result.current.currentState.board)).toBe(officialBoard);
  });

  it('keeps branch choices separate and lets the user reset back to the root position', () => {
    const { afterWhite, finalState } = createSampleGame();
    const { result } = renderHook(() => usePostGameReview({
      enabled: true,
      mainLine: finalState.moveHistory,
      finalState,
    }));

    act(() => {
      result.current.jumpToMainLine(0);
    });

    act(() => {
      result.current.enterAnalysis();
    });

    act(() => {
      result.current.handlePieceDrop({ row: 5, col: 1 }, { row: 4, col: 1 });
    });

    const firstBranchMove = result.current.analysisLine[0];

    act(() => {
      result.current.stepBackward();
    });

    act(() => {
      result.current.handlePieceDrop({ row: 5, col: 2 }, { row: 4, col: 2 });
    });

    const secondBranchMove = result.current.analysisLine[0];

    expect(firstBranchMove).toMatchObject({ from: { row: 5, col: 1 }, to: { row: 4, col: 1 } });
    expect(secondBranchMove).toMatchObject({ from: { row: 5, col: 2 }, to: { row: 4, col: 2 } });

    act(() => {
      result.current.stepBackward();
    });

    act(() => {
      result.current.stepForward();
    });

    expect(result.current.analysisLine[0]).toMatchObject({ from: { row: 5, col: 2 }, to: { row: 4, col: 2 } });
    expect(result.current.analysisLine).toHaveLength(1);

    act(() => {
      result.current.resetAnalysis();
    });

    expect(result.current.mode).toBe('analysis');
    expect(result.current.analysisLine).toHaveLength(0);
    expect(result.current.currentMoveHistory).toHaveLength(afterWhite.moveHistory.length);
  });
});

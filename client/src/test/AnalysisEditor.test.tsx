import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialBoard } from '@shared/engine';
import {
  createEmptyEditorBoard,
  EditorPieceBank,
  getEditorAnalysisSnapshotKey,
  getEditorPositionStatus,
  getEditorValidationMessage,
} from '../components/AnalysisEditorTools';

vi.mock('../components/PieceSVG', () => ({
  default: ({ type, color }: { type: string; color: string }) => (
    <span data-testid={`piece-${type}-${color}`} />
  ),
}));

describe('Analysis editor helpers', () => {
  it('renders PyChess-style piece banks around the editable board', async () => {
    render(
      <>
        <EditorPieceBank color="black" selectedTool="move" onSelectTool={vi.fn()} />
        <EditorPieceBank color="white" selectedTool="move" onSelectTool={vi.fn()} />
      </>,
    );

    const blackBank = screen.getByRole('group', { name: 'Black pieces' });
    const whiteBank = screen.getByRole('group', { name: 'White pieces' });

    expect(within(blackBank).getByRole('button', { name: 'bK' })).toBeInTheDocument();
    expect(within(blackBank).getByRole('button', { name: 'bPM' })).toBeInTheDocument();
    expect(within(whiteBank).getByRole('button', { name: 'wK' })).toBeInTheDocument();
    expect(within(whiteBank).getByRole('button', { name: 'wPM' })).toBeInTheDocument();
  });

  it('renders black piece bank buttons on a light contrast tile', () => {
    render(<EditorPieceBank color="black" selectedTool="move" onSelectTool={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'bK' })).toHaveClass('editor-piece-bank-button-black');
  });

  it('shows validation errors and prevents analysis for unfinished positions', async () => {
    const status = getEditorPositionStatus(createEmptyEditorBoard());

    expect(status.canAnalyze).toBe(false);
    expect(status.errors).toContain('white must have exactly one king.');
    expect(status.errors).toContain('black must have exactly one king.');
  });

  it('marks the starting position as legal for analysis', async () => {
    const status = getEditorPositionStatus(createInitialBoard());

    expect(status.canAnalyze).toBe(true);
    expect(status.errors).toEqual([]);
  });

  it('maps shared validation errors to localizable editor copy', () => {
    const t = vi.fn((key: string, params?: Record<string, string | number>) => `${key}:${JSON.stringify(params ?? {})}`);

    const message = getEditorValidationMessage('white must have exactly one king.', t);

    expect(message).toBe('analysis.editor.validation.one_king:{"color":"white"}');
  });

  it('keys engine analysis results to the exact edited snapshot', () => {
    const board = createInitialBoard();
    const firstKey = getEditorAnalysisSnapshotKey({ board, turn: 'white', counting: null });

    board[2][0] = null;
    const secondKey = getEditorAnalysisSnapshotKey({ board, turn: 'white', counting: null });

    expect(secondKey).not.toBe(firstKey);
  });
});

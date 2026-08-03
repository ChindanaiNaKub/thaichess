import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import PostGameReviewPanel from '../components/PostGameReviewPanel';
import { I18nProvider } from '../lib/i18n';

const idleControls = {
  enterAnalysis: true,
  resetAnalysis: false,
  stepBackward: false,
  stepForward: false,
};

function renderReview(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('PostGameReviewPanel quieter Felt chrome', () => {
  it('uses lacquer-soft Enter Analysis without solid primary fill or card shadow', () => {
    renderReview(
      <PostGameReviewPanel
        mode="mainLine"
        selectedMainLineMoveIndex={-1}
        analysisRootMoveIndex={null}
        analysisLine={[]}
        controls={idleControls}
        onEnterAnalysis={vi.fn()}
        onReturnToMainLine={vi.fn()}
        onResetAnalysis={vi.fn()}
        onStepBackward={vi.fn()}
        onStepForward={vi.fn()}
        onJumpToStart={vi.fn()}
        onJumpToEnd={vi.fn()}
        engineAnalysis={null}
        engineAnalyzing={false}
        engineError={null}
      />,
    );

    const enter = screen.getByRole('button', { name: /enter analysis/i });
    expect(enter).toHaveClass('ui-btn-primary');
    expect(enter).not.toHaveClass('bg-primary');
    expect(enter).not.toHaveClass('text-white');

    const shell = enter.closest('div.rounded-xl');
    expect(shell?.className ?? '').not.toMatch(/shadow-/);
  });

  it('replaces unicode glyph nav with labeled bia-stroke controls', () => {
    const onStepForward = vi.fn();
    renderReview(
      <PostGameReviewPanel
        mode="analysis"
        selectedMainLineMoveIndex={2}
        analysisRootMoveIndex={2}
        analysisLine={[]}
        controls={{ ...idleControls, stepForward: true, resetAnalysis: true }}
        onEnterAnalysis={vi.fn()}
        onReturnToMainLine={vi.fn()}
        onResetAnalysis={vi.fn()}
        onStepBackward={vi.fn()}
        onStepForward={onStepForward}
        onJumpToStart={vi.fn()}
        onJumpToEnd={vi.fn()}
        engineAnalysis={null}
        engineAnalyzing={false}
        engineError={null}
      />,
    );

    expect(screen.queryByText('⏮')).not.toBeInTheDocument();
    expect(screen.queryByText('◀')).not.toBeInTheDocument();
    expect(screen.queryByText('▶')).not.toBeInTheDocument();
    expect(screen.queryByText('⏭')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next branch move/i }));
    expect(onStepForward).toHaveBeenCalledTimes(1);
  });
});

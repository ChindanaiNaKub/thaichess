import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InlineCapturedSummary from '../components/InlineCapturedSummary';

vi.mock('../components/PieceSVG', () => ({
  default: ({
    type,
    color,
    size,
    className,
  }: {
    type: string;
    color: string;
    size?: number;
    className?: string;
  }) => (
    <div
      data-testid={`piece-${type}`}
      data-color={color}
      data-size={size}
      data-class={className ?? ''}
    />
  ),
}));

describe('InlineCapturedSummary', () => {
  it('shows captured pawns and the net material inline', () => {
    render(
      <InlineCapturedSummary
        capturedPieces={[
          { type: 'N', count: 1, capturedColor: 'black' },
          { type: 'P', count: 3, capturedColor: 'black' },
        ]}
        materialDelta={6}
      />
    );

    expect(screen.getByTestId('inline-captured-summary')).toBeInTheDocument();
    expect(screen.getByTestId('piece-P')).toHaveAttribute('data-size', '10');
    expect(screen.getByText('x3')).toBeInTheDocument();
    expect(screen.getByTestId('inline-material-delta')).toHaveTextContent('+6');
  });

  it('returns nothing when there is no captured material to summarize', () => {
    const { container } = render(
      <InlineCapturedSummary capturedPieces={[]} materialDelta={null} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});

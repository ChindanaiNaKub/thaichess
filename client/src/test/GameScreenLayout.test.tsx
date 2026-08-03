import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GameScreenLayout, { GAME_BOARD_FRAME_CLASS } from '../components/GameScreenLayout';
import { I18nProvider } from '../lib/i18n';

describe('GameScreenLayout status row', () => {
  it('keeps status, check, and move count on one non-wrapping lane without pill chips', () => {
    render(
      <I18nProvider>
        <GameScreenLayout
          topPanel={<div>top</div>}
          board={<div>board</div>}
          bottomPanel={<div>bottom</div>}
          sidePanel={<div>side</div>}
          statusText="White to move"
          moveCount={12}
          showCheckBadge
          toolbar={<button type="button">Cancel premove</button>}
        />
      </I18nProvider>,
    );

    const row = screen.getByTestId('game-status-row');
    expect(row).toHaveClass('flex', 'min-w-0');
    expect(row.className).not.toMatch(/flex-wrap/);

    expect(screen.getByText('White to move')).toBeInTheDocument();
    expect(screen.getByText('game.check_status')).toBeInTheDocument();
    expect(screen.getByTestId('game-move-count')).toHaveTextContent(/moves\.title\s+12/);
    expect(screen.getByTestId('game-move-count').className).not.toMatch(/rounded-full/);
    expect(screen.getByRole('button', { name: 'Cancel premove' })).toBeInTheDocument();
  });

  it('surfaces Piece Guide in the status lane when statusHelp is provided', () => {
    render(
      <I18nProvider>
        <GameScreenLayout
          topPanel={<div>top</div>}
          board={<div>board</div>}
          bottomPanel={<div>bottom</div>}
          sidePanel={<div>side</div>}
          statusText="White to move"
          moveCount={2}
          showCheckBadge
          statusHelp={<button type="button" data-testid="piece-guide-status-help">Piece Guide</button>}
        />
      </I18nProvider>,
    );

    const row = screen.getByTestId('game-status-row');
    expect(row).toContainElement(screen.getByTestId('piece-guide-status-help'));
    expect(screen.getByText('game.check_status')).toBeInTheDocument();
  });

  it('lifts the board on a soft felt plane instead of a heavy SaaS card shell', () => {
    render(
      <I18nProvider>
        <GameScreenLayout
          topPanel={<div>top</div>}
          board={<div>board</div>}
          bottomPanel={<div>bottom</div>}
          sidePanel={<div>side</div>}
          statusText="White to move"
          moveCount={1}
        />
      </I18nProvider>,
    );

    const frame = screen.getByTestId('game-board-frame');
    expect(frame.className.split(/\s+/)).toEqual(
      expect.arrayContaining(GAME_BOARD_FRAME_CLASS.split(/\s+/)),
    );
    expect(frame.className).not.toMatch(/rounded-2xl/);
    expect(frame.className).not.toMatch(/bg-surface-alt\/90/);
    expect(frame.className).not.toMatch(/0_20px_36px/);
  });
});

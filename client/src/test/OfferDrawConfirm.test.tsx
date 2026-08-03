import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import GameMobileActions from '../components/GameMobileActions';
import ResignConfirmControls from '../components/ResignConfirmControls';

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  I18nProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('Offer Draw confirm harden', () => {
  it('gates Offer Draw behind a neutral confirm before emitting', () => {
    const onConfirm = vi.fn();
    render(
      <ResignConfirmControls
        onConfirm={onConfirm}
        resignLabelKey="game.offer_draw"
        confirmMessageKey="game.offer_draw_confirm"
        confirmActionKey="game.offer_draw_confirm_action"
        tone="neutral"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'game.offer_draw' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('game.offer_draw_confirm')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'game.offer_draw_confirm_action' })).toHaveClass(
      'ui-btn-primary',
    );

    fireEvent.click(screen.getByRole('button', { name: 'game.offer_draw_confirm_action' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses the same confirm gate in the mobile thumb-zone', () => {
    const onOfferDraw = vi.fn();
    render(
      <GameMobileActions
        t={(key) => key}
        onOfferDraw={onOfferDraw}
        onResign={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'game.offer_draw' }));
    expect(onOfferDraw).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'game.offer_draw_confirm_action' }));
    expect(onOfferDraw).toHaveBeenCalledTimes(1);
  });
});

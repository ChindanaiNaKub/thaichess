import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppearanceSettingsPage from '../components/AppearanceSettingsPage';
import { I18nProvider } from '../lib/i18n';
import { PieceStyleProvider } from '../lib/pieceStyle';

vi.mock('../components/Header', () => ({
  default: ({ subtitle }: { subtitle?: string }) => <div data-testid="header">{subtitle}</div>,
}));

vi.mock('../components/PieceSVG', () => ({
  default: ({ pieceStyleId, type, color }: { pieceStyleId?: string; type: string; color: string }) => (
    <div data-testid={`piece-svg-${pieceStyleId ?? 'context'}-${type}-${color}`} />
  ),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <PieceStyleProvider>
          <AppearanceSettingsPage />
        </PieceStyleProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe('AppearanceSettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists board and piece theme selections immediately', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /rosewood/i }));
    fireEvent.click(screen.getByRole('button', { name: /pieces/i }));
    fireEvent.click(screen.getByRole('button', { name: /ivory hall/i }));

    await waitFor(() => {
      expect(localStorage.getItem('thaichess-board-theme')).toBe('rosewood');
      expect(localStorage.getItem('thaichess-piece-style')).toBe('ivory');
    });

    expect(screen.getAllByText('Rosewood').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ivory Hall').length).toBeGreaterThan(0);
  });
});

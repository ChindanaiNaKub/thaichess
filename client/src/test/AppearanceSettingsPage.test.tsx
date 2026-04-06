import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppearanceSettingsPage from '../components/AppearanceSettingsPage';
import { I18nProvider, preloadDetectedTranslations } from '../lib/i18n';
import { PieceStyleProvider } from '../lib/pieceStyle';

vi.mock('../components/Header', () => ({
  default: ({ subtitle }: { subtitle?: string }) => <div data-testid="header">{subtitle}</div>,
}));

vi.mock('../components/PieceSVG', () => ({
  default: ({ pieceThemeId, type, color }: { pieceThemeId?: string; type: string; color: string }) => (
    <div data-testid={`piece-svg-${pieceThemeId ?? 'context'}-${type}-${color}`} />
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
  beforeEach(async () => {
    localStorage.clear();
    await preloadDetectedTranslations();
  });

  it('groups board themes into Makruk-friendly categories with real piece previews', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Classic' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Soft' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dark Mode' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elegant' })).toBeInTheDocument();
    expect(screen.getAllByTestId(/piece-svg-/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/contrast checked/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/old vs makruk/i)).toBeInTheDocument();
    expect(screen.getAllByText(/single-surface makruk/i).length).toBeGreaterThan(0);
  });

  it('persists board and piece color theme selections immediately', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /dark wood/i }));
    fireEvent.click(screen.getByRole('button', { name: /piece colors/i }));
    fireEvent.click(screen.getByRole('button', { name: /jade & bone/i }));

    await waitFor(() => {
      expect(localStorage.getItem('thaichess-board-theme')).toBe('dark-wood');
      expect(localStorage.getItem('thaichess-piece-theme')).toBe('jade-bone');
    }, { timeout: 10000 });

    expect(screen.getAllByText('Dark Wood').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jade & Bone').length).toBeGreaterThan(0);
  }, 10000);
});

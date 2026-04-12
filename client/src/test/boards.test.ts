import { describe, expect, it } from 'vitest';
import { BOARD_THEMES, DEFAULT_BOARD_THEME_ID, getBoardThemeById } from '../themes/boards';

describe('Makruk board themes', () => {
  it('keeps every board theme inside a supported category', () => {
    expect(BOARD_THEMES.map((theme) => theme.category)).toEqual([
      'classic',
      'classic',
      'soft',
      'elegant',
      'dark',
    ]);
  });

  it('validates grid and piece contrast on a single-surface board', () => {
    BOARD_THEMES.forEach((theme) => {
      expect(theme.validation.gridContrast).toBeGreaterThanOrEqual(1.18);
      expect(theme.validation.gridContrast).toBeLessThanOrEqual(2.45);
      expect(theme.validation.coordinateContrast).toBeGreaterThanOrEqual(4.5);
      expect(theme.validation.weakestPieceContrast).toBeGreaterThanOrEqual(2.35);
    });
  });

  it('falls back to the default theme when an unknown id is requested', () => {
    expect(getBoardThemeById('unknown-theme').id).toBe(DEFAULT_BOARD_THEME_ID);
  });
});

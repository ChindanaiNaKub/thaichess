import { describe, expect, it } from 'vitest';

import {
  getPuzzleThemeDefinition,
  isFuturePuzzleTheme,
  isMateTheme,
  isPromotionTheme,
  isTacticalTheme,
} from '@shared/puzzleThemes';

describe('puzzleThemes', () => {
  it('classifies supported Makruk mate, promotion, and material themes', () => {
    expect(isMateTheme('BackRank')).toBe(true);
    expect(isMateTheme('MateIn2')).toBe(true);
    expect(isPromotionTheme('Promotion')).toBe(true);
    expect(isTacticalTheme('Fork')).toBe(true);
    expect(isTacticalTheme('RemovalOfDefender')).toBe(true);
  });

  it('keeps future draw and king-shelter themes out of the material-win validator bucket', () => {
    expect(isFuturePuzzleTheme('VulnerableKing')).toBe(true);
    expect(isFuturePuzzleTheme('Stalemate')).toBe(true);
    expect(isTacticalTheme('Stalemate')).toBe(false);
    expect(isMateTheme('VulnerableKing')).toBe(false);
  });

  it('exposes adaptation notes for the Makruk catalog', () => {
    expect(getPuzzleThemeDefinition('Promotion')?.note).toContain('Makruk');
    expect(getPuzzleThemeDefinition('Defense')?.family).toBe('future');
  });
});

import { describe, expect, it } from 'vitest';
import {
  BOT_STRENGTH_BANDS,
  getBotPersonasInBand,
  getStrengthBandForBotId,
} from '@shared/botPersonas';
import {
  TIME_PRESETS,
  groupTimePresetsByPace,
} from '../components/quickPlayTimePresets';

describe('groupTimePresetsByPace', () => {
  it('splits all presets into pace groups of at most 4', () => {
    const groups = groupTimePresetsByPace(TIME_PRESETS);

    expect(groups.map((group) => group.pace)).toEqual(['bullet', 'blitz', 'rapid', 'classical']);
    for (const group of groups) {
      expect(group.presets.length).toBeGreaterThan(0);
      expect(group.presets.length).toBeLessThanOrEqual(4);
    }
    expect(groups.reduce((sum, group) => sum + group.presets.length, 0)).toBe(TIME_PRESETS.length);
  });
});

describe('bot strength bands', () => {
  it('keeps each expanded band at most 4 personas', () => {
    expect(BOT_STRENGTH_BANDS).toHaveLength(4);
    for (const band of BOT_STRENGTH_BANDS) {
      expect(getBotPersonasInBand(band.id).length).toBeLessThanOrEqual(4);
      expect(getBotPersonasInBand(band.id).length).toBeGreaterThan(0);
    }
  });

  it('maps the default bot into the club band', () => {
    expect(getStrengthBandForBotId('phra-suman')).toBe('club');
    expect(getBotPersonasInBand('club').some((persona) => persona.id === 'mae-saeng')).toBe(true);
  });
});

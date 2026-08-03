import { describe, expect, it } from 'vitest';
import {
  gameMetaChipClass,
  gameMetaChipInteractiveClass,
  gameMetaChipSelectedClass,
  shouldOfferPieceGuideStatusHelp,
} from '../components/gamePageHelpers';
import { EN_TRANSLATIONS } from '../lib/i18n.en';
import { TH_TRANSLATIONS } from '../lib/i18n.th';

describe('mid-play meta chip grammar', () => {
  it('keeps meta chips on cloth without lacquer or State Gold', () => {
    for (const className of [
      gameMetaChipClass,
      gameMetaChipInteractiveClass,
      gameMetaChipSelectedClass,
    ]) {
      expect(className).not.toMatch(/primary|gold|accent/);
      expect(className).toMatch(/surface/);
    }
  });
});

describe('Piece Guide onboard', () => {
  it('drops emoji from Piece Guide labels', () => {
    expect(EN_TRANSLATIONS['game.piece_guide']).toBe('Piece Guide');
    expect(TH_TRANSLATIONS['game.piece_guide']).toBe('คู่มือตัวหมาก');
    expect(EN_TRANSLATIONS['game.piece_guide']).not.toMatch(/📖/);
    expect(TH_TRANSLATIONS['game.piece_guide']).not.toMatch(/📖/);
  });

  it('offers status-lane help on check only (side pin owns early discovery)', () => {
    expect(shouldOfferPieceGuideStatusHelp(0, false, false)).toBe(false);
    expect(shouldOfferPieceGuideStatusHelp(5, false, false)).toBe(false);
    expect(shouldOfferPieceGuideStatusHelp(6, false, false)).toBe(false);
    expect(shouldOfferPieceGuideStatusHelp(40, true, false)).toBe(true);
    expect(shouldOfferPieceGuideStatusHelp(2, true, false)).toBe(true);
    expect(shouldOfferPieceGuideStatusHelp(2, false, true)).toBe(false);
    expect(shouldOfferPieceGuideStatusHelp(0, true, true)).toBe(false);
  });
});

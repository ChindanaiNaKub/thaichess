import { describe, expect, it } from 'vitest';
import { EN_TRANSLATIONS } from '../lib/i18n.full';
import { TH_TRANSLATIONS } from '../lib/i18n.th';

function findMissingKeys(
  source: Record<string, string>,
  target: Record<string, string>,
): string[] {
  return Object.keys(source)
    .filter((key) => !(key in target))
    .sort();
}

function findBlankValues(catalog: Record<string, string>): string[] {
  return Object.entries(catalog)
    .filter(([, value]) => value.trim().length === 0)
    .map(([key]) => key)
    .sort();
}

describe('i18n catalogs', () => {
  it('keeps English and Thai translation keys in sync', () => {
    const missingInThai = findMissingKeys(EN_TRANSLATIONS, TH_TRANSLATIONS);
    const missingInEnglish = findMissingKeys(TH_TRANSLATIONS, EN_TRANSLATIONS);

    expect(
      { missingInThai, missingInEnglish },
      [
        'Translation catalogs drifted.',
        'When you add a new UI string, add both English and Thai entries in client/src/lib/i18n.full.tsx and client/src/lib/i18n.th.ts.',
        `Missing in Thai: ${missingInThai.join(', ') || 'none'}`,
        `Missing in English: ${missingInEnglish.join(', ') || 'none'}`,
      ].join('\n'),
    ).toEqual({
      missingInThai: [],
      missingInEnglish: [],
    });
  });

  it('does not allow blank translation values', () => {
    const blankEnglish = findBlankValues(EN_TRANSLATIONS);
    const blankThai = findBlankValues(TH_TRANSLATIONS);

    expect(
      { blankEnglish, blankThai },
      [
        'Blank translation values are not allowed.',
        'Fill in both English and Thai strings instead of leaving placeholders empty.',
        `Blank English keys: ${blankEnglish.join(', ') || 'none'}`,
        `Blank Thai keys: ${blankThai.join(', ') || 'none'}`,
      ].join('\n'),
    ).toEqual({
      blankEnglish: [],
      blankThai: [],
    });
  });
});

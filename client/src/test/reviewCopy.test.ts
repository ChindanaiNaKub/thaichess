import { describe, expect, it } from 'vitest';
import { REVIEW_COPY_CATALOGS } from '../lib/reviewCopy';

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

describe('review copy catalogs', () => {
  it('keeps English and Thai review keys in sync', () => {
    const missingInThai = findMissingKeys(REVIEW_COPY_CATALOGS.en, REVIEW_COPY_CATALOGS.th);
    const missingInEnglish = findMissingKeys(REVIEW_COPY_CATALOGS.th, REVIEW_COPY_CATALOGS.en);

    expect({ missingInThai, missingInEnglish }).toEqual({
      missingInThai: [],
      missingInEnglish: [],
    });
  });

  it('does not allow blank review translation values', () => {
    const blankEnglish = findBlankValues(REVIEW_COPY_CATALOGS.en);
    const blankThai = findBlankValues(REVIEW_COPY_CATALOGS.th);

    expect({ blankEnglish, blankThai }).toEqual({
      blankEnglish: [],
      blankThai: [],
    });
  });
});

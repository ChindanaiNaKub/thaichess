import { describe, expect, it } from 'vitest';
import { translate } from '../lib/i18n';

describe('English bootstrap translations', () => {
  it('includes quick play labels needed before the full catalog loads', () => {
    expect(translate('quick.title', undefined, 'en')).toBe('Quick Play');
    expect(translate('quick.find', undefined, 'en')).toBe('Find Opponent');
    expect(translate('common.back_home', undefined, 'en')).toBe('Back to Home');
  });
});

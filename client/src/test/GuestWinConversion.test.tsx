import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GuestWinConversion, { shouldOfferGuestWinConversion } from '../components/GuestWinConversion';

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const SEEN_KEY = 'thaichess_guest_win_conversion_seen';

function installLocalStorageStub() {
  const store = new Map<string, string>();
  const stub = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => void store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: stub,
  });
}

describe('GuestWinConversion', () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the conversion card with a login CTA on first mount', () => {
    window.localStorage.removeItem(SEEN_KEY);

    render(<GuestWinConversion />);

    expect(screen.getByTestId('guest-win-conversion')).toBeInTheDocument();
    expect(screen.getByTestId('guest-win-conversion-cta')).toHaveTextContent('gameover.guest_win_cta');
  });

  it('marks the card as seen after mounting', () => {
    window.localStorage.removeItem(SEEN_KEY);

    render(<GuestWinConversion />);

    expect(window.localStorage.getItem(SEEN_KEY)).toBe('1');
  });

  it('suppresses repeat offers once seen, signed-in users, and pending auth', () => {
    window.localStorage.setItem(SEEN_KEY, '1');
    expect(shouldOfferGuestWinConversion(false, false)).toBe(false);

    window.localStorage.removeItem(SEEN_KEY);
    expect(shouldOfferGuestWinConversion(false, false)).toBe(true);
    expect(shouldOfferGuestWinConversion(true, false)).toBe(false);
    expect(shouldOfferGuestWinConversion(false, true)).toBe(false);
  });
});

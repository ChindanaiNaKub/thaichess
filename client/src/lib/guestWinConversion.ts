export const SEEN_KEY = 'thaichess_guest_win_conversion_seen';

function hasSeenConversionCard(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function shouldOfferGuestWinConversion(isSignedIn: boolean, loading: boolean): boolean {
  return !loading && !isSignedIn && !hasSeenConversionCard();
}

import { toBlob } from 'html-to-image';
import { savedGameAnalysisRoute } from './routes';

export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;

/** Public host printed on share images (always production branding). */
export const SHARE_CARD_SITE_HOST = 'thaichess.dev';

const PRODUCTION_SITE_ORIGIN = `https://${SHARE_CARD_SITE_HOST}`;

export function getShareCardSiteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  return PRODUCTION_SITE_ORIGIN;
}

/**
 * Prefer the saved-game analysis/replay route when we have a real game id.
 * Local ephemeral ids (`local-*`) only advertise the site origin.
 */
export function buildPostGameShareUrl(analysisId?: string | null): string {
  const origin = getShareCardSiteOrigin();
  if (analysisId && !analysisId.startsWith('local-')) {
    return `${origin}${savedGameAnalysisRoute(analysisId)}`;
  }

  return origin;
}

export function buildPostGameShareText(
  summary: string,
  analysisId?: string | null,
): string {
  const shareUrl = buildPostGameShareUrl(analysisId);
  return `${summary}\n${shareUrl}`;
}

export async function renderShareCardBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    cacheBust: true,
    backgroundColor: '#1a120e',
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    pixelRatio: 2,
    canvasWidth: SHARE_CARD_WIDTH * 2,
    canvasHeight: SHARE_CARD_HEIGHT * 2,
    style: {
      margin: '0',
      transform: 'none',
      width: `${SHARE_CARD_WIDTH}px`,
      height: `${SHARE_CARD_HEIGHT}px`,
    },
  });

  if (!blob) {
    throw new Error('Share card export failed');
  }

  return blob;
}

export function downloadShareCardBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function shareShareCardBlob(blob: Blob, filename: string, title: string, text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false;
  }

  const file = new File([blob], filename, { type: 'image/png' });

  if (!navigator.canShare({ files: [file] })) {
    return false;
  }

  await navigator.share({
    files: [file],
    title,
    text,
  });

  return true;
}

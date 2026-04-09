import { toBlob } from 'html-to-image';

export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;

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
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
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

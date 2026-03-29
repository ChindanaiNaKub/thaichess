import { memo, useId } from 'react';
import type { PieceType, PieceColor } from '@shared/types';
import { useBoardAppearance } from '../lib/pieceStyle';
import type { PieceThemeId, TraditionalPiecePalette } from '../themes/pieces';
import { getPieceThemeById } from '../themes/pieces';
import biaBlackSvg from '../assets/pieces/traditional/Bia_black.svg?raw';
import biangaiBlackSvg from '../assets/pieces/traditional/Biangai_black.svg?raw';
import khonBlackSvg from '../assets/pieces/traditional/Khon_black.svg?raw';
import khunBlackSvg from '../assets/pieces/traditional/Khun_black.svg?raw';
import maBlackSvg from '../assets/pieces/traditional/Ma_black.svg?raw';
import metBlackSvg from '../assets/pieces/traditional/Met_black.svg?raw';
import rueaBlackSvg from '../assets/pieces/traditional/Ruea_black.svg?raw';

interface PieceSVGProps {
  type: PieceType;
  color: PieceColor;
  size?: number;
  className?: string;
  pieceThemeId?: PieceThemeId;
}

type TraditionalAsset = {
  viewBox: string;
  markup: string;
};

function parseTraditionalAsset(source: string): TraditionalAsset {
  const cleaned = source
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .trim();
  const match = cleaned.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);

  if (!match) {
    return {
      viewBox: '0 0 360 360',
      markup: cleaned,
    };
  }

  const [, attrs, markup] = match;
  const viewBox = attrs.match(/viewBox="([^"]+)"/i)?.[1] ?? '0 0 360 360';

  return {
    viewBox,
    markup: markup.trim(),
  };
}

const parsedTraditionalAssets: Record<PieceType, TraditionalAsset> = {
  K: parseTraditionalAsset(khunBlackSvg),
  M: parseTraditionalAsset(metBlackSvg),
  S: parseTraditionalAsset(khonBlackSvg),
  R: parseTraditionalAsset(rueaBlackSvg),
  N: parseTraditionalAsset(maBlackSvg),
  P: parseTraditionalAsset(biaBlackSvg),
  PM: parseTraditionalAsset(biangaiBlackSvg),
};

function colorizeTraditionalMarkup(markup: string, palette: TraditionalPiecePalette, fillId: string) {
  return markup
    .replace(/fill="(#000000|#14110F|black|#F5F1E8|#F7F2E8|#F2EADB)"/gi, `fill="url(#${fillId})"`)
    .replace(
      /stroke="none"/gi,
      `stroke="${palette.stroke}" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="0.92" paint-order="stroke fill"`
    )
    .replace(/stroke="(#000000|#14110F|black|#333333|#2B2B2B|#111111|#5F5245)"/gi, `stroke="${palette.stroke}"`);
}

function buildTraditionalPawnMarkup(type: 'P' | 'PM', palette: TraditionalPiecePalette, fillId: string) {
  if (type === 'PM') {
    return `
      <circle cx="180" cy="180" r="112" fill="url(#${fillId})" />
      <circle cx="180" cy="180" r="100" fill="none" stroke="${palette.stroke}" stroke-width="16" stroke-opacity="0.88" />
      <circle cx="180" cy="180" r="60" fill="${palette.promotedDot}" />
    `;
  }

  return `
    <circle cx="180" cy="180" r="112" fill="url(#${fillId})" />
    <circle cx="180" cy="180" r="100" fill="none" stroke="${palette.stroke}" stroke-width="16" stroke-opacity="0.88" />
    <circle cx="180" cy="180" r="60" fill="none" stroke="${palette.stroke}" stroke-width="16" stroke-opacity="0.88" />
    <circle cx="180" cy="180" r="20" fill="${palette.stroke}" />
  `;
}

function getTraditionalAsset(type: PieceType, palette: TraditionalPiecePalette, fillId: string): TraditionalAsset {
  if (type === 'P' || type === 'PM') {
    return {
      viewBox: parsedTraditionalAssets[type].viewBox,
      markup: buildTraditionalPawnMarkup(type, palette, fillId),
    };
  }

  const asset = parsedTraditionalAssets[type];
  return {
    viewBox: asset.viewBox,
    markup: colorizeTraditionalMarkup(asset.markup, palette, fillId),
  };
}

function renderTraditional(type: PieceType, uid: string, palette: TraditionalPiecePalette) {
  const fillId = `traditional-fill-${uid}`;
  const filterId = `traditional-shadow-${uid}`;
  const asset = getTraditionalAsset(type, palette, fillId);

  return {
    viewBox: asset.viewBox,
    defs: (
      <defs>
        <linearGradient id={fillId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.fillTop} />
          <stop offset="22%" stopColor={palette.fillTop} />
          <stop offset="56%" stopColor={palette.fillBase} />
          <stop offset="100%" stopColor={palette.fillBottom} />
        </linearGradient>
        <filter id={filterId} x="-8%" y="-8%" width="116%" height="122%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="2.8" floodColor={palette.shadow} />
        </filter>
      </defs>
    ),
    content: <g filter={`url(#${filterId})`} dangerouslySetInnerHTML={{ __html: asset.markup }} />,
  };
}

const PieceSVG = memo(function PieceSVG({ type, color, size, className, pieceThemeId }: PieceSVGProps) {
  const { pieceThemeId: activeThemeFromContext } = useBoardAppearance();
  const activePieceTheme = pieceThemeId ?? activeThemeFromContext;
  const pieceTheme = getPieceThemeById(activePieceTheme);
  const traditionalId = useId().replace(/[:]/g, '');
  const traditionalAsset = renderTraditional(type, traditionalId, pieceTheme.colors[color]);
  const content = traditionalAsset.content;

  return (
    <svg
      viewBox={traditionalAsset?.viewBox ?? '0 0 80 80'}
      {...(className
        ? { className }
        : { width: size ?? 80, height: size ?? 80 }
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      {traditionalAsset?.defs}
      {content}
    </svg>
  );
});

export default PieceSVG;

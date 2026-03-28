import { memo, useId } from 'react';
import type { PieceType, PieceColor } from '@shared/types';
import { usePieceStyle } from '../lib/pieceStyle';
import type {
  GlyphPiecePalette,
  PieceStyle,
  TraditionalPiecePalette,
  WesternPiecePalette,
} from '../themes/pieces';
import { getPieceSetById } from '../themes/pieces';
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
  pieceStyleId?: PieceStyle;
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

function renderGlyph(type: PieceType, palette: GlyphPiecePalette) {

  const baseCircle = (
    <>
      <circle cx="40" cy="42" r="30" fill={palette.base} opacity="0.5" />
      <circle cx="40" cy="40" r="30" fill={palette.fill} stroke={palette.stroke} strokeWidth="2.5" />
      <circle cx="40" cy="40" r="25" fill="none" stroke={palette.accent} strokeWidth="1" opacity="0.6" />
    </>
  );

  switch (type) {
    case 'K':
      return (
        <g>
          {baseCircle}
          <path
            d="M28 45 L28 38 L32 42 L36 34 L40 40 L44 34 L48 42 L52 38 L52 45 Z"
            fill={palette.text}
            stroke={palette.text}
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <rect x="29" y="45" width="22" height="3" rx="1" fill={palette.text} />
          <rect x="38.5" y="28" width="3" height="8" rx="1" fill={palette.text} />
          <rect x="36" y="30.5" width="8" height="3" rx="1" fill={palette.text} />
        </g>
      );
    case 'M':
      return (
        <g>
          {baseCircle}
          <path
            d="M40 28 L49 40 L40 52 L31 40 Z"
            fill="none"
            stroke={palette.text}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M40 33 L46 40 L40 47 L34 40 Z" fill={palette.text} opacity="0.4" />
          <circle cx="40" cy="40" r="2.5" fill={palette.text} />
        </g>
      );
    case 'PM':
      return (
        <g>
          {baseCircle}
          <path
            d="M40 28 L49 40 L40 52 L31 40 Z"
            fill="none"
            stroke={palette.text}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M40 33 L46 40 L40 47 L34 40 Z" fill={palette.text} opacity="0.4" />
          <circle cx="40" cy="40" r="2.5" fill={palette.text} />
          <circle cx="40" cy="25" r="2" fill={palette.accent} />
        </g>
      );
    case 'S':
      return (
        <g>
          {baseCircle}
          <path
            d="M40 27 L47 44 L44 48 L36 48 L33 44 Z"
            fill="none"
            stroke={palette.text}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M40 32 L45 44 L35 44 Z" fill={palette.text} opacity="0.3" />
          <line x1="33" y1="44" x2="47" y2="44" stroke={palette.text} strokeWidth="1.5" />
        </g>
      );
    case 'R':
      return (
        <g>
          {baseCircle}
          <rect x="31" y="36" width="18" height="14" rx="1" fill="none" stroke={palette.text} strokeWidth="2.5" />
          <rect x="31" y="32" width="4" height="6" fill={palette.text} />
          <rect x="38" y="32" width="4" height="6" fill={palette.text} />
          <rect x="45" y="32" width="4" height="6" fill={palette.text} />
          <rect x="35" y="36" width="3" height="5" rx="1" fill={palette.fill} stroke={palette.text} strokeWidth="0.5" />
          <rect x="42" y="36" width="3" height="5" rx="1" fill={palette.fill} stroke={palette.text} strokeWidth="0.5" />
        </g>
      );
    case 'N':
      return (
        <g>
          {baseCircle}
          <path
            d="M34 50 L34 40 L36 36 L34 32 L38 28 L42 30 L44 28 L44 33 L48 36 L46 42 L46 50"
            fill="none"
            stroke={palette.text}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx="39" cy="33" r="1.5" fill={palette.text} />
        </g>
      );
    case 'P':
      return (
        <g>
          {baseCircle}
          <ellipse cx="40" cy="40" rx="8" ry="10" fill="none" stroke={palette.text} strokeWidth="2.5" />
          <line x1="40" y1="30" x2="40" y2="50" stroke={palette.text} strokeWidth="1.5" />
          <path d="M36 34 Q40 37 44 34" fill="none" stroke={palette.text} strokeWidth="1" />
          <path d="M36 46 Q40 43 44 46" fill="none" stroke={palette.text} strokeWidth="1" />
        </g>
      );
    default:
      return baseCircle;
  }
}

function renderWestern(type: PieceType, palette: WesternPiecePalette) {
  const base = (
    <>
      <ellipse cx="40" cy="63" rx="16" ry="5.5" fill={palette.accent} opacity="0.55" />
      <path d="M24 60 Q40 55 56 60 L54 64 Q40 67 26 64 Z" fill={palette.fill} stroke={palette.stroke} strokeWidth="2" />
    </>
  );

  switch (type) {
    case 'K':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          {base}
          <path d="M31 57 L31 41 L35 32 L45 32 L49 41 L49 57 Z" />
          <rect x="38.6" y="19" width="2.8" height="12" rx="1.2" fill={palette.stroke} stroke="none" />
          <rect x="35" y="22.8" width="10" height="2.8" rx="1.2" fill={palette.stroke} stroke="none" />
          <path d="M35 32 Q40 27 45 32" fill="none" />
        </g>
      );
    case 'M':
    case 'PM':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {base}
          <path d="M30 57 L32 42 L36 34 L44 34 L48 42 L50 57 Z" />
          <circle cx="28" cy="34" r="2.4" fill={palette.stroke} stroke="none" />
          <circle cx="36" cy="28" r="2.4" fill={palette.stroke} stroke="none" />
          <circle cx="44" cy="28" r="2.4" fill={palette.stroke} stroke="none" />
          <circle cx="52" cy="34" r="2.4" fill={palette.stroke} stroke="none" />
          {type === 'PM' && <circle cx="40" cy="23" r="3" fill={palette.accent} stroke="none" />}
        </g>
      );
    case 'S':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {base}
          <path d="M31 57 L32 44 L40 26 L48 44 L49 57 Z" />
          <path d="M40 30 L40 45" fill="none" />
          <path d="M36 39 Q40 43 44 39" fill="none" />
        </g>
      );
    case 'R':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {base}
          <path d="M29 57 L29 36 L51 36 L51 57 Z" />
          <rect x="29" y="30" width="5" height="7" />
          <rect x="37.5" y="30" width="5" height="7" />
          <rect x="46" y="30" width="5" height="7" />
        </g>
      );
    case 'N':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          {base}
          <path d="M31 57 L31 43 L35 31 L46 28 L50 36 L45 43 L48 57 Z" />
          <path d="M35 33 L40 39" fill="none" />
          <circle cx="41" cy="34" r="1.8" fill={palette.stroke} stroke="none" />
        </g>
      );
    case 'P':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {base}
          <circle cx="40" cy="34" r="8.5" />
          <path d="M33 57 L33 45 Q40 41 47 45 L47 57 Z" />
        </g>
      );
    default:
      return base;
  }
}

const PieceSVG = memo(function PieceSVG({ type, color, size, className, pieceStyleId }: PieceSVGProps) {
  const { pieceStyle } = usePieceStyle();
  const activePieceStyle = pieceStyleId ?? pieceStyle;
  const pieceSet = getPieceSetById(activePieceStyle);
  const traditionalId = useId().replace(/[:]/g, '');
  const traditionalAsset = pieceSet.renderer === 'traditional'
    ? renderTraditional(type, traditionalId, pieceSet.colors[color])
    : null;

  let content;
  if (pieceSet.renderer === 'western') {
    content = renderWestern(type, pieceSet.colors[color]);
  } else if (pieceSet.renderer === 'glyph') {
    content = renderGlyph(type, pieceSet.colors[color]);
  } else {
    content = traditionalAsset?.content;
  }

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

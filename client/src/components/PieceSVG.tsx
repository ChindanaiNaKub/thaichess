import { memo } from 'react';
import type { PieceType, PieceColor } from '@shared/types';
import { usePieceStyle } from '../lib/pieceStyle';

interface PieceSVGProps {
  type: PieceType;
  color: PieceColor;
  size?: number;
  className?: string;
}

function getClassicPalette(color: PieceColor) {
  return {
    fill: color === 'white' ? '#fff' : '#1a1a1a',
    stroke: color === 'white' ? '#333' : '#666',
    accent: color === 'white' ? '#e8c690' : '#555',
    text: color === 'white' ? '#333' : '#ccc',
    base: color === 'white' ? '#d4a76a' : '#2a2a2a',
  };
}

function getWesternPalette(color: PieceColor) {
  return {
    fill: color === 'white' ? '#fbfbfa' : '#232427',
    stroke: color === 'white' ? '#2c2d30' : '#d7d7d7',
    accent: color === 'white' ? '#d8c3a1' : '#4b4f57',
  };
}

function getTraditionalPalette(color: PieceColor) {
  return color === 'white'
    ? { fill: '#f5e7c6', stroke: '#5d4630', accent: '#d7b87a' }
    : { fill: '#d5483a', stroke: '#1a1412', accent: '#ffb16a' };
}

function renderClassic(type: PieceType, color: PieceColor) {
  const palette = getClassicPalette(color);

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
          <circle cx="40" cy="25" r="2" fill={color === 'white' ? '#cc3333' : '#cc6666'} />
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

function renderWestern(type: PieceType, color: PieceColor) {
  const palette = getWesternPalette(color);
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
          {type === 'PM' && <circle cx="40" cy="23" r="3" fill="#c04032" stroke="none" />}
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

function renderTraditional(type: PieceType, color: PieceColor) {
  const palette = getTraditionalPalette(color);
  const baseBoat = (
    <path
      d="M24 59 Q40 51 56 59 L54 65 Q40 68 26 65 Z"
      fill={palette.fill}
      stroke={palette.stroke}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  );

  switch (type) {
    case 'K':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {baseBoat}
          <path d="M31 58 L31 44 L35 35 L40 24 L45 35 L49 44 L49 58 Z" />
          <rect x="38.8" y="18" width="2.4" height="9" rx="1" fill={palette.stroke} stroke="none" />
          <circle cx="40" cy="17" r="2.3" fill={palette.accent} stroke="none" />
        </g>
      );
    case 'M':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {baseBoat}
          <path d="M33 58 L33 46 L36 37 L40 29 L44 37 L47 46 L47 58 Z" />
          <path d="M36 44 L44 44" fill="none" />
          <circle cx="40" cy="24" r="2.5" fill={palette.accent} stroke="none" />
        </g>
      );
    case 'PM':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          <circle cx="40" cy="44" r="13" fill={palette.fill} stroke={palette.stroke} />
          <circle cx="40" cy="44" r="8" fill="none" stroke={palette.accent} />
          <path d="M37 26 L40 20 L43 26 Z" fill={palette.accent} stroke={palette.stroke} />
        </g>
      );
    case 'S':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {baseBoat}
          <path d="M34 58 L34 45 L40 31 L46 45 L46 58 Z" />
          <path d="M37 39 L43 39" fill="none" />
          <path d="M40 23 L43 29 L37 29 Z" fill={palette.accent} stroke={palette.stroke} />
        </g>
      );
    case 'R':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          <path d="M22 57 L26 43 L54 43 L58 57 Q40 64 22 57 Z" />
          <path d="M28 43 L32 34 L48 34 L52 43" />
          <path d="M32 34 L32 29 L48 29 L48 34" />
        </g>
      );
    case 'N':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          {baseBoat}
          <path d="M31 58 L31 44 L36 31 L46 29 L50 38 L46 45 L48 58 Z" />
          <circle cx="41" cy="35" r="1.7" fill={palette.stroke} stroke="none" />
        </g>
      );
    case 'P':
      return (
        <g fill="none" stroke={palette.stroke} strokeWidth="2.2">
          <circle cx="40" cy="44" r="14" fill={palette.fill} />
          <circle cx="40" cy="44" r="10.2" stroke={palette.accent} />
          <circle cx="40" cy="44" r="6.4" stroke={palette.stroke} />
        </g>
      );
    default:
      return baseBoat;
  }
}

const PieceSVG = memo(function PieceSVG({ type, color, size, className }: PieceSVGProps) {
  const { pieceStyle } = usePieceStyle();

  const content =
    pieceStyle === 'western'
      ? renderWestern(type, color)
      : pieceStyle === 'traditional'
        ? renderTraditional(type, color)
        : renderClassic(type, color);

  return (
    <svg
      viewBox="0 0 80 80"
      {...(className
        ? { className }
        : { width: size ?? 80, height: size ?? 80 }
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      {content}
    </svg>
  );
});

export default PieceSVG;

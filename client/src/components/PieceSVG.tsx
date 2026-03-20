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
  const base = <path d="M24 60 Q40 55 56 60 L54 64 Q40 67 26 64 Z" fill={palette.fill} stroke={palette.stroke} strokeWidth="2" />;

  switch (type) {
    case 'K':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          {base}
          <path d="M31 57 L31 42 L35 33 L45 33 L49 42 L49 57 Z" />
          <rect x="38.6" y="19" width="2.8" height="12" rx="1.2" fill={palette.stroke} stroke="none" />
          <rect x="35" y="22.8" width="10" height="2.8" rx="1.2" fill={palette.stroke} stroke="none" />
          <path d="M33 42 Q40 36 47 42" fill="none" />
        </g>
      );
    case 'M':
    case 'PM':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {base}
          <path d="M30 57 L32 43 L34 37 L39 30 L44 30 L48 37 L50 43 L50 57 Z" />
          <circle cx="30" cy="35" r="2.2" fill={palette.stroke} stroke="none" />
          <circle cx="36" cy="28" r="2.2" fill={palette.stroke} stroke="none" />
          <circle cx="44" cy="28" r="2.2" fill={palette.stroke} stroke="none" />
          <circle cx="50" cy="35" r="2.2" fill={palette.stroke} stroke="none" />
          {type === 'PM' && <circle cx="40" cy="23" r="3" fill="#c04032" stroke="none" />}
        </g>
      );
    case 'S':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {base}
          <path d="M31 57 L33 45 L40 27 L47 45 L49 57 Z" />
          <path d="M40 30 C36 34 36 42 40 46 C44 42 44 34 40 30 Z" fill="none" />
          <circle cx="40" cy="24" r="2.3" fill={palette.stroke} stroke="none" />
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
          <path d="M31 57 L31 44 L35 32 L46 28 L50 36 L46 44 L48 57 Z" />
          <path d="M35 35 Q39 31 44 33" fill="none" />
          <circle cx="42" cy="34" r="1.8" fill={palette.stroke} stroke="none" />
        </g>
      );
    case 'P':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {base}
          <circle cx="40" cy="34" r="8.5" />
          <path d="M33 57 L33 46 Q40 42 47 46 L47 57 Z" />
        </g>
      );
    default:
      return base;
  }
}

function renderTraditional(type: PieceType, color: PieceColor) {
  const palette = getTraditionalPalette(color);
  const baseBoat = <path d="M24 60 Q40 53 56 60 L54 64 Q40 67 26 64 Z" fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round" />;

  switch (type) {
    case 'K':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {baseBoat}
          <path d="M31 58 L31 47 L35 39 L40 26 L45 39 L49 47 L49 58 Z" />
          <path d="M36 40 L44 40" fill="none" />
          <path d="M38.5 18 L41.5 18 L41 27 L39 27 Z" fill={palette.accent} stroke={palette.stroke} />
        </g>
      );
    case 'M':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {baseBoat}
          <path d="M33 58 L33 47 L36 40 L40 32 L44 40 L47 47 L47 58 Z" />
          <path d="M37 39 L43 39" fill="none" />
          <path d="M38 24 L42 24 L41 31 L39 31 Z" fill={palette.accent} stroke={palette.stroke} />
        </g>
      );
    case 'PM':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          <path d="M28 58 Q40 48 52 58 L50 63 Q40 66 30 63 Z" />
          <circle cx="40" cy="45" r="10.5" fill={palette.fill} stroke={palette.stroke} />
          <circle cx="40" cy="45" r="6.8" fill="none" stroke={palette.accent} />
          <path d="M37 28 L40 22 L43 28 Z" fill={palette.accent} stroke={palette.stroke} />
        </g>
      );
    case 'S':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          {baseBoat}
          <path d="M34 58 L34 46 L40 34 L46 46 L46 58 Z" />
          <path d="M38 24 L40 18 L42 24 Z" fill={palette.accent} stroke={palette.stroke} />
          <path d="M37 39 L43 39" fill="none" />
        </g>
      );
    case 'R':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round">
          <path d="M22 58 L26 44 L54 44 L58 58 Q40 65 22 58 Z" />
          <path d="M28 44 L31 33 L49 33 L52 44" />
          <path d="M31 33 L31 27 L49 27 L49 33" />
        </g>
      );
    case 'N':
      return (
        <g fill={palette.fill} stroke={palette.stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          {baseBoat}
          <path d="M31 58 L31 45 L35 33 L45 28 L49 37 L45 45 L48 58 Z" />
          <circle cx="41" cy="34" r="1.7" fill={palette.stroke} stroke="none" />
        </g>
      );
    case 'P':
      return (
        <g fill="none" stroke={palette.stroke} strokeWidth="2.2">
          <circle cx="40" cy="45" r="13.5" fill={palette.fill} />
          <circle cx="40" cy="45" r="9.8" stroke={palette.accent} />
          <circle cx="40" cy="45" r="6.1" stroke={palette.stroke} />
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

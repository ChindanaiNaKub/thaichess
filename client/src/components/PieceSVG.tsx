import type { PieceType, PieceColor } from '@shared/types';

interface PieceSVGProps {
  type: PieceType;
  color: PieceColor;
  size?: number;
  className?: string;
}

export default function PieceSVG({ type, color, size, className }: PieceSVGProps) {
  const fill = color === 'white' ? '#fff' : '#1a1a1a';
  const stroke = color === 'white' ? '#333' : '#666';
  const accent = color === 'white' ? '#e8c690' : '#555';
  const textColor = color === 'white' ? '#333' : '#ccc';

  const baseCircle = (
    <>
      <circle cx="40" cy="42" r="30" fill={color === 'white' ? '#d4a76a' : '#2a2a2a'} opacity="0.5" />
      <circle cx="40" cy="40" r="30" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <circle cx="40" cy="40" r="25" fill="none" stroke={accent} strokeWidth="1" opacity="0.6" />
    </>
  );

  const renderPiece = () => {
    switch (type) {
      case 'K': // Khun - King
        return (
          <g>
            {baseCircle}
            {/* Crown */}
            <path
              d="M28 45 L28 38 L32 42 L36 34 L40 40 L44 34 L48 42 L52 38 L52 45 Z"
              fill={textColor}
              stroke={textColor}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <rect x="29" y="45" width="22" height="3" rx="1" fill={textColor} />
            {/* Cross on top */}
            <rect x="38.5" y="28" width="3" height="8" rx="1" fill={textColor} />
            <rect x="36" y="30.5" width="8" height="3" rx="1" fill={textColor} />
          </g>
        );

      case 'M': // Met - Queen (moves 1 diag)
        return (
          <g>
            {baseCircle}
            {/* Tiered diamond/gem shape */}
            <path
              d="M40 28 L49 40 L40 52 L31 40 Z"
              fill="none"
              stroke={textColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M40 33 L46 40 L40 47 L34 40 Z"
              fill={textColor}
              opacity="0.4"
            />
            <circle cx="40" cy="40" r="2.5" fill={textColor} />
          </g>
        );

      case 'PM': // Promoted Pawn (Bia Ngai) - same as Met but with marker
        return (
          <g>
            {baseCircle}
            <path
              d="M40 28 L49 40 L40 52 L31 40 Z"
              fill="none"
              stroke={textColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M40 33 L46 40 L40 47 L34 40 Z"
              fill={textColor}
              opacity="0.4"
            />
            <circle cx="40" cy="40" r="2.5" fill={textColor} />
            {/* Promotion mark - small circle at top */}
            <circle cx="40" cy="25" r="2" fill={color === 'white' ? '#cc3333' : '#cc6666'} />
          </g>
        );

      case 'S': // Khon - Bishop/Silver General
        return (
          <g>
            {baseCircle}
            {/* Temple spire / pointed shape */}
            <path
              d="M40 27 L47 44 L44 48 L36 48 L33 44 Z"
              fill="none"
              stroke={textColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M40 32 L45 44 L35 44 Z"
              fill={textColor}
              opacity="0.3"
            />
            <line x1="33" y1="44" x2="47" y2="44" stroke={textColor} strokeWidth="1.5" />
          </g>
        );

      case 'R': // Rua - Rook
        return (
          <g>
            {baseCircle}
            {/* Castle tower */}
            <rect x="31" y="36" width="18" height="14" rx="1" fill="none" stroke={textColor} strokeWidth="2.5" />
            <rect x="31" y="32" width="4" height="6" fill={textColor} />
            <rect x="38" y="32" width="4" height="6" fill={textColor} />
            <rect x="45" y="32" width="4" height="6" fill={textColor} />
            <rect x="35" y="36" width="3" height="5" rx="1" fill={fill} stroke={textColor} strokeWidth="0.5" />
            <rect x="42" y="36" width="3" height="5" rx="1" fill={fill} stroke={textColor} strokeWidth="0.5" />
          </g>
        );

      case 'N': // Ma - Knight
        return (
          <g>
            {baseCircle}
            {/* Horse head */}
            <path
              d="M34 50 L34 40 L36 36 L34 32 L38 28 L42 30 L44 28 L44 33 L48 36 L46 42 L46 50"
              fill="none"
              stroke={textColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Eye */}
            <circle cx="39" cy="33" r="1.5" fill={textColor} />
          </g>
        );

      case 'P': // Bia - Pawn
        return (
          <g>
            {baseCircle}
            {/* Shell/cowrie shape */}
            <ellipse cx="40" cy="40" rx="8" ry="10" fill="none" stroke={textColor} strokeWidth="2.5" />
            <line x1="40" y1="30" x2="40" y2="50" stroke={textColor} strokeWidth="1.5" />
            <path
              d="M36 34 Q40 37 44 34"
              fill="none"
              stroke={textColor}
              strokeWidth="1"
            />
            <path
              d="M36 46 Q40 43 44 46"
              fill="none"
              stroke={textColor}
              strokeWidth="1"
            />
          </g>
        );

      default:
        return baseCircle;
    }
  };

  return (
    <svg
      viewBox="0 0 80 80"
      {...(className
        ? { className }
        : { width: size ?? 80, height: size ?? 80 }
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderPiece()}
    </svg>
  );
}

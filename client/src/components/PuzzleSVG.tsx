import { memo } from 'react';
import { MakrukChromeIcon } from './MakrukChromeIcon';

interface ChromeIconProps {
  size?: number;
  className?: string;
}

/** Concentric rings — puzzle (echo Bia) */
const PuzzleSVG = memo(function PuzzleSVG({ size = 80, className }: ChromeIconProps) {
  return (
    <MakrukChromeIcon size={size} className={className}>
      <circle cx="40" cy="40" r="22" />
      <circle cx="40" cy="40" r="12" />
      <path d="M40 18 v8" />
    </MakrukChromeIcon>
  );
});

export default PuzzleSVG;

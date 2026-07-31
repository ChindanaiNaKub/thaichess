import { memo } from 'react';
import { MakrukChromeIcon } from './MakrukChromeIcon';

interface ChromeIconProps {
  size?: number;
  className?: string;
}

/** Play triangle — quick play / watch */
const QuickPlaySVG = memo(function QuickPlaySVG({ size = 80, className }: ChromeIconProps) {
  return (
    <MakrukChromeIcon size={size} className={className}>
      <path d="M30 22 L58 40 L30 58 Z" />
    </MakrukChromeIcon>
  );
});

export default QuickPlaySVG;

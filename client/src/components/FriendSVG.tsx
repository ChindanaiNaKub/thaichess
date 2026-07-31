import { memo } from 'react';
import { MakrukChromeIcon } from './MakrukChromeIcon';

interface ChromeIconProps {
  size?: number;
  className?: string;
}

/** Two linked circles — friend (Bia family geometry) */
const FriendSVG = memo(function FriendSVG({ size = 80, className }: ChromeIconProps) {
  return (
    <MakrukChromeIcon size={size} className={className}>
      <circle cx="28" cy="40" r="14" />
      <circle cx="52" cy="40" r="14" />
    </MakrukChromeIcon>
  );
});

export default FriendSVG;

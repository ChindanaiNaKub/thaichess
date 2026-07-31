import { memo } from 'react';
import { MakrukChromeIcon, MAKRUK_CHROME_STROKE } from './MakrukChromeIcon';

interface ChromeIconProps {
  size?: number;
  className?: string;
}

/** Rounded head — bot */
const BotSVG = memo(function BotSVG({ size = 80, className }: ChromeIconProps) {
  return (
    <MakrukChromeIcon size={size} className={className}>
      <rect
        x="22"
        y="28"
        width="36"
        height="30"
        rx={MAKRUK_CHROME_STROKE}
        ry={MAKRUK_CHROME_STROKE}
      />
      <circle cx="32" cy="42" r="3" fill="currentColor" stroke="none" />
      <circle cx="48" cy="42" r="3" fill="currentColor" stroke="none" />
      <path d="M40 18 v10" />
    </MakrukChromeIcon>
  );
});

export default BotSVG;

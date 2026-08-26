import type { ReactNode } from 'react';
import { MAKRUK_CHROME_STROKE } from '../lib/makrukStroke';

export interface MakrukChromeIconProps {
  size?: number;
  className?: string;
  children: ReactNode;
}

/** Shared SVG shell for Bia-family chrome icons (ADR 0002). */
export function MakrukChromeIcon({
  size = 80,
  className,
  children,
}: MakrukChromeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 80 80`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g
        stroke="currentColor"
        strokeWidth={MAKRUK_CHROME_STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </svg>
  );
}

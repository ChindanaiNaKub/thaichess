import type { PieceColor, PieceType } from '@shared/types';
import { vi } from 'vitest';
import type { PieceStyle } from '../lib/pieceStyle';
import { render } from './utils';
import PieceSVG from '../components/PieceSVG';

const pieceStyleState = vi.hoisted(() => ({
  current: 'traditional' as PieceStyle,
}));

vi.mock('../lib/pieceStyle', () => ({
  usePieceStyle: () => ({
    pieceStyle: pieceStyleState.current,
    setPieceStyle: vi.fn(),
  }),
}));

vi.mock('../assets/pieces/traditional/Bia_black.svg?raw', () => ({
  default: '<svg viewBox="0 0 360 360"><circle cx="180" cy="180" r="100" stroke="#14110F" stroke-width="20" fill="none" /><circle cx="180" cy="180" r="60" stroke="#14110F" stroke-width="20" fill="none" /><circle cx="180" cy="180" r="20" fill="#14110F" /></svg>',
}));
vi.mock('../assets/pieces/traditional/Biangai_black.svg?raw', () => ({
  default: '<svg viewBox="0 0 360 360"><circle cx="180" cy="180" r="100" stroke="#14110F" stroke-width="20" fill="none" /><circle cx="180" cy="180" r="60" fill="#14110F" /></svg>',
}));
vi.mock('../assets/pieces/traditional/Khon_black.svg?raw', () => ({
  default: '<svg viewBox="0 0 480 480"><g fill="#000000" stroke="none"><path d="M10 10 L470 10 L470 470 L10 470 Z" /></g></svg>',
}));
vi.mock('../assets/pieces/traditional/Khun_black.svg?raw', () => ({
  default: '<svg viewBox="0 0 480 480"><g fill="#000000" stroke="none"><path d="M20 20 L460 20 L460 460 L20 460 Z" /></g></svg>',
}));
vi.mock('../assets/pieces/traditional/Ma_black.svg?raw', () => ({
  default: '<svg viewBox="0 0 480 480"><g fill="#000000" stroke="none"><path d="M30 30 L450 30 L450 450 L30 450 Z" /></g></svg>',
}));
vi.mock('../assets/pieces/traditional/Met_black.svg?raw', () => ({
  default: '<svg viewBox="0 0 480 480"><g fill="#000000" stroke="none"><path d="M40 40 L440 40 L440 440 L40 440 Z" /></g></svg>',
}));
vi.mock('../assets/pieces/traditional/Ruea_black.svg?raw', () => ({
  default: '<svg viewBox="0 0 480 480"><g fill="#000000" stroke="none"><path d="M50 50 L430 50 L430 430 L50 430 Z" /></g></svg>',
}));

describe('PieceSVG', () => {
  beforeEach(() => {
    pieceStyleState.current = 'traditional';
  });

  it('renders traditional Makruk pieces from inline black SVG sources for both colors', () => {
    const cases: Array<{ type: PieceType; color: PieceColor; fill: string; stroke: string }> = [
      { type: 'K', color: 'white', fill: '#f2eadb', stroke: '#5f5245' },
      { type: 'K', color: 'black', fill: '#22252a', stroke: '#111111' },
      { type: 'M', color: 'white', fill: '#f2eadb', stroke: '#5f5245' },
      { type: 'M', color: 'black', fill: '#22252a', stroke: '#111111' },
      { type: 'S', color: 'white', fill: '#f2eadb', stroke: '#5f5245' },
      { type: 'S', color: 'black', fill: '#22252a', stroke: '#111111' },
      { type: 'R', color: 'white', fill: '#f2eadb', stroke: '#5f5245' },
      { type: 'R', color: 'black', fill: '#22252a', stroke: '#111111' },
      { type: 'N', color: 'white', fill: '#f2eadb', stroke: '#5f5245' },
      { type: 'N', color: 'black', fill: '#22252a', stroke: '#111111' },
      { type: 'P', color: 'white', fill: '#f2eadb', stroke: '#5f5245' },
      { type: 'P', color: 'black', fill: '#22252a', stroke: '#111111' },
      { type: 'PM', color: 'white', fill: '#f2eadb', stroke: '#5f5245' },
      { type: 'PM', color: 'black', fill: '#22252a', stroke: '#111111' },
    ];

    for (const { type, color, fill, stroke } of cases) {
      const { container, unmount } = render(<PieceSVG type={type} color={color} />);

      expect(container.querySelector('image')).not.toBeInTheDocument();
      expect(container.querySelector('linearGradient')).toBeInTheDocument();
      expect(container.querySelector('filter')).toBeInTheDocument();
      expect(container.querySelector('path, circle')).toBeInTheDocument();
      expect(container.innerHTML.toLowerCase()).toContain(fill);
      expect(container.innerHTML.toLowerCase()).toContain(stroke);

      unmount();
    }
  });

  it('keeps traditional white pawns solid by rendering an opaque base shape', () => {
    const { container } = render(<PieceSVG type="P" color="white" />);

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
    expect(circles[0]?.getAttribute('fill') ?? '').toContain('url(#traditional-fill-');
    expect(container.innerHTML.toLowerCase()).toContain('#f2eadb');
  });

  it('keeps classic pieces rendered as inline SVG shapes', () => {
    pieceStyleState.current = 'classic';

    const { container } = render(<PieceSVG type="K" color="white" />);

    expect(container.querySelector('image')).not.toBeInTheDocument();
    expect(container.querySelector('path, circle, rect, ellipse')).toBeInTheDocument();
  });
});

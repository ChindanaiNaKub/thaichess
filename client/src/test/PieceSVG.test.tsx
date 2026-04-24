import type { PieceColor, PieceType } from '@shared/types';
import { vi } from 'vitest';
import { render } from './utils';
import PieceSVG from '../components/PieceSVG';

const pieceStyleState = {
  pieceThemeId: 'classic-ivory-ink',
};

vi.mock('../lib/pieceStyle', async () => {
  const actual = await vi.importActual<typeof import('../lib/pieceStyle')>('../lib/pieceStyle');

  return {
    ...actual,
    useBoardAppearance: () => pieceStyleState,
  };
});

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
  it('renders traditional Makruk pieces from inline black SVG sources for both colors', () => {
    pieceStyleState.pieceThemeId = 'classic-ivory-ink';

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
    pieceStyleState.pieceThemeId = 'classic-ivory-ink';

    const { container } = render(<PieceSVG type="P" color="white" />);

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
    expect(circles[0]?.getAttribute('fill') ?? '').toContain('url(#traditional-fill-');
    expect(container.innerHTML.toLowerCase()).toContain('#f2eadb');
  });

  it('renders promoted pawns with a dedicated promoted-pawn silhouette', () => {
    pieceStyleState.pieceThemeId = 'classic-ivory-ink';

    const { container } = render(<PieceSVG type="PM" color="white" />);

    const circles = container.querySelectorAll('circle');
    expect(container.querySelector('path')).not.toBeInTheDocument();
    expect(circles).toHaveLength(2);
    expect(circles[0]?.getAttribute('r')).toBe('100');
    expect(circles[1]?.getAttribute('r')).toBe('60');
    expect(container.querySelector('[data-promoted-bia-marker="true"]')).not.toBeInTheDocument();
    expect(container.innerHTML.toLowerCase()).toContain('#f2eadb');
    expect(container.innerHTML.toLowerCase()).toContain('#5f5245');
  });

  it('renders promoted bia differently from both normal pawns and normal Mets', () => {
    pieceStyleState.pieceThemeId = 'classic-ivory-ink';

    for (const color of ['white', 'black'] as const) {
      const { container: metContainer } = render(<PieceSVG type="M" color={color} />);
      const { container: promotedContainer } = render(<PieceSVG type="PM" color={color} />);
      const { container: pawnContainer } = render(<PieceSVG type="P" color={color} />);
      const promotedCircles = promotedContainer.querySelectorAll('circle');
      const pawnCircles = pawnContainer.querySelectorAll('circle');

      expect(metContainer.querySelector('path')).toBeInTheDocument();
      expect(promotedContainer.querySelector('path')).not.toBeInTheDocument();
      expect(promotedCircles).toHaveLength(2);
      expect(pawnCircles).toHaveLength(4);
      expect(promotedCircles[0]?.getAttribute('r')).toBe('100');
      expect(promotedCircles[1]?.getAttribute('r')).toBe('60');
      expect(pawnCircles[2]?.getAttribute('r')).toBe('60');
      expect(pawnCircles[3]?.getAttribute('r')).toBe('20');
    }
  });

  it('renders non-default theme ids as distinct sprite-backed image assets', () => {
    pieceStyleState.pieceThemeId = 'gold-ebony';

    const { container } = render(<PieceSVG type="K" color="white" />);

    const image = container.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image?.getAttribute('src')).toContain('Khun_white');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container.querySelector('linearGradient')).not.toBeInTheDocument();
  });

  it('renders sprite-backed Makruk themes as image assets', () => {
    pieceStyleState.pieceThemeId = 'temple-lacquer';

    const { container } = render(<PieceSVG type="K" color="white" />);

    const image = container.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image?.getAttribute('src')).toContain('Khun_white');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container.querySelector('linearGradient')).not.toBeInTheDocument();
  });
});

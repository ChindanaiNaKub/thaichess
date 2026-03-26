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

vi.mock('../assets/pieces/traditional/Bia_black.svg', () => ({ default: 'Bia_black.svg' }));
vi.mock('../assets/pieces/traditional/Bia_white.svg', () => ({ default: 'Bia_white.svg' }));
vi.mock('../assets/pieces/traditional/Biangai_black.svg', () => ({ default: 'Biangai_black.svg' }));
vi.mock('../assets/pieces/traditional/Biangai_white.svg', () => ({ default: 'Biangai_white.svg' }));
vi.mock('../assets/pieces/traditional/Khon_black.svg', () => ({ default: 'Khon_black.svg' }));
vi.mock('../assets/pieces/traditional/Khon_white.svg', () => ({ default: 'Khon_white.svg' }));
vi.mock('../assets/pieces/traditional/Khun_black.svg', () => ({ default: 'Khun_black.svg' }));
vi.mock('../assets/pieces/traditional/Khun_white.svg', () => ({ default: 'Khun_white.svg' }));
vi.mock('../assets/pieces/traditional/Ma_black.svg', () => ({ default: 'Ma_black.svg' }));
vi.mock('../assets/pieces/traditional/Ma_white.svg', () => ({ default: 'Ma_white.svg' }));
vi.mock('../assets/pieces/traditional/Met_black.svg', () => ({ default: 'Met_black.svg' }));
vi.mock('../assets/pieces/traditional/Met_white.svg', () => ({ default: 'Met_white.svg' }));
vi.mock('../assets/pieces/traditional/Ruea_black.svg', () => ({ default: 'Ruea_black.svg' }));
vi.mock('../assets/pieces/traditional/Ruea_white.svg', () => ({ default: 'Ruea_white.svg' }));

describe('PieceSVG', () => {
  beforeEach(() => {
    pieceStyleState.current = 'traditional';
  });

  it('renders the uploaded Makruk SVG asset for every traditional piece', () => {
    const cases: Array<{ type: PieceType; color: PieceColor; fileName: string }> = [
      { type: 'K', color: 'white', fileName: 'Khun_white.svg' },
      { type: 'K', color: 'black', fileName: 'Khun_black.svg' },
      { type: 'M', color: 'white', fileName: 'Met_white.svg' },
      { type: 'M', color: 'black', fileName: 'Met_black.svg' },
      { type: 'S', color: 'white', fileName: 'Khon_white.svg' },
      { type: 'S', color: 'black', fileName: 'Khon_black.svg' },
      { type: 'R', color: 'white', fileName: 'Ruea_white.svg' },
      { type: 'R', color: 'black', fileName: 'Ruea_black.svg' },
      { type: 'N', color: 'white', fileName: 'Ma_white.svg' },
      { type: 'N', color: 'black', fileName: 'Ma_black.svg' },
      { type: 'P', color: 'white', fileName: 'Bia_white.svg' },
      { type: 'P', color: 'black', fileName: 'Bia_black.svg' },
      { type: 'PM', color: 'white', fileName: 'Biangai_white.svg' },
      { type: 'PM', color: 'black', fileName: 'Biangai_black.svg' },
    ];

    for (const { type, color, fileName } of cases) {
      const { container, unmount } = render(<PieceSVG type={type} color={color} />);

      const image = container.querySelector('image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('href');
      expect(image?.getAttribute('href')).toContain(fileName);

      unmount();
    }
  });

  it('keeps classic pieces rendered as inline SVG shapes', () => {
    pieceStyleState.current = 'classic';

    const { container } = render(<PieceSVG type="K" color="white" />);

    expect(container.querySelector('image')).not.toBeInTheDocument();
    expect(container.querySelector('path, circle, rect, ellipse')).toBeInTheDocument();
  });
});

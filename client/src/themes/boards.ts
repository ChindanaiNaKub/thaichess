export type BoardThemeId =
  | 'classic-wood'
  | 'rosewood'
  | 'jade-grove'
  | 'riverstone'
  | 'midnight-blue'
  | 'silk-orchid'
  | 'sandstone'
  | 'monsoon';

export interface BoardThemeConfig {
  id: BoardThemeId;
  label: string;
  description: string;
  lightBackground: string;
  darkBackground: string;
  lightCoordinate: string;
  darkCoordinate: string;
  frameBackground: string;
}

export const BOARD_THEMES: BoardThemeConfig[] = [
  {
    id: 'classic-wood',
    label: 'Classic Wood',
    description: 'Warm tournament wood with subtle grain.',
    lightBackground: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent 62%), #f0d8b6',
    darkBackground: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 68%), #b8895c',
    lightCoordinate: '#8a5d34',
    darkCoordinate: '#f6e6c8',
    frameBackground: 'linear-gradient(180deg, rgba(120,85,45,0.4), rgba(48,33,21,0.56))',
  },
  {
    id: 'rosewood',
    label: 'Rosewood',
    description: 'Rich red-brown squares with lacquered depth.',
    lightBackground: 'linear-gradient(135deg, rgba(255,255,255,0.10), transparent 58%), #ecd3c7',
    darkBackground: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 64%), #7d4b45',
    lightCoordinate: '#7a443c',
    darkCoordinate: '#f4ded3',
    frameBackground: 'linear-gradient(180deg, rgba(111,57,49,0.46), rgba(43,22,21,0.62))',
  },
  {
    id: 'jade-grove',
    label: 'Jade Grove',
    description: 'Calm green tones inspired by lacquer and stone.',
    lightBackground: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent 60%), #dfe9d9',
    darkBackground: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 68%), #4f6d57',
    lightCoordinate: '#426049',
    darkCoordinate: '#edf7eb',
    frameBackground: 'linear-gradient(180deg, rgba(56,86,65,0.42), rgba(23,36,29,0.62))',
  },
  {
    id: 'riverstone',
    label: 'Riverstone',
    description: 'Cool stone greys with a soft carved finish.',
    lightBackground: 'linear-gradient(135deg, rgba(255,255,255,0.16), transparent 62%), #d8dee4',
    darkBackground: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 66%), #6f7f92',
    lightCoordinate: '#5a6a7a',
    darkCoordinate: '#edf3fa',
    frameBackground: 'linear-gradient(180deg, rgba(82,94,112,0.44), rgba(28,34,43,0.62))',
  },
  {
    id: 'midnight-blue',
    label: 'Midnight Blue',
    description: 'Deep navy contrast with bright icy files.',
    lightBackground: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent 64%), #d5e3f2',
    darkBackground: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 68%), #334863',
    lightCoordinate: '#4a6079',
    darkCoordinate: '#eef6ff',
    frameBackground: 'linear-gradient(180deg, rgba(43,63,90,0.46), rgba(17,25,39,0.64))',
  },
  {
    id: 'silk-orchid',
    label: 'Silk Orchid',
    description: 'Soft silk neutrals with a muted plum contrast.',
    lightBackground: 'linear-gradient(135deg, rgba(255,255,255,0.18), transparent 60%), #efe4e7',
    darkBackground: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 66%), #7f6b7a',
    lightCoordinate: '#75606f',
    darkCoordinate: '#fff1f9',
    frameBackground: 'linear-gradient(180deg, rgba(103,82,96,0.42), rgba(42,31,40,0.62))',
  },
  {
    id: 'sandstone',
    label: 'Sandstone',
    description: 'Sunlit tan stone with desert warmth.',
    lightBackground: 'linear-gradient(135deg, rgba(255,255,255,0.14), transparent 62%), #f3dfb9',
    darkBackground: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 68%), #b77f43',
    lightCoordinate: '#8f5f2e',
    darkCoordinate: '#fff0d6',
    frameBackground: 'linear-gradient(180deg, rgba(138,94,43,0.4), rgba(56,36,18,0.62))',
  },
  {
    id: 'monsoon',
    label: 'Monsoon',
    description: 'Stormy graphite with cool silver highlights.',
    lightBackground: 'linear-gradient(135deg, rgba(255,255,255,0.18), transparent 60%), #dbdde2',
    darkBackground: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 68%), #4e535d',
    lightCoordinate: '#555a65',
    darkCoordinate: '#f5f7fb',
    frameBackground: 'linear-gradient(180deg, rgba(77,83,92,0.42), rgba(25,27,31,0.66))',
  },
];

export const DEFAULT_BOARD_THEME_ID: BoardThemeId = 'classic-wood';

export function getBoardThemeById(id: string | null | undefined): BoardThemeConfig {
  return BOARD_THEMES.find((theme) => theme.id === id) ?? BOARD_THEMES[0];
}

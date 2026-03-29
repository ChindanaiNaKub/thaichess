import type { PieceColor } from '@shared/types';

export type PieceThemeId =
  | 'classic-ivory-ink'
  | 'obsidian-pearl'
  | 'gold-ebony'
  | 'jade-bone'
  | 'crimson-sand';

export interface TraditionalPiecePalette {
  fillTop: string;
  fillBase: string;
  fillBottom: string;
  stroke: string;
  shadow: string;
  promotedDot: string;
}

export interface PieceThemeConfig {
  id: PieceThemeId;
  label: string;
  description: string;
  colors: Record<PieceColor, TraditionalPiecePalette>;
}

export const CORE_PIECE_SHAPE_LABEL = 'Makruk Classic';

export const PIECE_THEMES: PieceThemeConfig[] = [
  {
    id: 'classic-ivory-ink',
    label: 'Classic Ivory & Ink',
    description: 'The clearest traditional Makruk look with warm ivory against charcoal ink.',
    colors: {
      white: {
        fillTop: '#faf2e4',
        fillBase: '#f2eadb',
        fillBottom: '#ddccb1',
        stroke: '#5f5245',
        shadow: 'rgba(79, 61, 41, 0.16)',
        promotedDot: '#cc3333',
      },
      black: {
        fillTop: '#393d45',
        fillBase: '#22252a',
        fillBottom: '#191b20',
        stroke: '#111111',
        shadow: 'rgba(0, 0, 0, 0.18)',
        promotedDot: '#cc6666',
      },
    },
  },
  {
    id: 'obsidian-pearl',
    label: 'Obsidian & Pearl',
    description: 'Strong contrast with bright pearl whites and deep lacquered blacks.',
    colors: {
      white: {
        fillTop: '#fffaf1',
        fillBase: '#f7ecda',
        fillBottom: '#ddc9ab',
        stroke: '#67533a',
        shadow: 'rgba(78, 60, 37, 0.18)',
        promotedDot: '#bf3d35',
      },
      black: {
        fillTop: '#4a5058',
        fillBase: '#262b33',
        fillBottom: '#0f1217',
        stroke: '#07090d',
        shadow: 'rgba(0, 0, 0, 0.24)',
        promotedDot: '#d87366',
      },
    },
  },
  {
    id: 'gold-ebony',
    label: 'Gold & Ebony',
    description: 'Readable gilded highlights without sacrificing silhouette clarity.',
    colors: {
      white: {
        fillTop: '#fff3d7',
        fillBase: '#f1d9a5',
        fillBottom: '#c9a15a',
        stroke: '#6a4d1d',
        shadow: 'rgba(101, 70, 20, 0.2)',
        promotedDot: '#b03628',
      },
      black: {
        fillTop: '#46403c',
        fillBase: '#231d1a',
        fillBottom: '#100d0b',
        stroke: '#050505',
        shadow: 'rgba(0, 0, 0, 0.26)',
        promotedDot: '#d39e54',
      },
    },
  },
  {
    id: 'jade-bone',
    label: 'Jade & Bone',
    description: 'Cool green-black against soft bone for quick recognition on modern boards.',
    colors: {
      white: {
        fillTop: '#f8f2e6',
        fillBase: '#ece2cf',
        fillBottom: '#d2bea1',
        stroke: '#665545',
        shadow: 'rgba(84, 68, 48, 0.18)',
        promotedDot: '#b14d45',
      },
      black: {
        fillTop: '#426158',
        fillBase: '#243b35',
        fillBottom: '#10211c',
        stroke: '#08120f',
        shadow: 'rgba(0, 0, 0, 0.24)',
        promotedDot: '#6cb88b',
      },
    },
  },
  {
    id: 'crimson-sand',
    label: 'Crimson & Sand',
    description: 'A warmer, more dramatic pair that stays legible in fast play.',
    colors: {
      white: {
        fillTop: '#fff2df',
        fillBase: '#efd7b4',
        fillBottom: '#cfa36d',
        stroke: '#745130',
        shadow: 'rgba(94, 64, 26, 0.2)',
        promotedDot: '#bd3a32',
      },
      black: {
        fillTop: '#6f3439',
        fillBase: '#4b1f24',
        fillBottom: '#251013',
        stroke: '#130609',
        shadow: 'rgba(0, 0, 0, 0.24)',
        promotedDot: '#de9f72',
      },
    },
  },
];

export const DEFAULT_PIECE_THEME_ID: PieceThemeId = 'classic-ivory-ink';

export function getPieceThemeById(id: string | null | undefined): PieceThemeConfig {
  return PIECE_THEMES.find((theme) => theme.id === id) ?? PIECE_THEMES[0];
}

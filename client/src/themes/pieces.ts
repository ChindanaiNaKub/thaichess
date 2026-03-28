import type { PieceColor } from '@shared/types';

export type PieceStyle = 'classic' | 'western' | 'glyph' | 'ivory' | 'obsidian';
export type PieceRenderer = 'traditional' | 'western' | 'glyph';

export interface TraditionalPiecePalette {
  fillTop: string;
  fillBase: string;
  fillBottom: string;
  stroke: string;
  shadow: string;
  promotedDot: string;
}

export interface WesternPiecePalette {
  fill: string;
  stroke: string;
  accent: string;
}

export interface GlyphPiecePalette extends WesternPiecePalette {
  text: string;
  base: string;
}

type PieceSetBase = {
  id: PieceStyle;
  label: string;
  description: string;
};

type TraditionalPieceSet = PieceSetBase & {
  renderer: 'traditional';
  colors: Record<PieceColor, TraditionalPiecePalette>;
};

type WesternPieceSet = PieceSetBase & {
  renderer: 'western';
  colors: Record<PieceColor, WesternPiecePalette>;
};

type GlyphPieceSet = PieceSetBase & {
  renderer: 'glyph';
  colors: Record<PieceColor, GlyphPiecePalette>;
};

export type PieceSetConfig = TraditionalPieceSet | WesternPieceSet | GlyphPieceSet;

export const PIECE_SETS: PieceSetConfig[] = [
  {
    id: 'classic',
    label: 'Makruk Classic',
    description: 'Traditional Thai silhouettes with warm ivory and ink.',
    renderer: 'traditional',
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
    id: 'obsidian',
    label: 'Makruk Obsidian',
    description: 'A darker lacquered traditional set with stronger contrast.',
    renderer: 'traditional',
    colors: {
      white: {
        fillTop: '#fff6ea',
        fillBase: '#f3e4cf',
        fillBottom: '#d4b791',
        stroke: '#5f4528',
        shadow: 'rgba(66, 42, 21, 0.18)',
        promotedDot: '#b63d1c',
      },
      black: {
        fillTop: '#434854',
        fillBase: '#272b33',
        fillBottom: '#12151b',
        stroke: '#0b0d11',
        shadow: 'rgba(0, 0, 0, 0.24)',
        promotedDot: '#d17b5f',
      },
    },
  },
  {
    id: 'western',
    label: 'Tournament',
    description: 'Clean competitive western pieces with crisp outlines.',
    renderer: 'western',
    colors: {
      white: {
        fill: '#fbfbfa',
        stroke: '#2c2d30',
        accent: '#d8c3a1',
      },
      black: {
        fill: '#232427',
        stroke: '#d7d7d7',
        accent: '#4b4f57',
      },
    },
  },
  {
    id: 'ivory',
    label: 'Ivory Hall',
    description: 'Cream and gilt western pieces with a softer finish.',
    renderer: 'western',
    colors: {
      white: {
        fill: '#fff8ee',
        stroke: '#6f5430',
        accent: '#d8b46f',
      },
      black: {
        fill: '#59514b',
        stroke: '#f8eee1',
        accent: '#a78657',
      },
    },
  },
  {
    id: 'glyph',
    label: 'Makruk Glyph',
    description: 'Minimal illustrated symbols for fast readability.',
    renderer: 'glyph',
    colors: {
      white: {
        fill: '#fff8f1',
        stroke: '#3c2f25',
        accent: '#d6b48a',
        text: '#3c2f25',
        base: '#d6a96c',
      },
      black: {
        fill: '#22242a',
        stroke: '#666e78',
        accent: '#4b5663',
        text: '#d7dee9',
        base: '#313844',
      },
    },
  },
];

export const DEFAULT_PIECE_STYLE: PieceStyle = 'classic';

export function getPieceSetById(id: string | null | undefined): PieceSetConfig {
  return PIECE_SETS.find((pieceSet) => pieceSet.id === id) ?? PIECE_SETS[0];
}

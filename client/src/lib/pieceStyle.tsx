import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BOARD_THEMES,
  DEFAULT_BOARD_THEME_ID,
  getBoardThemeById,
  type BoardThemeConfig,
  type BoardThemeId,
} from '../themes/boards';
import {
  CORE_PIECE_SHAPE_LABEL,
  DEFAULT_PIECE_THEME_ID,
  PIECE_THEMES,
  getPieceThemeById,
  type PieceThemeConfig,
  type PieceThemeId,
} from '../themes/pieces';

type BoardAppearanceContextValue = {
  boardThemeId: BoardThemeId;
  setBoardThemeId: (themeId: BoardThemeId) => void;
  boardTheme: BoardThemeConfig;
  boardThemes: readonly BoardThemeConfig[];
  pieceThemeId: PieceThemeId;
  setPieceThemeId: (themeId: PieceThemeId) => void;
  pieceTheme: PieceThemeConfig;
  pieceThemes: readonly PieceThemeConfig[];
  corePieceShapeLabel: string;
};

const PIECE_STORAGE_KEY = 'thaichess-piece-theme';
const LEGACY_PIECE_STORAGE_KEY = 'thaichess-piece-style';
const BOARD_STORAGE_KEY = 'thaichess-board-theme';

const BoardAppearanceContext = createContext<BoardAppearanceContextValue | null>(null);

function normalizeLegacyPieceTheme(saved: string | null): PieceThemeId {
  switch (saved) {
    case 'classic':
    case 'traditional':
    case 'classic-ivory-ink':
      return 'classic-ivory-ink';
    case 'obsidian':
    case 'obsidian-pearl':
      return 'obsidian-pearl';
    case 'western':
    case 'ivory':
    case 'gold-ebony':
      return 'gold-ebony';
    case 'glyph':
    case 'jade-bone':
      return 'jade-bone';
    case 'crimson-sand':
      return 'crimson-sand';
    default:
      return DEFAULT_PIECE_THEME_ID;
  }
}

function getInitialPieceTheme(): PieceThemeId {
  if (typeof window === 'undefined') return DEFAULT_PIECE_THEME_ID;

  const saved = window.localStorage.getItem(PIECE_STORAGE_KEY);
  if (saved) return getPieceThemeById(saved).id;

  return normalizeLegacyPieceTheme(window.localStorage.getItem(LEGACY_PIECE_STORAGE_KEY));
}

function getInitialBoardTheme(): BoardThemeId {
  if (typeof window === 'undefined') return DEFAULT_BOARD_THEME_ID;
  return getBoardThemeById(window.localStorage.getItem(BOARD_STORAGE_KEY)).id;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [pieceThemeId, setPieceThemeId] = useState<PieceThemeId>(getInitialPieceTheme);
  const [boardThemeId, setBoardThemeId] = useState<BoardThemeId>(getInitialBoardTheme);

  useEffect(() => {
    window.localStorage.setItem(PIECE_STORAGE_KEY, pieceThemeId);
    window.localStorage.removeItem(LEGACY_PIECE_STORAGE_KEY);
  }, [pieceThemeId]);

  useEffect(() => {
    window.localStorage.setItem(BOARD_STORAGE_KEY, boardThemeId);
  }, [boardThemeId]);

  const value = useMemo<BoardAppearanceContextValue>(() => {
    const boardTheme = getBoardThemeById(boardThemeId);
    const pieceTheme = getPieceThemeById(pieceThemeId);

    return {
      boardThemeId,
      setBoardThemeId,
      boardTheme,
      boardThemes: BOARD_THEMES,
      pieceThemeId,
      setPieceThemeId,
      pieceTheme,
      pieceThemes: PIECE_THEMES,
      corePieceShapeLabel: CORE_PIECE_SHAPE_LABEL,
    };
  }, [boardThemeId, pieceThemeId]);

  return (
    <BoardAppearanceContext.Provider value={value}>
      {children}
    </BoardAppearanceContext.Provider>
  );
}

export const PieceStyleProvider = AppearanceProvider;

export function useBoardAppearance() {
  const context = useContext(BoardAppearanceContext);
  if (!context) {
    throw new Error('useBoardAppearance must be used within AppearanceProvider');
  }
  return context;
}

// Backward-compatible alias for older imports and test mocks.
export const usePieceStyle = useBoardAppearance;

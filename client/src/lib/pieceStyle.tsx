import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BOARD_THEMES,
  DEFAULT_BOARD_THEME_ID,
  getBoardThemeById,
  type BoardThemeConfig,
  type BoardThemeId,
} from '../themes/boards';
import {
  DEFAULT_PIECE_STYLE,
  PIECE_SETS,
  getPieceSetById,
  type PieceSetConfig,
  type PieceStyle,
} from '../themes/pieces';

type BoardAppearanceContextValue = {
  boardThemeId: BoardThemeId;
  setBoardThemeId: (themeId: BoardThemeId) => void;
  boardTheme: BoardThemeConfig;
  boardThemes: readonly BoardThemeConfig[];
  pieceStyle: PieceStyle;
  setPieceStyle: (style: PieceStyle) => void;
  pieceSet: PieceSetConfig;
  pieceSets: readonly PieceSetConfig[];
};

type PieceStyleContextValue = {
  pieceStyle: PieceStyle;
  setPieceStyle: (style: PieceStyle) => void;
};

const PIECE_STORAGE_KEY = 'thaichess-piece-style';
const BOARD_STORAGE_KEY = 'thaichess-board-theme';

const BoardAppearanceContext = createContext<BoardAppearanceContextValue | null>(null);

function getInitialPieceStyle(): PieceStyle {
  if (typeof window === 'undefined') return DEFAULT_PIECE_STYLE;

  const saved = window.localStorage.getItem(PIECE_STORAGE_KEY);
  if (saved === 'traditional') return 'classic';
  return getPieceSetById(saved).id;
}

function getInitialBoardTheme(): BoardThemeId {
  if (typeof window === 'undefined') return DEFAULT_BOARD_THEME_ID;
  return getBoardThemeById(window.localStorage.getItem(BOARD_STORAGE_KEY)).id;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>(getInitialPieceStyle);
  const [boardThemeId, setBoardThemeId] = useState<BoardThemeId>(getInitialBoardTheme);

  useEffect(() => {
    window.localStorage.setItem(PIECE_STORAGE_KEY, pieceStyle);
  }, [pieceStyle]);

  useEffect(() => {
    window.localStorage.setItem(BOARD_STORAGE_KEY, boardThemeId);
  }, [boardThemeId]);

  const value = useMemo<BoardAppearanceContextValue>(() => {
    const boardTheme = getBoardThemeById(boardThemeId);
    const pieceSet = getPieceSetById(pieceStyle);

    return {
      boardThemeId,
      setBoardThemeId,
      boardTheme,
      boardThemes: BOARD_THEMES,
      pieceStyle,
      setPieceStyle,
      pieceSet,
      pieceSets: PIECE_SETS,
    };
  }, [boardThemeId, pieceStyle]);

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

export function usePieceStyle(): PieceStyleContextValue {
  const { pieceStyle, setPieceStyle } = useBoardAppearance();
  return { pieceStyle, setPieceStyle };
}

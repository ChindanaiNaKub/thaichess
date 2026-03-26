import { createContext, useContext, useEffect, useState } from 'react';

export type PieceStyle = 'classic' | 'western';

type PieceStyleContextValue = {
  pieceStyle: PieceStyle;
  setPieceStyle: (style: PieceStyle) => void;
};

const STORAGE_KEY = 'thaichess-piece-style';

const PieceStyleContext = createContext<PieceStyleContextValue | null>(null);

function getInitialPieceStyle(): PieceStyle {
  if (typeof window === 'undefined') return 'classic';

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'western') return 'western';
  if (saved === 'classic' || saved === 'traditional') return 'classic';

  return 'classic';
}

export function PieceStyleProvider({ children }: { children: React.ReactNode }) {
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>(getInitialPieceStyle);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, pieceStyle);
  }, [pieceStyle]);

  return (
    <PieceStyleContext.Provider value={{ pieceStyle, setPieceStyle }}>
      {children}
    </PieceStyleContext.Provider>
  );
}

export function usePieceStyle() {
  const context = useContext(PieceStyleContext);
  if (!context) {
    throw new Error('usePieceStyle must be used within PieceStyleProvider');
  }
  return context;
}

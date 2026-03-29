import type { ReactNode } from 'react';
import GameHeaderBar from './GameHeaderBar';
import GameScreenLayout from './GameScreenLayout';

interface InGameShellProps {
  onHome: () => void;
  headerMeta: ReactNode;
  topPanel: ReactNode;
  board: ReactNode;
  bottomPanel: ReactNode;
  sidePanel: ReactNode;
  statusText: ReactNode;
  moveCount: number;
  isViewingHistory?: boolean;
  showCheckBadge?: boolean;
  toolbar?: ReactNode;
  banners?: ReactNode;
}

export default function InGameShell({
  onHome,
  headerMeta,
  topPanel,
  board,
  bottomPanel,
  sidePanel,
  statusText,
  moveCount,
  isViewingHistory = false,
  showCheckBadge = false,
  toolbar = null,
  banners = null,
}: InGameShellProps) {
  return (
    <div className="bg-surface flex min-h-screen flex-col lg:h-dvh lg:overflow-hidden" tabIndex={-1}>
      <GameHeaderBar onHome={onHome} meta={headerMeta} />
      {banners}
      <GameScreenLayout
        topPanel={topPanel}
        board={board}
        bottomPanel={bottomPanel}
        sidePanel={sidePanel}
        statusText={statusText}
        moveCount={moveCount}
        isViewingHistory={isViewingHistory}
        showCheckBadge={showCheckBadge}
        toolbar={toolbar}
      />
    </div>
  );
}

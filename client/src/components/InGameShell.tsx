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
  boardNotice?: ReactNode;
  boardActions?: ReactNode;
  statusHelp?: ReactNode;
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
  boardNotice = null,
  boardActions = null,
  statusHelp = null,
}: InGameShellProps) {
  return (
    <div className="bg-surface flex min-h-screen flex-col lg:h-dvh lg:overflow-hidden" tabIndex={-1}>
      {/* Sticky on mobile page scroll so mid-game alerts (liveError, draw) stay under the header. */}
      <div
        data-testid="in-game-sticky-chrome"
        className="sticky top-0 z-40 shrink-0 bg-surface/95 backdrop-blur-sm supports-[backdrop-filter]:bg-surface/90"
      >
        <GameHeaderBar onHome={onHome} meta={headerMeta} />
        {banners}
      </div>
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
        boardNotice={boardNotice}
        boardActions={boardActions}
        statusHelp={statusHelp}
      />
    </div>
  );
}

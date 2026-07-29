import type { Dispatch, SetStateAction } from 'react';
import type { Position, PieceColor, Move, Board as BoardType } from '@shared/types';
import { useNavigate } from 'react-router-dom';
import { moveToUci } from '@shared/engineAdapter';
import { savedGameAnalysisRoute } from '../lib/routes';
import { type OpeningMoveStat } from '../queries/games';
import Board from '../components/Board';

function formatResult(result: string): string {
  if (result === 'draw') return '½-½';
  if (result === 'white') return '1-0';
  return '0-1';
}

function formatRating(rating: number | null): string {
  return rating !== null ? String(rating) : '-';
}

function getWinRate(move: OpeningMoveStat, color: PieceColor): number {
  const total = move.totalGames;
  if (total === 0) return 0;
  const wins = color === 'white' ? move.whiteWins : move.blackWins;
  return Math.round((wins / total) * 100);
}

function getBarColor(winRate: number, color: PieceColor): string {
  if (color === 'white') {
    if (winRate >= 55) return 'bg-primary';
    if (winRate >= 45) return 'bg-accent';
    return 'bg-danger';
  }
  if (winRate >= 55) return 'bg-danger';
  if (winRate >= 45) return 'bg-accent';
  return 'bg-primary';
}


export interface OpeningExplorerWorkspaceProps {
  currentState: {
    board: BoardType;
    turn: PieceColor;
    isCheck: boolean;
  };
  viewAs: PieceColor;
  legalMoves: Position[];
  selectedSquare: Position | null;
  lastMove: {
    from: Position;
    to: Position;
    movedPiece: NonNullable<Move['movedPiece']>;
    capturedPiece: Move['capturedPiece'];
    promotion: Move['promotion'];
  } | null;
  checkSquare: Position | null;
  moveHistory: Move[];
  totalGames: number;
  statsLoading: boolean;
  stats: { moves: OpeningMoveStat[] };
  selectedMoveUci: string | null;
  setSelectedMoveUci: Dispatch<SetStateAction<string | null>>;
  setGamesPage: Dispatch<SetStateAction<number>>;
  gamesPage: number;
  gamesLoading: boolean;
  gamesData: { games: Array<{
    id: string;
    white_name: string;
    black_name: string;
    result: string;
    move_count: number;
    finished_at: number;
  }>; total: number } | undefined;
  handleSquareClick: (pos: Position) => void;
  handlePieceDrop: (from: Position, to: Position) => void;
  handleReset: () => void;
  handleUndo: () => void;
  handleFlip: () => void;
  handleMoveFromStats: (moveUci: string) => void;
}

export function OpeningExplorerWorkspace(props: OpeningExplorerWorkspaceProps) {
  const navigate = useNavigate();
  const {
    currentState, viewAs, legalMoves, selectedSquare, lastMove, checkSquare,
    moveHistory, totalGames, statsLoading, stats, selectedMoveUci, setSelectedMoveUci,
    setGamesPage, gamesPage, gamesLoading, gamesData,
    handleSquareClick, handlePieceDrop, handleReset, handleUndo, handleFlip, handleMoveFromStats,
  } = props;

  return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Board */}
          <div className="lg:col-span-2">
            <div className="ui-card p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={handleReset} className="ui-btn-secondary px-2 py-1 text-xs">Reset</button>
                  <button type="button" onClick={handleUndo} disabled={moveHistory.length === 0} className="ui-btn-secondary px-2 py-1 text-xs disabled:opacity-40">Undo</button>
                  <button type="button" onClick={handleFlip} className="ui-btn-secondary px-2 py-1 text-xs">Flip</button>
                </div>
                <span className="text-text-dim text-xs">
                  {totalGames.toLocaleString()} games in database
                </span>
              </div>

              {/* Move path */}
              {moveHistory.length > 0 && (
                <div className="mb-3 p-2 bg-surface-hover/30 rounded-lg overflow-x-auto">
                  <div className="flex items-center gap-1 text-xs text-text-dim whitespace-nowrap">
                    <span className="font-semibold text-text-bright">Moves:</span>
                    {moveHistory.map((move, ply) => {
                      const moveNum = Math.floor(ply / 2) + 1;
                      const isWhite = ply % 2 === 0;
                      const pathKey = moveHistory.slice(0, ply + 1).map(moveToUci).join('-');
                      return (
                        <span key={pathKey}>
                          {isWhite && <span className="text-text-dim ml-1">{moveNum}.</span>}
                          <span className="text-text-bright font-mono">{moveToUci(move)}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="max-w-[600px] mx-auto">
                <Board
                  board={currentState.board}
                  playerColor={viewAs}
                  draggableColor={currentState.turn}
                  isMyTurn={true}
                  legalMoves={legalMoves}
                  selectedSquare={selectedSquare}
                  lastMove={lastMove}
                  isCheck={currentState.isCheck}
                  checkSquare={checkSquare}
                  onSquareClick={handleSquareClick}
                  onPieceDrop={handlePieceDrop}
                  disabled={false}
                />
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <div className="ui-card p-3 sm:p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-dim mb-3">
                Move Statistics
              </h3>

              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stats.moves.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-dim text-sm">No games with this position</p>
                  <p className="text-text-dim text-xs mt-1">Make a move on the board to explore</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.moves.map((move) => {
                    const winRate = getWinRate(move, currentState.turn);
                    const barColor = getBarColor(winRate, currentState.turn);
                    const isSelected = selectedMoveUci === move.moveUci;

                    return (
                      <button type="button"
                        key={move.moveUci}
                        onClick={() => {
                          setSelectedMoveUci(move.moveUci);
                          setGamesPage(0);
                          handleMoveFromStats(move.moveUci);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-primary/15 border border-primary/30' : 'hover:bg-surface-hover/30 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm font-semibold text-text-bright">
                            {move.moveUci}
                          </span>
                          <span className="text-xs text-text-dim">
                            {move.totalGames.toLocaleString()} games
                          </span>
                        </div>

                        {/* Win rate bar */}
                        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full ${barColor} transition-[width]`}
                            style={{ width: `${winRate}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-text-dim">
                          <span className="text-text-bright">{winRate}% wins for {currentState.turn}</span>
                          <span>W:{move.whiteWins} D:{move.draws} B:{move.blackWins}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-text-dim mt-0.5">
                          <span>⚪ {formatRating(move.avgWhiteRating)}</span>
                          <span>⚫ {formatRating(move.avgBlackRating)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Games for selected move */}
            {selectedMoveUci && (
              <div className="ui-card p-3 sm:p-4 mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-dim mb-3">
                  Games with {selectedMoveUci}
                </h3>

                {gamesLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : gamesData && gamesData.games.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {gamesData.games.map((game) => (
                        <button type="button"
                          key={game.id}
                          onClick={() => navigate(savedGameAnalysisRoute(game.id))}
                          className="w-full text-left p-2 rounded-lg hover:bg-surface-hover/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-bright truncate">
                              {game.white_name} vs {game.black_name}
                            </span>
                            <span className="text-xs font-mono text-text-dim ml-2">
                              {formatResult(game.result)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-text-dim mt-0.5">
                            <span>{game.move_count} moves</span>
                            <span>•</span>
                            <span>{new Date(game.finished_at * 1000).toLocaleDateString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {gamesData.total > 10 && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-hover/30">
                        <button type="button"
                          onClick={() => setGamesPage(p => Math.max(0, p - 1))}
                          disabled={gamesPage === 0}
                          className="ui-btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <span className="text-text-dim text-xs">
                          {gamesPage + 1} / {Math.ceil(gamesData.total / 10)}
                        </span>
                        <button type="button"
                          onClick={() => setGamesPage(p => p + 1)}
                          disabled={(gamesPage + 1) * 10 >= gamesData.total}
                          className="ui-btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-text-dim text-xs text-center py-4">No games found</p>
                )}
              </div>
            )}
          </div>
        </div>
  );
}

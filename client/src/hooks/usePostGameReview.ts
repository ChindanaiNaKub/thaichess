import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CountingState, GameState, LastMove, Move, Piece, PieceColor, Position, ResultReason } from '@shared/types';
import { createInitialGameState, createPromotedPawn, getLegalMoves, hasAnyLegalMoves, isInCheck, makeMove } from '@shared/engine';

type ReviewMode = 'mainLine' | 'analysis';

interface ReviewStateSource {
  board: GameState['board'];
  turn: PieceColor;
  moveHistory: Move[];
  lastMove: GameState['lastMove'] | LastMove | Move | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  gameOver: boolean;
  winner: PieceColor | null;
  resultReason: ResultReason;
  counting: CountingState | null;
  whiteTime: number;
  blackTime: number;
  moveCount: number;
  lastMoveTime?: number;
}

interface AnalysisNode {
  id: string;
  parentId: string | null;
  move: Move | null;
  state: GameState;
  childrenIds: string[];
  preferredChildId: string | null;
}

interface AnalysisBranch {
  rootMoveIndex: number;
  rootNodeId: string;
  currentNodeId: string;
  nodes: Record<string, AnalysisNode>;
}

interface UsePostGameReviewOptions {
  enabled: boolean;
  mainLine: Move[];
  finalState?: ReviewStateSource | null;
}

interface UsePostGameReviewResult {
  mode: ReviewMode;
  currentState: GameState;
  currentMoveHistory: Move[];
  currentLastMove: Move | LastMove | null;
  currentCheckSquare: Position | null;
  selectedMainLineMoveIndex: number;
  analysisRootMoveIndex: number | null;
  analysisLine: Move[];
  canStepBackward: boolean;
  canStepForward: boolean;
  canEnterAnalysis: boolean;
  canResetAnalysis: boolean;
  jumpToMainLine: (moveIndex: number) => void;
  stepBackward: () => void;
  stepForward: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  enterAnalysis: () => void;
  returnToMainLine: () => void;
  resetAnalysis: () => void;
  selectedSquare: Position | null;
  legalMoves: Position[];
  handleSquareClick: (pos: Position) => void;
  handlePieceDrop: (from: Position, to: Position) => void;
}

function cloneBoard(board: GameState['board']): GameState['board'] {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function cloneMove(move: Move): Move {
  return {
    ...move,
    from: { ...move.from },
    to: { ...move.to },
    movedPiece: move.movedPiece ? { ...move.movedPiece } : undefined,
    captured: move.captured ? { ...move.captured } : move.captured ?? undefined,
    capturedPiece: move.capturedPiece ? { ...move.capturedPiece } : move.capturedPiece ?? undefined,
  };
}

function cloneMoves(moves: Move[]): Move[] {
  return moves.map(cloneMove);
}

function normalizeState(source: ReviewStateSource): GameState {
  const fresh = createInitialGameState(source.whiteTime ?? 0, source.blackTime ?? 0);
  const lastMovePiece: Piece | null = source.lastMove
    ? ('movedPiece' in source.lastMove && source.lastMove.movedPiece
      ? { ...source.lastMove.movedPiece }
      : source.board[source.lastMove.to.row]?.[source.lastMove.to.col]
        ? { ...source.board[source.lastMove.to.row][source.lastMove.to.col]! }
        : { type: 'P', color: source.turn === 'white' ? 'black' : 'white' })
    : null;

  return {
    ...fresh,
    board: cloneBoard(source.board),
    turn: source.turn,
    moveHistory: cloneMoves(source.moveHistory),
    lastMove: source.lastMove
      ? {
          ...source.lastMove,
          from: { ...source.lastMove.from },
          to: { ...source.lastMove.to },
          movedPiece: lastMovePiece!,
          capturedPiece: source.lastMove.capturedPiece ? { ...source.lastMove.capturedPiece } : source.lastMove.capturedPiece ?? null,
          promotion: source.lastMove.promotion ?? null,
        }
      : null,
    isCheck: source.isCheck,
    isCheckmate: source.isCheckmate,
    isStalemate: source.isStalemate,
    isDraw: source.isDraw,
    gameOver: source.gameOver,
    winner: source.winner,
    resultReason: source.resultReason,
    counting: source.counting ? { ...source.counting } : null,
    whiteTime: source.whiteTime,
    blackTime: source.blackTime,
    moveCount: source.moveCount,
    lastMoveTime: source.lastMoveTime ?? Date.now(),
  };
}

function movesEqual(left: Move | null, right: Move | null): boolean {
  if (!left || !right) return false;

  return left.from.row === right.from.row
    && left.from.col === right.from.col
    && left.to.row === right.to.row
    && left.to.col === right.to.col
    && Boolean(left.promoted) === Boolean(right.promoted)
    && (left.promotion ?? null) === (right.promotion ?? null);
}

function inferFallbackPiece(move: Move, turn: PieceColor, boardPiece: Piece | null): Piece {
  if (boardPiece) return { ...boardPiece };
  if (move.movedPiece) return { ...move.movedPiece };
  return { type: move.promoted || move.promotion === 'PM' ? 'PM' : 'P', color: turn };
}

function applyRecordedMove(state: GameState, move: Move): GameState {
  const strictReplay = makeMove(state, move.from, move.to);
  if (strictReplay) {
    return strictReplay;
  }

  const board = cloneBoard(state.board);
  const boardPiece = board[move.from.row][move.from.col];
  const movedPiece = inferFallbackPiece(move, state.turn, boardPiece);
  const promoted = Boolean(move.promoted || move.promotion === 'PM');

  board[move.from.row][move.from.col] = null;
  board[move.to.row][move.to.col] = promoted
    ? createPromotedPawn(movedPiece.color)
    : { ...movedPiece };

  const nextTurn: PieceColor = state.turn === 'white' ? 'black' : 'white';
  const check = isInCheck(board, nextTurn);
  const hasLegal = hasAnyLegalMoves(board, nextTurn);
  const isCheckmate = check && !hasLegal;
  const isStalemate = !check && !hasLegal;
  const isDraw = isStalemate;
  const gameOver = isCheckmate || isStalemate;
  const winner = isCheckmate ? state.turn : null;
  const resultReason: ResultReason = isCheckmate ? 'checkmate' : isStalemate ? 'stalemate' : null;

  return {
    ...state,
    board,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, cloneMove(move)],
    lastMove: {
      from: { ...move.from },
      to: { ...move.to },
      movedPiece: { ...movedPiece },
      capturedPiece: move.capturedPiece ? { ...move.capturedPiece } : move.captured ? { ...move.captured } : null,
      promotion: promoted ? 'PM' : move.promotion ?? null,
    },
    isCheck: check,
    isCheckmate,
    isStalemate,
    isDraw,
    gameOver,
    winner,
    resultReason,
    counting: null,
    moveCount: state.moveCount + 1,
  };
}

function buildMainLineStates(moves: Move[], finalState?: ReviewStateSource | null): GameState[] {
  const states: GameState[] = [createInitialGameState(0, 0)];

  for (const move of moves) {
    states.push(applyRecordedMove(states[states.length - 1], move));
  }

  if (finalState && finalState.moveHistory.length === moves.length) {
    states[states.length - 1] = normalizeState(finalState);
  }

  return states;
}

function getCheckSquare(state: GameState): Position | null {
  if (!state.isCheck) return null;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = state.board[row][col];
      if (piece && piece.type === 'K' && piece.color === state.turn) {
        return { row, col };
      }
    }
  }

  return null;
}

function getBranchStepForwardNode(branch: AnalysisBranch | null): AnalysisNode | null {
  if (!branch) return null;
  const currentNode = branch.nodes[branch.currentNodeId];
  if (!currentNode) return null;

  const childId = currentNode.preferredChildId ?? currentNode.childrenIds[0] ?? null;
  return childId ? branch.nodes[childId] ?? null : null;
}

export function usePostGameReview(options: UsePostGameReviewOptions): UsePostGameReviewResult {
  const { enabled, mainLine, finalState } = options;
  const latestMoveIndex = mainLine.length - 1;
  const nodeIdRef = useRef(0);
  const [mode, setMode] = useState<ReviewMode>('mainLine');
  const [selectedMainLineMoveIndex, setSelectedMainLineMoveIndex] = useState(latestMoveIndex);
  const [analysisRootMoveIndex, setAnalysisRootMoveIndex] = useState<number | null>(null);
  const [branches, setBranches] = useState<Record<string, AnalysisBranch>>({});
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);

  const mainLineStates = useMemo(
    () => buildMainLineStates(mainLine, finalState),
    [finalState, mainLine],
  );

  const mainLineState = mainLineStates[selectedMainLineMoveIndex + 1] ?? mainLineStates[mainLineStates.length - 1];
  const activeBranch = analysisRootMoveIndex !== null ? branches[String(analysisRootMoveIndex)] ?? null : null;
  const activeAnalysisNode = mode === 'analysis' && activeBranch
    ? activeBranch.nodes[activeBranch.currentNodeId] ?? null
    : null;
  const currentState = activeAnalysisNode?.state ?? mainLineState;
  const currentMoveHistory = currentState.moveHistory;
  const officialLastMoveIndex = mode === 'analysis' ? analysisRootMoveIndex : selectedMainLineMoveIndex;
  const isLatestOfficialMove = officialLastMoveIndex !== null && officialLastMoveIndex === mainLine.length - 1;
  const currentLastMove = activeAnalysisNode?.move
    ?? (isLatestOfficialMove ? currentState.lastMove ?? null : null)
    ?? (officialLastMoveIndex !== null && officialLastMoveIndex >= 0
      ? mainLine[officialLastMoveIndex] ?? currentState.lastMove ?? null
      : null);
  const currentCheckSquare = useMemo(() => getCheckSquare(currentState), [currentState]);
  const analysisLine = useMemo(() => {
    if (!activeAnalysisNode || analysisRootMoveIndex === null) return [];
    return currentState.moveHistory.slice(analysisRootMoveIndex + 1);
  }, [activeAnalysisNode, analysisRootMoveIndex, currentState.moveHistory]);

  useEffect(() => {
    setMode('mainLine');
    setSelectedMainLineMoveIndex(latestMoveIndex);
    setAnalysisRootMoveIndex(null);
    setBranches({});
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [enabled, latestMoveIndex, mainLine]);

  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [mode, selectedMainLineMoveIndex, activeBranch?.currentNodeId]);

  const jumpToMainLine = useCallback((moveIndex: number) => {
    const nextIndex = Math.max(-1, Math.min(latestMoveIndex, moveIndex));
    setMode('mainLine');
    setSelectedMainLineMoveIndex(nextIndex);
    setAnalysisRootMoveIndex(null);
  }, [latestMoveIndex]);

  const enterAnalysis = useCallback(() => {
    if (!enabled) return;

    const rootMoveIndex = selectedMainLineMoveIndex;
    const branchKey = String(rootMoveIndex);
    const existingBranch = branches[branchKey];

    if (!existingBranch) {
      const rootNodeId = `review-node-${nodeIdRef.current++}`;
      const rootNode: AnalysisNode = {
        id: rootNodeId,
        parentId: null,
        move: null,
        state: mainLineStates[rootMoveIndex + 1],
        childrenIds: [],
        preferredChildId: null,
      };

      setBranches((current) => ({
        ...current,
        [branchKey]: {
          rootMoveIndex,
          rootNodeId,
          currentNodeId: rootNodeId,
          nodes: {
            [rootNodeId]: rootNode,
          },
        },
      }));
    }

    setMode('analysis');
    setAnalysisRootMoveIndex(rootMoveIndex);
  }, [branches, enabled, mainLineStates, selectedMainLineMoveIndex]);

  const returnToMainLine = useCallback(() => {
    if (analysisRootMoveIndex === null) return;
    setMode('mainLine');
    setSelectedMainLineMoveIndex(analysisRootMoveIndex);
    setAnalysisRootMoveIndex(null);
  }, [analysisRootMoveIndex]);

  const resetAnalysis = useCallback(() => {
    if (analysisRootMoveIndex === null) return;

    const branchKey = String(analysisRootMoveIndex);
    setBranches((current) => {
      const branch = current[branchKey];
      if (!branch) return current;

      return {
        ...current,
        [branchKey]: {
          ...branch,
          currentNodeId: branch.rootNodeId,
          nodes: {
            [branch.rootNodeId]: {
              ...branch.nodes[branch.rootNodeId],
              childrenIds: [],
              preferredChildId: null,
            },
          },
        },
      };
    });
  }, [analysisRootMoveIndex]);

  const commitAnalysisMove = useCallback((from: Position, to: Position) => {
    if (!enabled || analysisRootMoveIndex === null) return false;

    const branchKey = String(analysisRootMoveIndex);
    let committed = false;

    setBranches((current) => {
      const branch = current[branchKey];
      if (!branch) return current;

      const currentNode = branch.nodes[branch.currentNodeId];
      if (!currentNode) return current;

      const nextState = makeMove(currentNode.state, from, to);
      if (!nextState) return current;

      const nextMove = nextState.moveHistory[nextState.moveHistory.length - 1] ?? null;
      if (!nextMove) return current;

      const existingChildId = currentNode.childrenIds.find((childId) =>
        movesEqual(branch.nodes[childId]?.move ?? null, nextMove),
      );

      const nodes: Record<string, AnalysisNode> = {
        ...branch.nodes,
        [currentNode.id]: {
          ...currentNode,
          preferredChildId: existingChildId ?? currentNode.preferredChildId,
        },
      };

      let currentNodeId = branch.currentNodeId;

      if (existingChildId) {
        nodes[currentNode.id] = {
          ...nodes[currentNode.id],
          preferredChildId: existingChildId,
        };
        currentNodeId = existingChildId;
      } else {
        const childId = `review-node-${nodeIdRef.current++}`;
        nodes[currentNode.id] = {
          ...nodes[currentNode.id],
          childrenIds: [...currentNode.childrenIds, childId],
          preferredChildId: childId,
        };
        nodes[childId] = {
          id: childId,
          parentId: currentNode.id,
          move: nextMove,
          state: nextState,
          childrenIds: [],
          preferredChildId: null,
        };
        currentNodeId = childId;
      }

      committed = true;
      return {
        ...current,
        [branchKey]: {
          ...branch,
          currentNodeId,
          nodes,
        },
      };
    });

    if (committed) {
      setSelectedSquare(null);
      setLegalMoves([]);
    }

    return committed;
  }, [analysisRootMoveIndex, enabled]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (!enabled || mode !== 'analysis') return;

    const piece = currentState.board[pos.row][pos.col];

    if (selectedSquare) {
      const isLegalTarget = legalMoves.some((move) => move.row === pos.row && move.col === pos.col);
      if (isLegalTarget) {
        commitAnalysisMove(selectedSquare, pos);
        return;
      }
    }

    if (piece && piece.color === currentState.turn) {
      setSelectedSquare(pos);
      setLegalMoves(getLegalMoves(currentState.board, pos));
      return;
    }

    setSelectedSquare(null);
    setLegalMoves([]);
  }, [commitAnalysisMove, currentState, enabled, legalMoves, mode, selectedSquare]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    if (!enabled || mode !== 'analysis') return;

    const piece = currentState.board[from.row][from.col];
    if (!piece || piece.color !== currentState.turn) return;

    const moves = getLegalMoves(currentState.board, from);
    if (!moves.some((move) => move.row === to.row && move.col === to.col)) return;

    commitAnalysisMove(from, to);
  }, [commitAnalysisMove, currentState, enabled, mode]);

  const stepBackward = useCallback(() => {
    if (mode === 'analysis') {
      if (!activeBranch || !activeAnalysisNode?.parentId) return;
      setBranches((current) => {
        const branch = analysisRootMoveIndex !== null ? current[String(analysisRootMoveIndex)] : null;
        if (!branch || !activeAnalysisNode.parentId) return current;

        return {
          ...current,
          [String(analysisRootMoveIndex)]: {
            ...branch,
            currentNodeId: activeAnalysisNode.parentId,
          },
        };
      });
      return;
    }

    jumpToMainLine(selectedMainLineMoveIndex - 1);
  }, [activeAnalysisNode?.parentId, activeBranch, analysisRootMoveIndex, jumpToMainLine, mode, selectedMainLineMoveIndex]);

  const stepForward = useCallback(() => {
    if (mode === 'analysis') {
      if (!activeBranch) return;
      const nextNode = getBranchStepForwardNode(activeBranch);
      if (!nextNode) return;

      setBranches((current) => ({
        ...current,
        [String(activeBranch.rootMoveIndex)]: {
          ...activeBranch,
          currentNodeId: nextNode.id,
        },
      }));
      return;
    }

    jumpToMainLine(selectedMainLineMoveIndex + 1);
  }, [activeBranch, jumpToMainLine, mode, selectedMainLineMoveIndex]);

  const jumpToStart = useCallback(() => {
    if (mode === 'analysis') {
      if (!activeBranch) return;
      setBranches((current) => ({
        ...current,
        [String(activeBranch.rootMoveIndex)]: {
          ...activeBranch,
          currentNodeId: activeBranch.rootNodeId,
        },
      }));
      return;
    }

    jumpToMainLine(-1);
  }, [activeBranch, jumpToMainLine, mode]);

  const jumpToEnd = useCallback(() => {
    if (mode === 'analysis') {
      if (!activeBranch) return;

      let nextNode = getBranchStepForwardNode(activeBranch);
      let finalNodeId = activeBranch.currentNodeId;
      let branch = activeBranch;

      while (nextNode) {
        finalNodeId = nextNode.id;
        branch = {
          ...branch,
          currentNodeId: nextNode.id,
        };
        nextNode = getBranchStepForwardNode(branch);
      }

      if (finalNodeId === activeBranch.currentNodeId) return;

      setBranches((current) => ({
        ...current,
        [String(activeBranch.rootMoveIndex)]: {
          ...activeBranch,
          currentNodeId: finalNodeId,
        },
      }));
      return;
    }

    jumpToMainLine(latestMoveIndex);
  }, [activeBranch, jumpToMainLine, latestMoveIndex, mode]);

  return {
    mode,
    currentState,
    currentMoveHistory,
    currentLastMove,
    currentCheckSquare,
    selectedMainLineMoveIndex,
    analysisRootMoveIndex,
    analysisLine,
    canStepBackward: mode === 'analysis'
      ? Boolean(activeAnalysisNode?.parentId)
      : selectedMainLineMoveIndex > -1,
    canStepForward: mode === 'analysis'
      ? Boolean(getBranchStepForwardNode(activeBranch))
      : selectedMainLineMoveIndex < latestMoveIndex,
    canEnterAnalysis: enabled,
    canResetAnalysis: Boolean(activeBranch && analysisLine.length > 0),
    jumpToMainLine,
    stepBackward,
    stepForward,
    jumpToStart,
    jumpToEnd,
    enterAnalysis,
    returnToMainLine,
    resetAnalysis,
    selectedSquare,
    legalMoves,
    handleSquareClick,
    handlePieceDrop,
  };
}

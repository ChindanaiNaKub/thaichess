export type PieceColor = 'white' | 'black';
export type PrivateGameColorPreference = PieceColor | 'random';
export type GameMode = 'quick_play' | 'private' | 'bot' | 'local';
export type PlayerPresenceStatus = 'active' | 'idle' | 'away' | 'disconnected';
export type ResultReason =
  | 'checkmate'
  | 'stalemate'
  | 'insufficient_material'
  | 'counting_rule'
  | 'draw_agreement'
  | 'resignation'
  | 'timeout'
  | null;

export type CountingRuleType = 'board_honor' | 'pieces_honor';

export type PieceType = 'K' | 'M' | 'S' | 'R' | 'N' | 'P' | 'PM';
// K = Khun (King), M = Met (Queen), S = Khon (Bishop/Silver)
// R = Rua (Rook), N = Ma (Knight), P = Bia (Pawn), PM = Bia Ngai (Promoted Pawn = Met)

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Position {
  row: number; // 0-7, where 0 = rank 1 (white's back rank)
  col: number; // 0-7, where 0 = a-file
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Piece | null;
  promoted?: boolean;
}

export type Board = (Piece | null)[][];

export interface CountingState {
  active: boolean;
  type: CountingRuleType;
  countingColor: PieceColor;
  strongerColor: PieceColor;
  currentCount: number;
  startCount?: number;
  limit: number;
  finalAttackPending: boolean;
}

export interface GameState {
  board: Board;
  turn: PieceColor;
  moveHistory: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  gameOver: boolean;
  winner: PieceColor | null;
  resultReason: ResultReason;
  counting: CountingState | null;
  whiteTime: number; // milliseconds remaining
  blackTime: number;
  lastMoveTime: number;
  moveCount: number;
}

export type TimeControl = {
  initial: number;  // seconds
  increment: number; // seconds per move
};

export interface PlayerPresence {
  status: PlayerPresenceStatus;
  latencyMs: number | null;
  lastSeenAt: number | null;
}

export interface GameRoom {
  id: string;
  white: string | null;  // socket id
  black: string | null;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  whiteUserId: string | null;
  blackUserId: string | null;
  whitePlayerName: string | null;
  blackPlayerName: string | null;
  whiteRating: number | null;
  blackRating: number | null;
  spectators: string[];
  gameState: GameState;
  timeControl: TimeControl;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  drawOffer: PieceColor | null;
  ownerColorPreference: PrivateGameColorPreference;
  gameMode: GameMode;
  rated: boolean;
  whitePresence: PlayerPresence;
  blackPresence: PlayerPresence;
}

export interface ClientGameState {
  board: Board;
  turn: PieceColor;
  moveHistory: Move[];
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
  status: 'waiting' | 'playing' | 'finished';
  playerColor: PieceColor | null;
  whitePlayerName: string | null;
  blackPlayerName: string | null;
  whiteRating: number | null;
  blackRating: number | null;
  drawOffer: PieceColor | null;
  gameId: string;
  gameMode: GameMode;
  rated: boolean;
  whitePresence: PlayerPresence;
  blackPresence: PlayerPresence;
}

export interface RatingChangeSummary {
  whiteBefore: number;
  blackBefore: number;
  whiteAfter: number;
  blackAfter: number;
}

export interface PublicLiveGameSummary {
  id: string;
  status: 'playing' | 'finished';
  whitePlayerName: string | null;
  blackPlayerName: string | null;
  whiteRating: number | null;
  blackRating: number | null;
  timeControl: TimeControl;
  moveCount: number;
  spectatorCount: number;
  rated: boolean;
  gameMode: GameMode;
  createdAt: number;
  lastMoveAt: number;
}

// Socket.IO Event types
export interface ServerToClientEvents {
  game_created: (data: { gameId: string }) => void;
  game_joined: (data: { color: PieceColor | null; gameState: ClientGameState }) => void;
  game_state: (data: ClientGameState) => void;
  presence_update: (data: { gameId: string; whitePresence: PlayerPresence; blackPresence: PlayerPresence }) => void;
  heartbeat_ack: (data: { sentAt: number }) => void;
  move_made: (data: { move: Move; gameState: ClientGameState }) => void;
  game_over: (data: { reason: string; winner: PieceColor | null; gameState: ClientGameState; ratingChange: RatingChangeSummary | null }) => void;
  clock_update: (data: { whiteTime: number; blackTime: number }) => void;
  draw_offered: (data: { by: PieceColor }) => void;
  draw_declined: () => void;
  rematch_offered: (data: { by: PieceColor }) => void;
  opponent_disconnected: () => void;
  opponent_reconnected: () => void;
  error: (data: { message: string }) => void;
  matchmaking_started: () => void;
  matchmaking_found: (data: { gameId: string; color: PieceColor }) => void;
  matchmaking_cancelled: () => void;
  queue_status: (data: { playersInQueue: number }) => void;
  game_left: (data: { gameId: string }) => void;
}

export interface ClientToServerEvents {
  create_game: (data: { timeControl: TimeControl; colorPreference: PrivateGameColorPreference }) => void;
  join_game: (data: { gameId: string }) => void;
  spectate_game: (data: { gameId: string }) => void;
  presence_heartbeat: (data: {
    gameId: string;
    sentAt: number;
    clientStatus: Exclude<PlayerPresenceStatus, 'disconnected'>;
    latencyMs?: number | null;
  }) => void;
  leave_game: (data: { gameId?: string }) => void;
  make_move: (data: { from: Position; to: Position }) => void;
  resign: () => void;
  start_counting: () => void;
  stop_counting: () => void;
  offer_draw: () => void;
  respond_draw: (data: { accept: boolean }) => void;
  request_rematch: () => void;
  find_game: (data: { timeControl: TimeControl }) => void;
  cancel_matchmaking: () => void;
}

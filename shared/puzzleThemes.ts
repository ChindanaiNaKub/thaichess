export type PuzzleThemeFamily = 'mate' | 'promotion' | 'material' | 'future';

export interface PuzzleThemeDefinition {
  key: string;
  family: PuzzleThemeFamily;
  note: string;
}

const THEME_DEFINITIONS: PuzzleThemeDefinition[] = [
  { key: 'Checkmate', family: 'mate', note: 'Generic Makruk mating puzzle label.' },
  { key: 'BasicCheckmate', family: 'mate', note: 'Basic mating patterns such as rook-and-king or supported mating nets.' },
  { key: 'MateIn1', family: 'mate', note: 'One-move Makruk mate.' },
  { key: 'MateIn2', family: 'mate', note: 'Two-move Makruk mate.' },
  { key: 'MateIn3', family: 'mate', note: 'Three-or-more move Makruk mate.' },
  { key: 'BackRank', family: 'mate', note: 'Back-rank mating patterns still exist in Makruk with trapped kings and rooks.' },
  { key: 'MatingNet', family: 'mate', note: 'Quiet or forcing moves that tighten the net around the king.' },
  { key: 'SupportMate', family: 'mate', note: 'A mating move supported by another Makruk piece.' },
  { key: 'SmotheredMate', family: 'mate', note: 'Knight mate against a king boxed in by its own army.' },
  { key: 'Promotion', family: 'promotion', note: 'Makruk pawn promotion always creates a met, so promotion themes stay distinct.' },
  { key: 'Tactic', family: 'material', note: 'Generic material-winning tactical puzzle label.' },
  { key: 'Fork', family: 'material', note: 'Single-piece double attacks, often by ma or bia.' },
  { key: 'DoubleAttack', family: 'material', note: 'Two simultaneous threats in a material-winning sequence.' },
  { key: 'Pin', family: 'material', note: 'A line piece freezes a defender against a more valuable target.' },
  { key: 'Skewer', family: 'material', note: 'A valuable piece is attacked first and a lesser piece falls behind it.' },
  { key: 'Discovery', family: 'material', note: 'A revealed line attack after a piece steps away.' },
  { key: 'DoubleCheck', family: 'material', note: 'Two pieces give check on the same move.' },
  { key: 'HangingPiece', family: 'material', note: 'The tactic wins a loose or undefended piece.' },
  { key: 'TrappedPiece', family: 'material', note: 'The line leaves a piece with no safe escape.' },
  { key: 'Interference', family: 'material', note: 'A move blocks a defending line or coordination link.' },
  { key: 'Overloading', family: 'material', note: 'A defender is forced to guard too many things at once.' },
  { key: 'RemovalOfDefender', family: 'material', note: 'A key defensive piece is eliminated to win material or mate.' },
  { key: 'Decoy', family: 'material', note: 'A target is lured onto a bad square.' },
  { key: 'Deflection', family: 'material', note: 'A defender is dragged away from its duty.' },
  { key: 'Clearance', family: 'material', note: 'A sacrifice or forcing move clears a file, rank, or diagonal.' },
  { key: 'Sacrifice', family: 'material', note: 'Material is given up to gain a larger tactical reward.' },
  { key: 'ExchangeSacrifice', family: 'material', note: 'A rook is traded for a minor piece to unlock a larger gain.' },
  { key: 'Desperado', family: 'material', note: 'A doomed piece grabs material before it disappears.' },
  { key: 'Simplification', family: 'material', note: 'A forcing line converts an advantage into a cleaner win.' },
  { key: 'Endgame', family: 'material', note: 'Tactics arising in stripped-down Makruk endgames.' },
  { key: 'XRay', family: 'material', note: 'A long-range line attacks through an occupied square.' },
  { key: 'Windmill', family: 'material', note: 'Repeated discovered attacks let one piece keep harvesting material.' },
  { key: 'Zwischenzug', family: 'material', note: 'An in-between move changes the expected sequence.' },
  { key: 'VulnerableKing', family: 'future', note: 'Makruk replacement for castled-king and f7/f2 style king-shelter themes.' },
  { key: 'Defense', family: 'future', note: 'Defensive or prophylactic tactics need draw/hold validation support first.' },
  { key: 'PerpetualCheck', family: 'future', note: 'Perpetual check is a draw outcome, not a material or mate outcome.' },
  { key: 'Stalemate', family: 'future', note: 'Stalemate tactics require draw-goal validation support.' },
];

const THEMES_BY_KEY = new Map(THEME_DEFINITIONS.map(definition => [definition.key, definition]));

export const PUZZLE_THEME_DEFINITIONS = THEME_DEFINITIONS;
export const PUZZLE_THEME_KEYS = THEME_DEFINITIONS.map(definition => definition.key);

export function getPuzzleThemeDefinition(theme: string): PuzzleThemeDefinition | undefined {
  return THEMES_BY_KEY.get(theme);
}

export function isMateTheme(theme: string): boolean {
  return getPuzzleThemeDefinition(theme)?.family === 'mate';
}

export function isPromotionTheme(theme: string): boolean {
  return getPuzzleThemeDefinition(theme)?.family === 'promotion';
}

export function isTacticalTheme(theme: string): boolean {
  return getPuzzleThemeDefinition(theme)?.family === 'material';
}

export function isFuturePuzzleTheme(theme: string): boolean {
  return getPuzzleThemeDefinition(theme)?.family === 'future';
}

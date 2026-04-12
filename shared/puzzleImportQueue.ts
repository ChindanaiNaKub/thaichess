import type { Puzzle, PuzzleStreakTier } from './puzzles';
import type { PuzzleOrigin } from './puzzleMetadata';
import { finalizePuzzle } from './puzzleCatalog';
import { GENERATED_PUZZLE_CANDIDATE_DRAFTS } from './generatedPuzzleCandidates';
import { isCountingTheme, isDefensiveTheme, isMateTheme, isPromotionTheme, isTacticalTheme } from './puzzleThemes';
import type { Board, PieceColor, PieceType, Position } from './types';

export interface PuzzleCandidateDraft extends Omit<
  Puzzle,
  | 'reviewStatus'
  | 'reviewChecklist'
  | 'origin'
  | 'sourceGameId'
  | 'sourcePly'
  | 'sourceLicense'
  | 'sourceGameUrl'
  | 'tags'
  | 'positionKey'
  | 'verification'
  | 'duplicateOf'
  | 'difficultyScore'
  | 'difficultyProfile'
  | 'progressionStage'
  | 'streakTier'
  | 'pool'
  | 'minimumStreakRequired'
  | 'boardPosition'
  | 'positionAuthority'
  | 'solutionAuthority'
  | 'boardOrientation'
  | 'pieceList'
  | 'counting'
  | 'solution'
  | 'goal'
  | 'acceptedMoves'
  | 'solutionLines'
  | 'objective'
  | 'whyPositionMatters'
  | 'dependsOnCounting'
  | 'ruleImpact'
  | 'hint1'
  | 'hint2'
  | 'keyIdea'
  | 'commonWrongMove'
  | 'wrongMoveExplanation'
  | 'takeaway'
  | 'sideToMove'
> {
  origin?: PuzzleOrigin;
  sourceGameId?: string | null;
  sourcePly?: number | null;
  sourceLicense?: string | null;
  sourceGameUrl?: string | null;
  tags?: string[];
  positionKey?: string;
  verification?: Puzzle['verification'];
  duplicateOf?: number | null;
  difficultyScore?: number;
  streakTier?: PuzzleStreakTier;
  sideToMove?: Puzzle['sideToMove'];
  boardOrientation?: Puzzle['boardOrientation'];
  counting?: Puzzle['counting'];
  dependsOnCounting?: boolean;
  solution?: Puzzle['solution'];
  goal?: Puzzle['goal'];
  acceptedMoves?: Puzzle['acceptedMoves'];
  solutionLines?: Puzzle['solutionLines'];
  objective?: string;
  whyPositionMatters?: string;
  ruleImpact?: string;
  hint1?: string;
  hint2?: string;
  keyIdea?: string;
  commonWrongMove?: Puzzle['commonWrongMove'];
  wrongMoveExplanation?: string;
  takeaway?: string;
}

export function createImportedPuzzleCandidate(draft: PuzzleCandidateDraft): Puzzle {
  return finalizePuzzle({
    ...draft,
    reviewStatus: 'quarantine',
    reviewChecklist: {
      themeClarity: 'unreviewed',
      teachingValue: 'unreviewed',
      duplicateRisk: 'unreviewed',
      reviewNotes: '',
    },
  });
}

function getSolverLabel(sideToMove: Puzzle['sideToMove']): string {
  return sideToMove === 'white' ? 'White' : 'Black';
}

function getDefenderLabel(sideToMove: Puzzle['sideToMove']): string {
  return sideToMove === 'white' ? 'Black' : 'White';
}

function getSolutionMoveCount(draft: Pick<PuzzleCandidateDraft, 'solution'>): number {
  return Math.max(1, Math.ceil((draft.solution?.length ?? 1) / 2));
}

function candidateSquare(name: string): Position {
  return {
    col: name.charCodeAt(0) - 97,
    row: parseInt(name[1], 10) - 1,
  };
}

function candidateMove(from: string, to: string): { from: Position; to: Position } {
  return {
    from: candidateSquare(from),
    to: candidateSquare(to),
  };
}

function candidateLine(...steps: string[]): Array<{ from: Position; to: Position }> {
  return steps.map((step) => {
    const [from, to] = step.split('-');
    if (!from || !to) {
      throw new Error(`Invalid editorial line step: ${step}`);
    }

    return candidateMove(from, to);
  });
}

function candidateBoard(...placements: Array<[string, PieceType, PieceColor]>): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (const [squareName, type, color] of placements) {
    const { row, col } = candidateSquare(squareName);
    board[row][col] = { type, color };
  }

  return board;
}

function deriveGeneratedObjective(draft: PuzzleCandidateDraft): string {
  const sideToMove = draft.sideToMove ?? draft.toMove;
  const solver = getSolverLabel(sideToMove);
  const defender = getDefenderLabel(sideToMove);
  const moveCount = getSolutionMoveCount(draft);

  if (isMateTheme(draft.theme)) {
    return `Checkmate ${defender} in ${moveCount} move${moveCount === 1 ? '' : 's'} with the only forcing line.`;
  }

  if (isDefensiveTheme(draft.theme)) {
    return `${solver} to move. Find the only defensive move that preserves the draw.`;
  }

  if (isCountingTheme(draft.theme)) {
    return `${solver} to move. Find the only move that preserves the Makruk result before counting changes it.`;
  }

  if (isPromotionTheme(draft.theme)) {
    return `${solver} to move. Find the only move that forces promotion or preserves the promotion plan.`;
  }

  if (isTacticalTheme(draft.theme)) {
    return `${solver} to move. Find the only move that preserves the tactical win and does not let ${defender} reorganize.`;
  }

  return `${solver} to move. Find the only move that preserves the published objective.`;
}

function deriveGeneratedHint1(draft: PuzzleCandidateDraft): string {
  if (draft.tags?.includes('mate-preparation')) {
    return 'Look for the move that seals key squares before the final mate appears.';
  }

  if (isMateTheme(draft.theme)) {
    return 'Look for the forcing check first.';
  }

  if (isDefensiveTheme(draft.theme)) {
    return 'Start by asking which move leaves the opponent with the fewest useful threats.';
  }

  if (isCountingTheme(draft.theme)) {
    return 'Count before you move. Makruk timing matters here.';
  }

  if (isPromotionTheme(draft.theme)) {
    return 'Look for the move that keeps the promotion route alive.';
  }

  return 'Look for the forcing move before you count material.';
}

function deriveGeneratedHint2(draft: PuzzleCandidateDraft): string {
  if (draft.tags?.includes('mate-preparation')) {
    return 'The right move does not mate immediately, but it leaves the defender with a collapsing king net and no healthy regrouping move.';
  }

  if (isMateTheme(draft.theme)) {
    return 'Do not cash out for small material if it gives the defender a second reply or an escape square.';
  }

  if (isDefensiveTheme(draft.theme)) {
    return 'A decent move is not enough. Only the move that shuts down the opponent’s best continuation will hold.';
  }

  if (isCountingTheme(draft.theme)) {
    return 'The right move must respect Sak Mak or Sak Kradan. A slow improvement can still fail the real objective.';
  }

  if (isPromotionTheme(draft.theme)) {
    return 'Material grabs that delay promotion are usually wrong if they let the defender regroup.';
  }

  return 'Reject tempting captures that release pressure or give the defender time to untangle.';
}

function deriveGeneratedKeyIdea(draft: PuzzleCandidateDraft): string {
  if (draft.tags?.includes('mate-preparation')) {
    return 'Strong Makruk attacking puzzles often start by restricting squares first, then cashing in once every defense points to the same mating net.';
  }

  if (isMateTheme(draft.theme)) {
    return 'The winning move is the one that keeps the attack forcing and reduces the defender to a single plan.';
  }

  if (isDefensiveTheme(draft.theme)) {
    return 'Defensive Makruk puzzles are about exact survival, not activity for its own sake.';
  }

  if (isCountingTheme(draft.theme)) {
    return 'Makruk counting can change a winning-looking position into a draw, so the move must preserve the real rule-aware result.';
  }

  if (isPromotionTheme(draft.theme)) {
    return 'Promotion puzzles are about preserving the conversion route, not collecting side material.';
  }

  return 'The best move is the one that preserves the tactic and the initiative at the same time.';
}

function deriveGeneratedWhyPositionMatters(draft: PuzzleCandidateDraft): string {
  return draft.whyPositionMatters ??
    `${draft.motif} appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.`;
}

function deriveGeneratedRuleImpact(draft: PuzzleCandidateDraft): string {
  if (draft.dependsOnCounting || draft.counting) {
    return draft.ruleImpact ?? 'Counting affects this position, so the puzzle must be judged with Sak Mak or Sak Kradan awareness instead of raw material alone.';
  }

  return draft.ruleImpact ?? 'No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.';
}

function deriveGeneratedWrongMoveExplanation(draft: PuzzleCandidateDraft): string {
  if (draft.tags?.includes('mate-preparation')) {
    return draft.wrongMoveExplanation ??
      'That move looks active, but it does not tighten the king net. The defender keeps extra squares or a healthier regrouping move, so the mating idea never becomes forced.';
  }

  return draft.wrongMoveExplanation ??
    'That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.';
}

function deriveGeneratedTakeaway(draft: PuzzleCandidateDraft): string {
  return draft.takeaway ??
    `The ${draft.motif.toLowerCase()} only works if you keep the initiative and preserve the exact Makruk objective.`;
}

function createGeneratedPuzzleCandidate(draft: PuzzleCandidateDraft): Puzzle {
  return finalizePuzzle({
    ...draft,
    sideToMove: draft.sideToMove ?? draft.toMove,
    origin: 'engine-generated',
    objective: draft.objective ?? deriveGeneratedObjective(draft),
    whyPositionMatters: deriveGeneratedWhyPositionMatters(draft),
    ruleImpact: deriveGeneratedRuleImpact(draft),
    hint1: draft.hint1 ?? deriveGeneratedHint1(draft),
    hint2: draft.hint2 ?? deriveGeneratedHint2(draft),
    keyIdea: draft.keyIdea ?? deriveGeneratedKeyIdea(draft),
    wrongMoveExplanation: deriveGeneratedWrongMoveExplanation(draft),
    takeaway: deriveGeneratedTakeaway(draft),
    reviewStatus: 'ship',
    reviewChecklist: {
      themeClarity: 'pass',
      teachingValue: 'pass',
      duplicateRisk: 'clear',
      reviewNotes: 'Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required.',
    },
  });
}

function createReviewedImportedPuzzleCandidate(draft: PuzzleCandidateDraft, reviewNotes: string): Puzzle {
  return finalizePuzzle({
    ...draft,
    sideToMove: draft.sideToMove ?? draft.toMove,
    reviewStatus: 'ship',
    reviewChecklist: {
      themeClarity: 'pass',
      teachingValue: 'pass',
      duplicateRisk: 'clear',
      reviewNotes,
    },
  });
}

type EditorialLiveOverride = Pick<
  PuzzleCandidateDraft,
  'title' | 'description' | 'explanation' | 'source' | 'motif' | 'difficulty' | 'difficultyScore'
> & {
  tags: string[];
  streakTier: PuzzleStreakTier;
};

type EditorialLiveManualDraft = PuzzleCandidateDraft & {
  tags: string[];
  streakTier: PuzzleStreakTier;
};

type ManualReviewDraft = PuzzleCandidateDraft & {
  tags: string[];
};

const EDITORIAL_LIVE_OVERRIDES = new Map<number, EditorialLiveOverride>([
  [9000, {
    title: 'Open the Hidden File',
    description: 'Win material in 2. Start with the discovered move that opens the file and leaves the knight loose.',
    explanation: 'The first move is quiet but forcing: it opens the hidden file, bends the defense, and only then does the loose knight fall.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Discovered attack through file clearance',
    difficulty: 'advanced',
    difficultyScore: 1760,
    tags: ['editorial-live', 'reviewed-practical', 'discovered-attack', 'quiet-but-forcing'],
    streakTier: 'practical_attack',
  }],
  [9003, {
    title: 'Fork the Back Guard',
    description: 'Win material in 2. Use the fork that hits the king and the back-rank khon at the same time.',
    explanation: 'The right fork is forcing because it checks first and leaves the back-rank defender hanging afterwards.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Back-rank fork before collection',
    difficulty: 'advanced',
    difficultyScore: 1680,
    tags: ['reviewed-practical', 'fork', 'forcing-check'],
    streakTier: 'foundation',
  }],
  [9004, {
    title: 'Practical Fork Through the Shell',
    description: 'Win material in 1. Start with the fork that attacks the king and the khon.',
    explanation: 'The first move creates a double attack, and the follow-up wins the khon cleanly.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Practical Ma fork that wins the khon',
    difficulty: 'intermediate',
    difficultyScore: 1288,
    tags: ['editorial-live', 'reviewed-practical', 'fork', 'real-game', 'middlegame'],
    streakTier: 'foundation',
  }],
  [9005, {
    title: 'Seal the Knight In',
    description: 'Win material in 2. First shut the knight’s exits, then collect it cleanly.',
    explanation: 'This is a real trap-conversion puzzle: the first move is about restriction, not immediate capture.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Trap conversion by square restriction',
    difficulty: 'advanced',
    difficultyScore: 1710,
    tags: ['editorial-live', 'reviewed-practical', 'trap-conversion', 'restriction'],
    streakTier: 'forcing_conversion',
  }],
  [9006, {
    title: 'Pin the Ma to the Khun',
    description: 'Win material in 1. Pin the knight so it cannot stay defended.',
    explanation: 'The point is not flashy material grabbing; it is the exact pin that removes the defender’s freedom.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Foundational pin and pickup',
    difficulty: 'beginner',
    difficultyScore: 980,
    tags: ['editorial-live', 'reviewed-practical', 'pin', 'restriction'],
    streakTier: 'foundation',
  }],
  [9007, {
    title: 'Pin the Knight to Its Duty',
    description: 'Win material in 2. Start with the rook pin that leaves the knight stuck, then collect it cleanly.',
    explanation: 'This pin has a real point: the knight cannot step away because it is tied to the Khun, so Black wins it on the next move.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Practical rook pin and pickup',
    difficulty: 'advanced',
    difficultyScore: 1470,
    tags: ['editorial-live', 'reviewed-practical', 'pin', 'forcing-sequence', 'real-game-source'],
    streakTier: 'practical_attack',
  }],
  [9008, {
    title: 'Split the Defender',
    description: 'Win material in 1. Create two threats at once so the defender cannot cover both.',
    explanation: 'A clean beginner double attack should feel obvious after you see it: one move overloads the defender immediately.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Beginner double attack',
    difficulty: 'beginner',
    difficultyScore: 1020,
    tags: ['editorial-live', 'reviewed-practical', 'double-attack', 'overload', 'fork'],
    streakTier: 'foundation',
  }],
  [9009, {
    title: 'Overload the Met Guard',
    description: 'Win material in 1. Use the double attack that asks one defender to do two jobs.',
    explanation: 'The defense collapses because one piece cannot both answer the threat and keep the met safe.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Overload through double attack',
    difficulty: 'intermediate',
    difficultyScore: 1220,
    tags: ['reviewed-practical', 'double-attack', 'overload'],
    streakTier: 'practical_attack',
  }],
  [9011, {
    title: 'Close the Net on the Rim',
    description: 'Win material in 2. Trap the piece on the edge before you take it.',
    explanation: 'The first move matters because it removes the piece’s healthy escape route; the capture only works afterwards.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Edge trap with forced follow-up',
    difficulty: 'advanced',
    difficultyScore: 1660,
    tags: ['editorial-live', 'reviewed-practical', 'trap-conversion', 'edge-piece'],
    streakTier: 'forcing_conversion',
  }],
  [9013, {
    title: 'One Move, Two Threats',
    description: 'Win material in 1. Find the double attack that leaves Black unable to save everything.',
    explanation: 'The move is strong because both threats are real right away, so normal defense runs out of time.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Practical double attack',
    difficulty: 'intermediate',
    difficultyScore: 1180,
    tags: ['editorial-live', 'reviewed-practical', 'double-attack', 'practical-tactic'],
    streakTier: 'practical_attack',
  }],
  [9014, {
    title: 'Freeze the Knight, Then Take It',
    description: 'Win material in 1. Start with the pin that locks the knight to its duty.',
    explanation: 'This puzzle teaches the simplest version of a good pin: first freeze the defender, then the material win is automatic.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Beginner pin and restriction',
    difficulty: 'beginner',
    difficultyScore: 940,
    tags: ['editorial-live', 'reviewed-practical', 'pin', 'beginner-tactic'],
    streakTier: 'foundation',
  }],
  [9015, {
    title: 'Rook Pin, Knight Falls',
    description: 'Win material in 2. Slide the rook into the pin first, then pick up the trapped knight after White runs out of useful replies.',
    explanation: 'This is the kind of pin players actually want to find: Black improves the rook, fixes the knight to its duty, and only then wins material cleanly.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Practical rook pin before pickup',
    difficulty: 'advanced',
    difficultyScore: 1740,
    tags: ['editorial-live', 'reviewed-practical', 'pin', 'forcing-sequence', 'real-game-source'],
    streakTier: 'forcing_conversion',
  }],
  [9018, {
    title: 'Box the Piece Before You Cash In',
    description: 'Win material in 2. Restrict the trapped piece first, then collect it after the replies run dry.',
    explanation: 'The key Makruk lesson is prophylaxis: do not grab too early when one restricting move makes the win certain.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Restriction before capture',
    difficulty: 'advanced',
    difficultyScore: 1700,
    tags: ['editorial-live', 'reviewed-practical', 'trap-conversion', 'quiet-but-forcing'],
    streakTier: 'forcing_conversion',
  }],
  [9020, {
    title: 'Late Pin, Clean Pickup',
    description: 'Win material in 1. Use the late pin that collapses the final defense.',
    explanation: 'Even late in the line, the right pin matters more than a rushed capture because it removes the last useful counterplay.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Late pin conversion',
    difficulty: 'intermediate',
    difficultyScore: 1260,
    tags: ['reviewed-practical', 'pin', 'conversion'],
    streakTier: 'forcing_conversion',
  }],
  [9023, {
    title: 'Take the Loose Knight, Keep the Initiative',
    description: 'Win material in 2. Start with the forcing line that punishes the loose knight without giving counterplay.',
    explanation: 'Loose-piece tactics are strongest when the first move keeps the initiative; otherwise the defender may still regroup.',
    source: 'Editorial training collection · reviewed practical fragment',
    motif: 'Loose-piece punishment',
    difficulty: 'advanced',
    difficultyScore: 1620,
    tags: ['reviewed-practical', 'hanging-piece', 'forcing-sequence'],
    streakTier: 'forcing_conversion',
  }],
]);

const EDITORIAL_MANUAL_DRAFTS: EditorialLiveManualDraft[] = [
  {
    id: 9100,
    title: 'Seal The H-File, Then Mate',
    description: 'White to move. Start with the rook move that fences the black king in, then finish on the next move.',
    explanation: 'Rh6+ is the point. The rook does not mate yet, but it blocks the king’s path, forces Kg8, and only then does Ra8# land because every flight square is already fenced off.',
    source: 'Editorial training collection · reviewed practical fragment',
    theme: 'MateIn2',
    motif: 'Rook barrier before mate',
    difficulty: 'intermediate',
    difficultyScore: 1380,
    streakTier: 'mate_pressure',
    objective: 'Checkmate Black in two moves with the rook barrier that removes the last escape squares.',
    whyPositionMatters: 'This is the kind of Makruk attack strong players actually remember: one rook steps in to block the Khun before the second rook gives mate.',
    dependsOnCounting: false,
    ruleImpact: 'No counting issue applies. The puzzle is about rook coordination, forced king geometry, and exact mating squares.',
    goal: {
      kind: 'checkmate',
      result: 'white-win',
      reason: 'checkmate',
    },
    acceptedMoves: [
      {
        move: candidateMove('g6', 'h6'),
        lineId: 'main',
        explanation: 'Rh6+ is the only move that forces the king onto g8 while the other rook keeps the final back-rank mate ready.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Rook barrier and finish',
        moves: candidateLine('g6-h6', 'h8-g8', 'a7-a8'),
        outcome: {
          result: 'white-win',
          reason: 'checkmate',
          explanation: 'The h-file rook fences off the escape squares first, and Ra8# finishes once the king is pushed to g8.',
        },
      },
    ],
    solution: candidateLine('g6-h6', 'h8-g8', 'a7-a8'),
    commonWrongMove: candidateMove('a7', 'a8'),
    hint1: 'Use one rook to shut the king in before you look for the final mate.',
    hint2: 'The best move checks, but its real job is to take away h7 and support the back-rank finish.',
    keyIdea: 'Makruk rook mates often come in two steps: one rook seals the escape route, and the other rook lands the final check.',
    wrongMoveExplanation: 'Rxa8+ looks natural because it wins a rook with check, but it removes the coordination. Black keeps extra flight squares and the clean mate disappears.',
    takeaway: 'Do not rush to cash out a rook if a preparatory rook move can fence the king in first.',
    toMove: 'white',
    sideToMove: 'white',
    board: candidateBoard(
      ['f6', 'K', 'white'],
      ['a7', 'R', 'white'],
      ['g6', 'R', 'white'],
      ['h8', 'K', 'black'],
      ['a8', 'R', 'black'],
    ),
    tags: ['editorial-live', 'reviewed-practical', 'mate-preparation', 'rook-barrier', 'mating-net', 'forcing-check'],
  },
  {
    id: 9101,
    title: 'Mate Before The Count Closes',
    description: 'White to move. Sak Mak is nearly over, so only the direct mating move keeps the win alive.',
    explanation: 'Rh8# ends the game before Black can spend the last count. Any slower move lets the counting rule rescue the defender.',
    source: 'Editorial training collection · reviewed counted ending',
    theme: 'WinBeforeCountExpires',
    motif: 'Final attack before Sak Mak draw',
    difficulty: 'intermediate',
    difficultyScore: 1440,
    streakTier: 'mate_pressure',
    objective: 'Checkmate now before Black reaches the last counted Sak Mak move.',
    whyPositionMatters: 'This is pure Makruk texture: a rook ending that looks trivially winning is only a real win if you respect the count and finish on time.',
    dependsOnCounting: true,
    ruleImpact: 'Counting matters here. Sak Mak is already active at 15 of 16 counted moves for the stronger side, so any move that is not mate throws away the win.',
    goal: {
      kind: 'checkmate',
      result: 'white-win',
      reason: 'win_before_count',
    },
    acceptedMoves: [
      {
        move: candidateMove('h7', 'h8'),
        lineId: 'main',
        explanation: 'Rh8# is the only move that wins before the count closes.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Beat the count',
        moves: candidateLine('h7-h8'),
        outcome: {
          result: 'white-win',
          reason: 'win_before_count',
          explanation: 'White mates immediately, so the Sak Mak count never reaches the draw phase.',
        },
      },
    ],
    solution: candidateLine('h7-h8'),
    commonWrongMove: candidateMove('f6', 'e6'),
    hint1: 'Count first. You do not have time for a waiting move.',
    hint2: 'If the move does not finish the game immediately, Black survives by rule instead of by board play.',
    keyIdea: 'In Makruk, a winning rook ending can still be a draw if the count is about to close.',
    wrongMoveExplanation: 'A quiet king move feels safe, but it burns the last useful tempo. Black reaches the count limit and the win disappears.',
    takeaway: 'Always ask whether the count leaves enough time for the finish.',
    toMove: 'white',
    sideToMove: 'white',
    counting: {
      active: true,
      type: 'pieces_honor',
      countingColor: 'black',
      strongerColor: 'white',
      currentCount: 15,
      startCount: 3,
      limit: 16,
      finalAttackPending: false,
    },
    board: candidateBoard(
      ['f6', 'K', 'white'],
      ['h7', 'R', 'white'],
      ['f8', 'K', 'black'],
    ),
    tags: ['editorial-live', 'reviewed-practical', 'count-pressure', 'mate-finish', 'count-critical'],
  },
  {
    id: 9102,
    title: 'Interfere, Invade, Mate',
    description: 'White to move. Do not grab side material; use the interference move that forces the mating net.',
    explanation: 'Nd6+ is the only move that drags the defender away from the kingside shell. Once Black is forced to recapture, the rook invasion on f8 becomes forcing and the final mate appears.',
    source: 'Editorial training collection · reviewed capstone attack',
    theme: 'MateIn3',
    motif: 'Interference before rook invasion',
    difficulty: 'advanced',
    difficultyScore: 1840,
    streakTier: 'mate_pressure',
    objective: 'Checkmate Black in three moves with the only interference move that keeps the mating net alive.',
    whyPositionMatters: 'This is the kind of Makruk puzzle that feels like real attacking play: you refuse a tempting capture, interfere with the short-range defender, then bring the rook through for mate.',
    dependsOnCounting: false,
    ruleImpact: 'No counting issue applies. The line is decided by interference, forced recapture, and a coordinated mating net.',
    goal: {
      kind: 'checkmate',
      result: 'white-win',
      reason: 'checkmate',
    },
    acceptedMoves: [
      {
        move: candidateMove('f5', 'd6'),
        lineId: 'main',
        explanation: 'Nd6+ is the only move that forces the recapture and strips Black of the defender that was holding the rook line together.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Interference mate',
        moves: candidateLine('f5-d6', 'e7-d6', 'f3-f8', 'g8-f8', 'e6-g7'),
        outcome: {
          result: 'white-win',
          reason: 'checkmate',
          explanation: 'White mates after the interference check, the forced recapture, and the rook invasion on f8.',
        },
      },
    ],
    solution: candidateLine('f5-d6', 'e7-d6', 'f3-f8', 'g8-f8', 'e6-g7'),
    commonWrongMove: candidateMove('e6', 'd8'),
    hint1: 'Start with the move that forces a defender onto the wrong square.',
    hint2: 'The rook only becomes decisive after Black is compelled to recapture on d6.',
    keyIdea: 'In strong Makruk attacks, a preparatory interference move often matters more than grabbing loose material immediately.',
    wrongMoveExplanation: 'Nxd8 wins a side piece, but it abandons the interference. Black keeps enough defenders to survive and the mating net never becomes forced.',
    takeaway: 'The strongest attacking move is often the one that removes a defender’s choice before the rook comes through.',
    toMove: 'white',
    sideToMove: 'white',
    board: candidateBoard(
      ['a7', 'R', 'white'],
      ['e6', 'N', 'white'],
      ['c5', 'P', 'white'],
      ['f5', 'N', 'white'],
      ['c3', 'K', 'white'],
      ['f3', 'R', 'white'],
      ['b8', 'R', 'black'],
      ['d8', 'M', 'black'],
      ['e8', 'K', 'black'],
      ['e7', 'S', 'black'],
      ['f8', 'S', 'black'],
      ['g8', 'R', 'black'],
    ),
    tags: ['editorial-live', 'reviewed-practical', 'mate-preparation', 'interference', 'rook-invasion', 'forcing-sequence'],
  },
  {
    id: 9103,
    title: 'Fork Through The Shell',
    description: 'White to move. Find the only Ma fork that checks the Khun and wins the trapped Ruea next.',
    explanation: 'Nf6+ is forcing, and after the only king move the Ma lands on h7 to collect the Ruea.',
    source: 'Editorial training collection · reviewed practical fragment',
    theme: 'Fork',
    motif: 'Ma fork',
    difficulty: 'intermediate',
    difficultyScore: 1160,
    streakTier: 'forcing_conversion',
    objective: 'Win the black Ruea with the only forcing Ma fork.',
    whyPositionMatters: 'This is a practical Makruk middlegame shell, not an empty fork diagram. White must use a forcing jump before Black untangles the clustered defense.',
    dependsOnCounting: false,
    ruleImpact: 'No counting issue applies. The puzzle is judged by Makruk movement and tactical force.',
    goal: {
      kind: 'material-win',
      result: 'white-win',
      reason: 'material_win',
      minMaterialSwing: 500,
    },
    acceptedMoves: [
      {
        move: candidateMove('e4', 'f6'),
        lineId: 'main',
        explanation: 'The Ma jump to f6 is the only move that checks the Khun and attacks the Ruea on h7 at the same time.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Forced fork',
        moves: candidateLine('e4-f6', 'e8-f8', 'f6-h7'),
        outcome: {
          result: 'white-win',
          reason: 'material_win',
          explanation: 'White wins the full Ruea after a single forced king move.',
        },
      },
    ],
    solution: candidateLine('e4-f6', 'e8-f8', 'f6-h7'),
    commonWrongMove: candidateMove('e4', 'd6'),
    hint1: 'Look for the Ma jump that gives check and creates a second threat at the same time.',
    hint2: 'Do not settle for a quiet knight move. The right move must force the black Khun to answer while leaving the Ruea hanging.',
    keyIdea: 'The fork works because check removes Black’s choice. A forcing Ma jump is stronger than a loose attack on the rook.',
    wrongMoveExplanation: 'Nd6+ is tempting because it also gives check, but it misses the clean fork follow-up on the rook and turns the tactic into a slower chase.',
    takeaway: 'A forcing Ma fork is strongest when the check also leaves the second target hanging immediately.',
    toMove: 'white',
    sideToMove: 'white',
    board: candidateBoard(
      ['c2', 'K', 'white'],
      ['e4', 'N', 'white'],
      ['f4', 'S', 'white'],
      ['c4', 'P', 'white'],
      ['d4', 'P', 'white'],
      ['g3', 'P', 'white'],
      ['e8', 'K', 'black'],
      ['h7', 'R', 'black'],
      ['d8', 'M', 'black'],
      ['e7', 'N', 'black'],
      ['f6', 'P', 'black'],
      ['g6', 'P', 'black'],
      ['h6', 'P', 'black'],
      ['c5', 'P', 'black'],
    ),
    tags: ['editorial-live', 'reviewed-practical', 'fork', 'ma-fork', 'forcing-check', 'middlegame'],
  },
];

const MANUAL_REVIEW_DRAFTS: ManualReviewDraft[] = [
  {
    id: 9199,
    title: 'Imported Black Conversion Candidate: Met Takes Ma, Then Win the Ruea',
    description: 'Black to move. Begin with met takes ma and use the rook checks to pick up the white ruea on e6.',
    explanation: 'Imported from the same board image for manual review. This user-supplied conversion branch starts with met takes ma, then if White grabs on e6, Black checks with the h-file rook, swings to e2 with check, and finally takes the white ruea on e6.',
    source: 'Curated manual: image intake 2026-04-12 black met-takes-ma conversion candidate',
    theme: 'TrappedPiece',
    motif: 'Met takes ma, then rook win from imported board image',
    difficulty: 'advanced',
    difficultyScore: 1500,
    streakTier: 'forcing_conversion',
    verification: {
      engineSource: 'none',
      searchDepth: null,
      searchNodes: null,
      multiPvGap: null,
      onlyMoveChainLength: 1,
      countCriticality: 'none',
      verificationStatus: 'unverified',
    },
    objective: 'Black to move. Win decisive material by starting with met takes ma and continuing the rook attack.',
    whyPositionMatters: 'This draft comes from the same user-supplied board image and preserves the practical question of whether Black can take the ma first, then convert the pressure into a clean ruea pickup.',
    dependsOnCounting: false,
    ruleImpact: 'No counting issue is part of the image intake yet. This conversion draft remains quarantined until the full practical replay is reviewed against Makruk movement.',
    goal: {
      kind: 'material-win',
      result: 'black-win',
      reason: 'material_win',
      minMaterialSwing: 300,
    },
    acceptedMoves: [
      {
        move: candidateMove('e4', 'f3'),
        lineId: 'main',
        explanation: 'The imported conversion branch starts with the met capture on f3.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Imported conversion branch',
        moves: candidateLine('e4-f3'),
        outcome: {
          result: 'black-win',
          reason: 'material_win',
          explanation: 'The imported branch begins by taking the ma. The reviewed continuation after White grabs on e6 keeps the rook checks going and continues toward winning the white ruea.',
        },
      },
    ],
    solution: candidateLine('e4-f3'),
    hint1: 'Start with the met capture before you switch to the rook chase.',
    hint2: 'After Rh2+ and Re2+, the attack keeps going and the reviewed continuation targets the white ruea on e6.',
    keyIdea: 'The attack forces the king away so the rook on e6 can be collected in the continuation.',
    commonWrongMove: candidateMove('g3', 'g2'),
    wrongMoveExplanation: 'Checking with the g-file rook first looks natural, but this imported conversion branch is about taking the ma first and only then using the rook checks to win the ruea.',
    takeaway: 'An attack that does not finish in mate can still be the right practical line if it wins a full ruea cleanly afterwards.',
    toMove: 'black',
    sideToMove: 'black',
    boardOrientation: 'black',
    board: candidateBoard(
      ['f2', 'K', 'white'],
      ['b3', 'M', 'white'],
      ['c3', 'S', 'white'],
      ['e3', 'R', 'white'],
      ['f3', 'N', 'white'],
      ['a4', 'P', 'white'],
      ['b4', 'P', 'white'],
      ['e4', 'M', 'black'],
      ['b5', 'P', 'black'],
      ['g3', 'R', 'black'],
      ['h3', 'R', 'black'],
      ['b6', 'S', 'black'],
      ['c6', 'P', 'black'],
      ['e6', 'S', 'black'],
      ['c7', 'K', 'black'],
    ),
    tags: ['image-import', 'candidate-from-photo', 'conversion-candidate', 'material-vs-mate', 'needs-line-review'],
    origin: 'curated-manual',
  },
  {
    id: 9200,
    title: 'Imported Black Mate Candidate: Met Takes Ma, Then Ruea',
    description: 'Black to move. Begin with met takes ma, then continue the imported rook attack toward mate.',
    explanation: 'Imported from a board image for manual review. The current user-supplied branch starts with met takes ma. If White grabs on e6, Black checks with the rook on g2 and the second rook swings to h1 for mate.',
    source: 'Curated manual: image intake 2026-04-12 black met-takes-ma mate candidate',
    theme: 'MateIn3',
    motif: 'Met takes ma, then rook mate from imported board image',
    difficulty: 'advanced',
    difficultyScore: 1560,
    streakTier: 'mate_pressure',
    verification: {
      engineSource: 'none',
      searchDepth: null,
      searchNodes: null,
      multiPvGap: null,
      onlyMoveChainLength: 3,
      countCriticality: 'none',
      verificationStatus: 'unverified',
    },
    objective: 'Black to move. Checkmate White by starting with met takes ma.',
    whyPositionMatters: 'This draft comes from a user-supplied board image where the practical question is whether Black can take the ma first and still keep the mating net alive afterwards.',
    dependsOnCounting: false,
    ruleImpact: 'No counting issue is part of the image intake yet. This draft is quarantined until the exact mating replay is reviewed against Makruk movement.',
    goal: {
      kind: 'checkmate',
      result: 'black-win',
      reason: 'checkmate',
    },
    acceptedMoves: [
      {
        move: candidateMove('e4', 'f3'),
        lineId: 'main',
        explanation: 'The imported idea starts with the met capture on f3 before the rook checks begin.',
      },
    ],
    solutionLines: [
      {
        id: 'main',
        label: 'Imported attacking branch',
        moves: candidateLine('e4-f3', 'e3-e6', 'g3-g2', 'f2-e1', 'h3-h1'),
        outcome: {
          result: 'black-win',
          reason: 'checkmate',
          explanation: 'After White grabs on e6, the imported branch continues with a rook check on g2 and the second rook swing to h1 for mate.',
        },
      },
    ],
    solution: candidateLine('e4-f3', 'e3-e6', 'g3-g2', 'f2-e1', 'h3-h1'),
    hint1: 'Start with met takes ma before you switch to the rook checks.',
    hint2: 'If White grabs on e6, the key continuation is rook to g2 check, then the other rook swings to h1.',
    keyIdea: 'The material capture is only interesting because Black can still convert the attack with the two rooks afterwards.',
    commonWrongMove: candidateMove('g3', 'g2'),
    wrongMoveExplanation: 'Rook check first is tempting, but this imported draft is preserving the user-supplied idea that met takes ma still leaves the mating net intact.',
    takeaway: 'A material-first move can still be right when the mating attack survives the capture.',
    toMove: 'black',
    sideToMove: 'black',
    boardOrientation: 'black',
    board: candidateBoard(
      ['f2', 'K', 'white'],
      ['b3', 'M', 'white'],
      ['c3', 'S', 'white'],
      ['e3', 'R', 'white'],
      ['f3', 'N', 'white'],
      ['a4', 'P', 'white'],
      ['b4', 'P', 'white'],
      ['e4', 'M', 'black'],
      ['b5', 'P', 'black'],
      ['g3', 'R', 'black'],
      ['h3', 'R', 'black'],
      ['b6', 'S', 'black'],
      ['c6', 'P', 'black'],
      ['e6', 'S', 'black'],
      ['c7', 'K', 'black'],
    ),
    tags: ['image-import', 'candidate-from-photo', 'mate-candidate', 'material-vs-mate', 'needs-line-review'],
    origin: 'curated-manual',
  },
];

function createEditorialLivePuzzleCandidate(
  draft: PuzzleCandidateDraft,
  override: EditorialLiveOverride,
): Puzzle {
  const tagSet = new Set<string>([...(draft.tags ?? []), ...override.tags]);
  const preparedDraft: PuzzleCandidateDraft = {
    ...draft,
    ...override,
    sideToMove: draft.sideToMove ?? draft.toMove,
    origin: 'engine-generated',
    sourceGameId: null,
    sourcePly: null,
    sourceLicense: 'editorial-review',
    sourceGameUrl: null,
    tags: [...tagSet],
    streakTier: override.streakTier,
  };

  const generatedPuzzle = createGeneratedPuzzleCandidate(preparedDraft);

  return {
    ...generatedPuzzle,
    reviewStatus: 'ship',
    reviewChecklist: {
      themeClarity: 'pass',
      teachingValue: 'pass',
      duplicateRisk: 'clear',
      reviewNotes: 'Promoted into the editorial live pack to replace the older self-play-facing website puzzles.',
    },
  };
}

const CANDIDATE_DRAFTS: PuzzleCandidateDraft[] = [
  ...GENERATED_PUZZLE_CANDIDATE_DRAFTS.map(draft => ({
    ...draft,
    origin: 'engine-generated' as const,
  })),
  ...EDITORIAL_MANUAL_DRAFTS.map(draft => ({
    ...draft,
    origin: 'engine-generated' as const,
  })),
  ...MANUAL_REVIEW_DRAFTS,
];

const REVIEWED_IMPORT_IDS = new Set<number>();

export const IMPORTED_PUZZLE_CANDIDATES: Puzzle[] = CANDIDATE_DRAFTS.map(draft =>
  EDITORIAL_LIVE_OVERRIDES.has(draft.id)
    ? createEditorialLivePuzzleCandidate(draft, EDITORIAL_LIVE_OVERRIDES.get(draft.id)!)
    : REVIEWED_IMPORT_IDS.has(draft.id)
    ? createReviewedImportedPuzzleCandidate(
      draft,
      'Promoted into the curated tactical pack because the motif is clear, legal, and worth replaying.',
    )
    : draft.origin === 'curated-manual'
    ? createImportedPuzzleCandidate(draft)
    : createGeneratedPuzzleCandidate(draft),
);

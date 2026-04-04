import type { Puzzle } from './puzzles';
import type { PuzzleOrigin } from './puzzleMetadata';
import { finalizePuzzle } from './puzzleCatalog';
import { GENERATED_PUZZLE_CANDIDATE_DRAFTS } from './generatedPuzzleCandidates';
import { isCountingTheme, isDefensiveTheme, isMateTheme, isPromotionTheme, isTacticalTheme } from './puzzleThemes';

export interface PuzzleCandidateDraft extends Omit<
  Puzzle,
  | 'reviewStatus'
  | 'reviewChecklist'
  | 'origin'
  | 'sourceGameId'
  | 'sourcePly'
  | 'tags'
  | 'difficultyScore'
  | 'difficultyProfile'
  | 'progressionStage'
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
  tags?: string[];
  difficultyScore?: number;
  sideToMove?: Puzzle['sideToMove'];
  counting?: Puzzle['counting'];
  dependsOnCounting?: boolean;
  solution?: Puzzle['solution'];
  objective?: string;
  whyPositionMatters?: string;
  ruleImpact?: string;
  hint1?: string;
  hint2?: string;
  keyIdea?: string;
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
    objective: deriveGeneratedObjective(draft),
    whyPositionMatters: deriveGeneratedWhyPositionMatters(draft),
    ruleImpact: deriveGeneratedRuleImpact(draft),
    hint1: deriveGeneratedHint1(draft),
    hint2: deriveGeneratedHint2(draft),
    keyIdea: deriveGeneratedKeyIdea(draft),
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

const CANDIDATE_DRAFTS: PuzzleCandidateDraft[] = GENERATED_PUZZLE_CANDIDATE_DRAFTS.map(draft => ({
  ...draft,
  origin: 'engine-generated',
}));

const REVIEWED_IMPORT_IDS = new Set<number>();

export const IMPORTED_PUZZLE_CANDIDATES: Puzzle[] = CANDIDATE_DRAFTS.map(draft =>
  REVIEWED_IMPORT_IDS.has(draft.id)
    ? createReviewedImportedPuzzleCandidate(
      draft,
      'Promoted into the curated tactical pack because the motif is clear, legal, and worth replaying.',
    )
    : createGeneratedPuzzleCandidate(draft),
);

import { makeMove } from './engine';
import type { GameState, PieceType } from './types';
import type { Puzzle } from './puzzles';
import { hasPassingReviewChecklist, isPuzzleReadyToShip } from './puzzles';
import { createGameStateFromPuzzle, getMaterialSwing, isTacticalTheme } from './puzzleSolver';
import { isMateTheme, isPromotionTheme } from './puzzleThemes';

export interface PuzzleAuditRow {
  puzzleId: number;
  title: string;
  reviewStatus: Puzzle['reviewStatus'];
  motif: string;
  family: string;
  positionKey: string;
  duplicateOf: number | null;
  verificationStatus: Puzzle['verification']['verificationStatus'];
  multiPvGap: number | null;
  qualityScore: number;
  flags: string[];
}

function getFirstMovePieceType(puzzle: Puzzle): PieceType | 'unknown' {
  const firstMove = puzzle.solution[0];
  if (!firstMove) return 'unknown';

  return puzzle.board[firstMove.from.row]?.[firstMove.from.col]?.type ?? 'unknown';
}

function playSolution(puzzle: Puzzle): GameState | null {
  let state = createGameStateFromPuzzle(puzzle);

  for (const step of puzzle.solution) {
    const nextState = makeMove(state, step.from, step.to);
    if (!nextState) return null;
    state = nextState;
  }

  return state;
}

function getPuzzleFamily(puzzle: Puzzle): string {
  return `${puzzle.theme}:${puzzle.solution.length}:${getFirstMovePieceType(puzzle)}`;
}

export function auditPuzzles(puzzles: Puzzle[]): PuzzleAuditRow[] {
  const familyCounts = new Map<string, number>();

  for (const puzzle of puzzles) {
    const family = getPuzzleFamily(puzzle);
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
  }

  return puzzles.map(puzzle => {
    const family = getPuzzleFamily(puzzle);
    const familyCount = familyCounts.get(family) ?? 1;
    const finalState = playSolution(puzzle);
    const materialSwing = finalState ? getMaterialSwing(puzzle, finalState) : 0;
    const flags: string[] = [];
    let qualityScore = 2;

    if (puzzle.solution.length >= 3) qualityScore += 2;
    else flags.push('single-move puzzle');

    if (isPromotionTheme(puzzle.theme)) qualityScore += 1;
    if (isTacticalTheme(puzzle.theme)) qualityScore += materialSwing >= 300 ? 2 : 1;
    if (isMateTheme(puzzle.theme) && puzzle.solution.length >= 3) qualityScore += 1;

    if (familyCount >= 3) {
      qualityScore -= 1;
      flags.push(`overrepresented family: ${family}`);
    }

    if (puzzle.duplicateOf !== null) {
      qualityScore -= 2;
      flags.push(`duplicate of #${puzzle.duplicateOf}`);
    }

    if (puzzle.verification.verificationStatus === 'ambiguous') {
      qualityScore -= 2;
      flags.push('verification ambiguous');
    }

    if (puzzle.verification.verificationStatus === 'unverified') {
      qualityScore -= 1;
      flags.push('verification missing');
    }

    if (puzzle.verification.countCriticality === 'critical') {
      qualityScore += 1;
      flags.push('count-critical');
    }

    if (puzzle.tags.includes('quiet-but-forcing')) {
      qualityScore += 1;
      flags.push('quiet forcing idea');
    }

    if (puzzle.tags.includes('mate-preparation')) {
      flags.push('mate preparation');
    }

    if (puzzle.goal.kind === 'material-win' && (puzzle.goal.minMaterialSwing ?? 0) <= 100) {
      flags.push('review small material gain');
    }

    if (!hasPassingReviewChecklist(puzzle)) {
      const checklist = puzzle.reviewChecklist;
      const incomplete = checklist.themeClarity === 'unreviewed' ||
        checklist.teachingValue === 'unreviewed' ||
        checklist.duplicateRisk === 'unreviewed';

      flags.push(incomplete ? 'review checklist incomplete' : 'review checklist failed');
    }

    if (!isPuzzleReadyToShip(puzzle)) {
      flags.push('not ready to ship');
    }

    if (qualityScore <= 1) {
      flags.push('weak candidate');
    }

    return {
      puzzleId: puzzle.id,
      title: puzzle.title,
      reviewStatus: puzzle.reviewStatus,
      motif: puzzle.motif,
      family,
      positionKey: puzzle.positionKey,
      duplicateOf: puzzle.duplicateOf,
      verificationStatus: puzzle.verification.verificationStatus,
      multiPvGap: puzzle.verification.multiPvGap,
      qualityScore,
      flags,
    };
  });
}

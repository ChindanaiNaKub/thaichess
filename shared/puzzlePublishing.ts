import { getCanonicalAcceptedMove } from './puzzleSolver';
import { validatePuzzle, type PuzzleValidationResult } from './puzzleValidation';
import { validateMakrukPuzzlePosition } from './makrukPositionValidation';
import type { Puzzle, PuzzlePublishAuditRow } from './puzzles';

function hasPassingReviewChecklist(puzzle: Puzzle): boolean {
  return puzzle.reviewChecklist.themeClarity === 'pass' &&
    puzzle.reviewChecklist.teachingValue === 'pass' &&
    puzzle.reviewChecklist.duplicateRisk === 'clear';
}

function getLegalityErrors(puzzle: Puzzle, validationResult: PuzzleValidationResult): string[] {
  const boardErrors = validateMakrukPuzzlePosition(puzzle.board).errors;
  const replayErrors = validationResult.errors.filter(error => error.startsWith('Replay validation failed:'));
  return [...boardErrors, ...replayErrors];
}

function classifyPuzzle(
  puzzle: Puzzle,
  validationResult: PuzzleValidationResult,
  publishable: boolean,
  legalityErrors: string[],
): Pick<PuzzlePublishAuditRow, 'classification' | 'classificationReasons'> {
  if (publishable) {
    return { classification: 'Keep', classificationReasons: ['Meets legality, objective, hint, and review gates.'] };
  }

  if (legalityErrors.length > 0) {
    return { classification: 'Reject', classificationReasons: legalityErrors };
  }

  if (validationResult.errors.length > 0) {
    return { classification: 'Reject', classificationReasons: validationResult.errors };
  }

  const rewriteReasons: string[] = [];

  if (puzzle.reviewStatus !== 'ship') {
    rewriteReasons.push('Puzzle is not approved for publishing review yet.');
  }

  if (!hasPassingReviewChecklist(puzzle)) {
    rewriteReasons.push('Review checklist is incomplete or failed.');
  }

  if (puzzle.duplicateOf !== null) {
    rewriteReasons.push(`Puzzle is marked as a duplicate of #${puzzle.duplicateOf}.`);
  }

  if (puzzle.verification.verificationStatus === 'unverified') {
    rewriteReasons.push('Puzzle has not been verified yet.');
  }

  if (puzzle.verification.verificationStatus === 'ambiguous') {
    rewriteReasons.push('Puzzle verification still marks the position as ambiguous.');
  }

  if (validationResult.warnings.length > 0) {
    rewriteReasons.push(...validationResult.warnings);
  }

  return {
    classification: rewriteReasons.length > 0 ? 'Rewrite' : 'Reject',
    classificationReasons: rewriteReasons.length > 0 ? rewriteReasons : ['Puzzle failed the publishing gate.'],
  };
}

export function buildPuzzlePublishAuditRow(
  puzzle: Puzzle,
  validationResult: PuzzleValidationResult = validatePuzzle(puzzle),
): PuzzlePublishAuditRow {
  const legalityErrors = getLegalityErrors(puzzle, validationResult);
  const publishable = legalityErrors.length === 0 &&
    validationResult.errors.length === 0 &&
    puzzle.reviewStatus === 'ship' &&
    hasPassingReviewChecklist(puzzle) &&
    puzzle.duplicateOf === null &&
    puzzle.verification.verificationStatus !== 'unverified' &&
    puzzle.verification.verificationStatus !== 'ambiguous';
  const classification = classifyPuzzle(puzzle, validationResult, publishable, legalityErrors);

  return {
    id: puzzle.id,
    title: puzzle.title,
    sourceType: puzzle.origin === 'engine-generated' ? 'generated' : 'curated',
    sourceLicense: puzzle.sourceLicense,
    positionKey: puzzle.positionKey,
    duplicateOf: puzzle.duplicateOf,
    objective: puzzle.objective,
    motif: puzzle.motif,
    dependsOnCounting: puzzle.dependsOnCounting,
    verificationStatus: puzzle.verification.verificationStatus,
    multiPvGap: puzzle.verification.multiPvGap,
    legalityStatus: legalityErrors.length === 0 ? 'valid' : 'invalid',
    validationErrors: validationResult.errors,
    validationWarnings: validationResult.warnings,
    bestMove: getCanonicalAcceptedMove(puzzle),
    acceptedMoves: puzzle.acceptedMoves,
    hint1: puzzle.hint1,
    hint2: puzzle.hint2,
    keyIdea: puzzle.keyIdea,
    commonWrongMove: puzzle.commonWrongMove,
    wrongMoveExplanation: puzzle.wrongMoveExplanation,
    takeaway: puzzle.takeaway,
    publishable,
    classification: classification.classification,
    classificationReasons: classification.classificationReasons,
  };
}

export function buildPuzzlePublishAudit(
  puzzles: Puzzle[],
  validationResults: PuzzleValidationResult[],
): PuzzlePublishAuditRow[] {
  const resultsById = new Map(validationResults.map(result => [result.puzzleId, result]));
  return puzzles.map(puzzle => buildPuzzlePublishAuditRow(puzzle, resultsById.get(puzzle.id) ?? validatePuzzle(puzzle)));
}

export function isPuzzlePublishable(
  puzzle: Puzzle,
  validationResult: PuzzleValidationResult = validatePuzzle(puzzle),
): boolean {
  return buildPuzzlePublishAuditRow(puzzle, validationResult).publishable;
}

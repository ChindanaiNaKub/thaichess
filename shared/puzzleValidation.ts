import { getLegalMoves, hasAnyLegalMoves, isInCheck, makeMove, posToAlgebraic } from './engine';
import type { Board, Move, PieceColor, Position } from './types';
import type { Puzzle, PuzzleMoveReference, PuzzleSolutionLine } from './puzzles';
import { classifyMaterialGain } from './puzzleDoctrine';
import {
  createGameStateFromPuzzle,
  findObjectivePreservingFirstMoves,
  findGoalSatisfyingFirstMoves,
  getMaterialSwing,
  getPliesRemaining,
  isThemeSatisfied,
} from './puzzleSolver';
import {
  getPuzzleThemeDefinition,
  isCountingTheme,
  isDefensiveTheme,
  isFuturePuzzleTheme,
  isMateTheme,
  isPromotionTheme,
  isTacticalTheme,
} from './puzzleThemes';
import { validateMakrukPuzzlePosition, validateMakrukReplay } from './makrukPositionValidation';
import { boardMatchesPieceList } from './puzzlePosition';

export interface PuzzleValidationResult {
  puzzleId: number;
  title: string;
  errors: string[];
  warnings: string[];
}

export interface PuzzleTurnValidationResult {
  isValid: boolean;
  errors: string[];
}

const COUNTING_TEXT_REGEX = /\b(?:sak mak|sak kradan|count(?:ing|ed)?|final attack|draw|16|22|32|44|64|8)\b/i;
const VAGUE_OBJECTIVE_REGEX = /\b(?:find the move|find a move|find the best move|play the best move|best move|keep the streak alive)\b/i;

function isBoardShapeValid(board: Board): boolean {
  return board.length === 8 && board.every(row => row.length === 8);
}

function moveEquals(left: PuzzleMoveReference | Move, right: PuzzleMoveReference | Move): boolean {
  return left.from.row === right.from.row &&
    left.from.col === right.from.col &&
    left.to.row === right.to.row &&
    left.to.col === right.to.col;
}

function formatMove(move: PuzzleMoveReference | Move): string {
  return `${posToAlgebraic(move.from)}-${posToAlgebraic(move.to)}`;
}

function isLegalMove(board: Board, from: Position, to: Position): boolean {
  return getLegalMoves(board, from).some(move => move.row === to.row && move.col === to.col);
}

function shouldUseEngineLineWithoutExhaustiveSearch(puzzle: Puzzle): boolean {
  const longestLine = puzzle.solutionLines.reduce(
    (length, line) => Math.max(length, line.moves.length),
    puzzle.solution.length,
  );

  return puzzle.verification.verificationStatus === 'engine_verified' &&
    longestLine > 9;
}

function getAllLegalMovesForColor(board: Board, color: PieceColor): Move[] {
  const moves: Move[] = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row]?.[col];
      if (!piece || piece.color !== color) continue;

      for (const target of getLegalMoves(board, { row, col })) {
        moves.push({
          from: { row, col },
          to: { ...target },
        });
      }
    }
  }

  return moves;
}

function validateTeachingFields(puzzle: Puzzle, errors: string[], warnings: string[]): void {
  if (puzzle.objective.trim().length < 12) {
    errors.push('Puzzle objective must clearly state the exact task.');
  }

  if (puzzle.whyPositionMatters.trim().length < 24) {
    errors.push('Puzzle must explain why the position matters.');
  }

  if (puzzle.explanation.trim().length < 24) {
    errors.push('Puzzle must explain why the best move works.');
  }

  if (!puzzle.commonWrongMove) {
    errors.push('Puzzle must record a common wrong move for feedback.');
  }

  if (puzzle.hint1.trim().length < 12) {
    errors.push('Puzzle must include a short first hint.');
  }

  if (puzzle.hint2.trim().length < 18) {
    errors.push('Puzzle must include a stronger second hint.');
  }

  if (puzzle.keyIdea.trim().length < 18) {
    errors.push('Puzzle must include the key idea it teaches.');
  }

  if (puzzle.wrongMoveExplanation.trim().length < 24) {
    errors.push('Puzzle must explain why the common wrong move fails.');
  }

  if (puzzle.takeaway.trim().length < 16) {
    errors.push('Puzzle must include a short takeaway.');
  }

  if (puzzle.motif.trim().length < 4 || puzzle.motif.trim().toLowerCase() === puzzle.theme.trim().toLowerCase()) {
    warnings.push('Puzzle motif should name a concrete Makruk teaching pattern, not just repeat the theme.');
  }

  if (puzzle.acceptedMoves.length > 1 && !puzzle.acceptedMoves.every(move => move.explanation.trim().length > 0)) {
    errors.push('Equivalent accepted moves must explain why they are equivalent.');
  }
}

function validateVerificationMetadata(puzzle: Puzzle, errors: string[], warnings: string[]): void {
  if (!puzzle.positionKey.trim()) {
    errors.push('Puzzle must store a stable positionKey for dedupe and audit output.');
  }

  if (puzzle.verification.onlyMoveChainLength < 1) {
    errors.push('Puzzle verification metadata must record a positive only-move chain length.');
  }

  if (puzzle.origin === 'engine-generated' && puzzle.verification.verificationStatus === 'ambiguous') {
    errors.push('Generated puzzle is still ambiguous after verification and cannot be shipped.');
  }

  if (puzzle.origin === 'engine-generated' && puzzle.verification.verificationStatus === 'unverified') {
    warnings.push('Generated puzzle has not been verified yet and should stay in quarantine.');
  }
}

function detectObjectiveFamilies(objective: string): Set<'mate' | 'draw' | 'promotion' | 'material'> {
  const text = objective.toLowerCase();
  const families = new Set<'mate' | 'draw' | 'promotion' | 'material'>();

  if (/\bmate|checkmate\b/.test(text)) families.add('mate');
  if (/\bdraw\b/.test(text)) families.add('draw');
  if (/\bpromot/.test(text)) families.add('promotion');
  if (/\bwin\b|\bmaterial\b|\bfork\b|\btactic(?:al)?\b|\battack\b|\bconversion\b|\binitiative\b/.test(text)) {
    families.add('material');
  }

  return families;
}

function validateObjectiveClarity(puzzle: Puzzle, errors: string[]): void {
  const objective = puzzle.objective.trim();
  const objectiveFamilies = [...detectObjectiveFamilies(objective)];
  const expectedFamily = puzzle.goal.kind === 'checkmate'
    ? 'mate'
    : puzzle.goal.kind === 'draw'
      ? 'draw'
      : puzzle.goal.kind === 'promotion'
        ? 'promotion'
        : 'material';

  if (VAGUE_OBJECTIVE_REGEX.test(objective)) {
    errors.push('Puzzle objective is too vague. It must state the exact result to preserve.');
  }

  if (objectiveFamilies.length === 0) {
    errors.push('Puzzle objective must name a concrete result such as mate, draw, promotion, or material/conversion.');
  }

  if (objectiveFamilies.length > 1) {
    errors.push('Puzzle objective must declare exactly one primary result, not multiple unrelated goals.');
  }

  if (!objectiveFamilies.includes(expectedFamily)) {
    errors.push(`Puzzle objective does not match the declared ${expectedFamily} goal.`);
  }
}

function validateRuleImpact(puzzle: Puzzle, errors: string[]): void {
  if (puzzle.ruleImpact.trim().length < 12) {
    errors.push('Puzzle must explain the rule impact of the position.');
  }

  if (puzzle.dependsOnCounting && !COUNTING_TEXT_REGEX.test(puzzle.ruleImpact)) {
    errors.push('Counting-dependent puzzle must mention Sak Mak, Sak Kradan, the count, or the final attack in ruleImpact.');
  }

  if (puzzle.dependsOnCounting && !puzzle.counting) {
    errors.push('Counting-dependent puzzle must include an explicit counting state.');
  }
}

function validateThemeAndGoal(puzzle: Puzzle, errors: string[], warnings: string[]): void {
  const themeDefinition = getPuzzleThemeDefinition(puzzle.theme);

  if (!themeDefinition) {
    warnings.push(`Puzzle theme "${puzzle.theme}" is not part of the Makruk theme catalog.`);
  } else if (isFuturePuzzleTheme(puzzle.theme)) {
    warnings.push(`Puzzle theme "${puzzle.theme}" is cataloged for future support but not fully validated yet.`);
  }

  if (isMateTheme(puzzle.theme) && puzzle.goal.kind !== 'checkmate') {
    errors.push('Mate theme must use a checkmate goal.');
  }

  if (isPromotionTheme(puzzle.theme) && puzzle.goal.kind !== 'promotion') {
    errors.push('Promotion theme must use a promotion goal.');
  }

  if (isTacticalTheme(puzzle.theme) && puzzle.goal.kind !== 'material-win') {
    errors.push('Material theme must use a material-win goal.');
  }

  if (isDefensiveTheme(puzzle.theme) && puzzle.goal.result !== 'draw') {
    errors.push('Defensive draw themes must end in a draw result.');
  }

  if (isCountingTheme(puzzle.theme) && !puzzle.dependsOnCounting) {
    errors.push('Counting theme must set dependsOnCounting to true.');
  }
}

function validateDoctrineCoherence(puzzle: Puzzle, errors: string[], warnings: string[]): void {
  const hasMatePreparationTag = puzzle.tags.includes('mate-preparation') || /\bmate-preparation\b/i.test(puzzle.motif);

  if (hasMatePreparationTag && puzzle.goal.kind !== 'checkmate') {
    errors.push('Puzzle motif says mate preparation, but the verified line does not create a clear mating-net restriction.');
  }

  if (puzzle.goal.kind !== 'material-win') {
    return;
  }

  const looksLikeSmallGainPuzzle =
    (puzzle.goal.minMaterialSwing ?? 0) <= 100 ||
    /\bpawn\b/i.test(`${puzzle.description} ${puzzle.objective} ${puzzle.motif}`);

  if (!looksLikeSmallGainPuzzle) {
    return;
  }

  let bestSwing = 0;

  for (const line of puzzle.solutionLines) {
    let state = createGameStateFromPuzzle(puzzle);
    let valid = true;

    for (const step of line.moves) {
      const nextState = makeMove(state, step.from, step.to);
      if (!nextState) {
        valid = false;
        break;
      }
      state = nextState;
    }

    if (!valid) {
      continue;
    }

    bestSwing = Math.max(bestSwing, getMaterialSwing(puzzle, state));
  }

  if (
    bestSwing <= 100 &&
    !puzzle.tags.includes('structural-win') &&
    !puzzle.tags.includes('forcing-sequence') &&
    !puzzle.tags.includes('quiet-but-forcing') &&
    !puzzle.dependsOnCounting
  ) {
    errors.push('Puzzle wins only incidental material and does not teach a meaningful conversion.');
    return;
  }

  const gainClass = classifyMaterialGain({
    capturedPiece: null,
    leadsToMate: false,
    leadsToPromotion: false,
    countCritical: puzzle.dependsOnCounting,
    finalMaterialSwing: bestSwing,
  });

  if (gainClass === 'incidental') {
    if (
      !puzzle.tags.includes('forcing-sequence') &&
      !puzzle.tags.includes('quiet-but-forcing') &&
      !puzzle.tags.includes('structural-win')
    ) {
      errors.push('Puzzle wins only incidental material and does not teach a meaningful conversion.');
      return;
    }

    warnings.push('Material puzzle wins only a pawn-sized gain; review whether the conversion is structural enough to teach.');
    return;
  }

  if (bestSwing <= 100 && !puzzle.tags.includes('structural-win')) {
    warnings.push('Material puzzle wins only a pawn-sized gain; review whether the conversion is structural enough to teach.');
  }
}

function validateAcceptedMoves(puzzle: Puzzle, errors: string[]): void {
  if (puzzle.acceptedMoves.length === 0) {
    errors.push('Puzzle must define at least one accepted move.');
    return;
  }

  const firstMovesFromLines = puzzle.solutionLines
    .map(line => line.moves[0])
    .filter((move): move is PuzzleMoveReference => Boolean(move));

  for (const accepted of puzzle.acceptedMoves) {
    if (!isLegalMove(puzzle.board, accepted.move.from, accepted.move.to)) {
      errors.push(`Accepted move ${formatMove(accepted.move)} is illegal in the starting position.`);
    }

    if (!firstMovesFromLines.some(move => moveEquals(move, accepted.move))) {
      errors.push(`Accepted move ${formatMove(accepted.move)} does not start any solution line.`);
    }
  }
}

function validatePositionLock(puzzle: Puzzle, errors: string[]): void {
  if (puzzle.positionAuthority !== 'explicit_piece_list') {
    return;
  }

  if (puzzle.pieceList.length === 0) {
    errors.push('Explicit-position puzzle must store a full piece list.');
    return;
  }

  const seenSquares = new Set<string>();
  for (const piece of puzzle.pieceList) {
    if (seenSquares.has(piece.square)) {
      errors.push(`Explicit piece list contains a duplicate square: ${piece.square}.`);
      return;
    }
    seenSquares.add(piece.square);
  }

  if (!boardMatchesPieceList(puzzle.board, puzzle.pieceList)) {
    errors.push('Puzzle board does not match its stored explicit piece list.');
  }
}

function validateForkMotif(puzzle: Puzzle, errors: string[]): void {
  if (puzzle.theme !== 'Fork' && !/\bfork\b/i.test(puzzle.motif)) {
    return;
  }

  const linesById = new Map(puzzle.solutionLines.map(line => [line.id, line]));

  for (const accepted of puzzle.acceptedMoves) {
    const line = linesById.get(accepted.lineId) ??
      puzzle.solutionLines.find(candidate => {
        const firstMove = candidate.moves[0];
        return firstMove ? moveEquals(firstMove, accepted.move) : false;
      });

    if (!line || line.moves.length < 3) {
      errors.push(`Fork puzzle accepted move ${formatMove(accepted.move)} must lead to a line where the forking piece collects a target.`);
      continue;
    }

    let state = createGameStateFromPuzzle(puzzle);
    let replayValid = true;

    for (let index = 0; index < 2; index += 1) {
      const step = line.moves[index];
      const nextState = step ? makeMove(state, step.from, step.to) : null;
      if (!nextState) {
        errors.push(`Fork puzzle line "${line.id}" could not be replayed far enough to validate the motif.`);
        replayValid = false;
        break;
      }
      state = nextState;
    }

    if (!replayValid) {
      continue;
    }

    const collectionMove = line.moves[2];
    if (!collectionMove) {
      errors.push(`Fork puzzle line "${line.id}" is missing the collection move after the fork.`);
      continue;
    }

    if (
      collectionMove.from.row !== accepted.move.to.row ||
      collectionMove.from.col !== accepted.move.to.col
    ) {
      errors.push(`Fork puzzle accepted move ${formatMove(accepted.move)} is not the same piece that collects the second target later in line "${line.id}".`);
      continue;
    }

    const targetPiece = state.board[collectionMove.to.row]?.[collectionMove.to.col];
    if (!targetPiece || targetPiece.color === puzzle.sideToMove) {
      errors.push(`Fork puzzle line "${line.id}" does not show the forking piece winning an enemy target on its next turn.`);
    }
  }
}

export function validatePuzzleTurn(puzzle: Puzzle): PuzzleTurnValidationResult {
  const errors: string[] = [];
  const sideToMove = puzzle.sideToMove;

  if (sideToMove !== 'white' && sideToMove !== 'black') {
    errors.push('Puzzle sideToMove must be explicitly set to "white" or "black".');
    return { isValid: false, errors };
  }

  if (puzzle.toMove !== sideToMove) {
    errors.push('sideToMove does not match legacy toMove field.');
  }

  const state = createGameStateFromPuzzle(puzzle);
  if (state.turn !== sideToMove) {
    errors.push('sideToMove does not match solution line or board state');
    return { isValid: false, errors };
  }

  const legalMoves = getAllLegalMovesForColor(state.board, sideToMove);
  if (legalMoves.length === 0) {
    errors.push('Side to move has no legal moves in the starting position.');
    return { isValid: false, errors };
  }

  const firstLineMove = puzzle.solutionLines[0]?.moves[0] ?? puzzle.solution[0];
  if (!firstLineMove) {
    errors.push('Puzzle must contain at least one solution move.');
    return { isValid: false, errors };
  }

  const firstPiece = state.board[firstLineMove.from.row]?.[firstLineMove.from.col];
  if (!firstPiece || firstPiece.color !== sideToMove) {
    errors.push('sideToMove does not match solution line or board state');
    return { isValid: false, errors };
  }

  const firstMoveState = makeMove(state, firstLineMove.from, firstLineMove.to);
  if (!firstMoveState) {
    errors.push('sideToMove does not match solution line or board state');
    return { isValid: false, errors };
  }

  if (isMateTheme(puzzle.theme) || puzzle.goal.kind === 'checkmate') {
    const legalMoveExists = legalMoves.some(move => moveEquals(move, firstLineMove));
    if (!legalMoveExists) {
      errors.push('sideToMove does not match solution line or board state');
    }
  }

  return { isValid: errors.length === 0, errors };
}

function validateSolutionLine(
  puzzle: Puzzle,
  line: PuzzleSolutionLine,
  errors: string[],
): void {
  if (line.moves.length === 0) {
    errors.push(`Solution line "${line.id}" is empty.`);
    return;
  }

  if (line.moves.length % 2 === 0) {
    errors.push(`Solution line "${line.id}" must end on the solving side.`);
    return;
  }

  let state = createGameStateFromPuzzle(puzzle);

  for (let index = 0; index < line.moves.length; index += 1) {
    const step = line.moves[index];
    const role = state.turn === puzzle.sideToMove ? 'solver' : 'defender';

    if (!isLegalMove(state.board, step.from, step.to)) {
      errors.push(`Solution line "${line.id}" contains an illegal ${role} move at ply ${index + 1}: ${formatMove(step)}.`);
      return;
    }

    const nextState = makeMove(state, step.from, step.to);
    if (!nextState) {
      errors.push(`Solution line "${line.id}" could not apply move ${formatMove(step)}.`);
      return;
    }

    state = nextState;
  }

  if (!isThemeSatisfied(puzzle, state)) {
    const countingExpired =
      state.resultReason === 'counting_rule' ||
      Boolean(
        puzzle.dependsOnCounting &&
        puzzle.counting?.active &&
        puzzle.counting.countingColor === puzzle.sideToMove &&
        puzzle.counting.currentCount >= puzzle.counting.limit,
      );

    if (countingExpired) {
      errors.push(`Solution line "${line.id}" fails because Makruk counting expires before the claimed objective is reached.`);
      return;
    }

    switch (puzzle.goal.kind) {
      case 'checkmate':
        errors.push(`Solution line "${line.id}" does not end in checkmate.`);
        break;
      case 'promotion':
        errors.push(`Solution line "${line.id}" does not end in promotion.`);
        break;
      case 'draw':
        errors.push(`Solution line "${line.id}" does not end in a draw.`);
        break;
      case 'material-win':
        errors.push(`Solution line "${line.id}" does not win the required material.`);
        break;
    }
    return;
  }

  if (puzzle.goal.kind === 'checkmate' && state.resultReason !== 'checkmate') {
    errors.push(`Solution line "${line.id}" must finish with a checkmate result reason.`);
  }

  if (puzzle.goal.kind === 'draw' && !state.isDraw) {
    errors.push(`Solution line "${line.id}" must finish with a legal draw result.`);
  }

  if (puzzle.goal.kind === 'draw' && line.outcome.reason !== 'draw_saved' && state.resultReason !== line.outcome.reason) {
    errors.push(`Solution line "${line.id}" outcome reason says "${line.outcome.reason}" but the engine resolved "${state.resultReason}".`);
  }

  if (puzzle.goal.kind === 'material-win') {
    const minimumSwing = puzzle.goal.minMaterialSwing ?? 0;
    if (getMaterialSwing(puzzle, state) < minimumSwing) {
      errors.push(`Solution line "${line.id}" wins only ${getMaterialSwing(puzzle, state)} swing, below the required ${minimumSwing}.`);
    }
  }
}

function validateAuthoritativeSolutionLine(puzzle: Puzzle, errors: string[]): void {
  if (puzzle.solutionAuthority !== 'authoritative_line') {
    return;
  }

  if (puzzle.solutionLines.length !== 1) {
    errors.push('Authoritative-line puzzle must publish exactly one canonical solution line.');
    return;
  }

  let state = createGameStateFromPuzzle(puzzle);
  const line = puzzle.solutionLines[0];

  for (let index = 0; index < line.moves.length; index += 1) {
    const step = line.moves[index];
    const role = state.turn === puzzle.sideToMove ? 'solver' : 'defender';
    const legalMoves = getAllLegalMovesForColor(state.board, state.turn);

    if (role === 'defender') {
      if (legalMoves.length !== 1) {
        errors.push(`Authoritative line defender reply at ply ${index + 1} is not forced.`);
        return;
      }

      if (!moveEquals(legalMoves[0], step)) {
        errors.push(`Authoritative line defender reply at ply ${index + 1} does not match the only legal move.`);
        return;
      }
    }

    const nextState = makeMove(state, step.from, step.to);
    if (!nextState) {
      errors.push(`Authoritative line contains an illegal ${role} move at ply ${index + 1}: ${formatMove(step)}.`);
      return;
    }

    if (role === 'solver' && puzzle.goal.kind === 'checkmate' && !nextState.isCheckmate && !nextState.isCheck) {
      errors.push(`Authoritative mate line solver move at ply ${index + 1} must keep the attack forcing with check.`);
      return;
    }

    state = nextState;
  }
}

function validateCommonWrongMove(puzzle: Puzzle, errors: string[], warnings: string[]): void {
  if (!puzzle.commonWrongMove) {
    return;
  }

  const wrongMove = puzzle.commonWrongMove;

  if (!isLegalMove(puzzle.board, wrongMove.from, wrongMove.to)) {
    errors.push(`Common wrong move ${formatMove(wrongMove)} is illegal.`);
    return;
  }

  if (puzzle.acceptedMoves.some(entry => moveEquals(entry.move, wrongMove))) {
    errors.push(`Common wrong move ${formatMove(wrongMove)} is also listed as accepted.`);
  }

  if (!shouldUseEngineLineWithoutExhaustiveSearch(puzzle)) {
    const objectivePreservingMoves = findObjectivePreservingFirstMoves(puzzle);
    if (objectivePreservingMoves.some(move => moveEquals(move, wrongMove))) {
      errors.push(`Common wrong move ${formatMove(wrongMove)} accidentally preserves the puzzle objective.`);
    }
  } else {
    warnings.push('Long engine-confirmed puzzle skipped exhaustive wrong-move proof to keep validation bounded.');
  }

  const startState = createGameStateFromPuzzle(puzzle);
  const nextState = makeMove(startState, wrongMove.from, wrongMove.to);
  const targetPiece = puzzle.board[wrongMove.to.row]?.[wrongMove.to.col];

  if ((isMateTheme(puzzle.theme) || puzzle.goal.kind === 'material-win') && !targetPiece && !nextState?.isCheck) {
    warnings.push(`Common wrong move ${formatMove(wrongMove)} is neither a capture nor a check; consider using a more tempting material grab or forcing-looking move.`);
  }

  if (puzzle.wrongMoveExplanation.trim().length < 40) {
    warnings.push('Wrong-move explanation is very short; consider making the failure mode more explicit.');
  }
}

function validateExactAcceptedSet(puzzle: Puzzle, errors: string[], warnings: string[]): void {
  if (shouldUseEngineLineWithoutExhaustiveSearch(puzzle)) {
    warnings.push('Long engine-confirmed puzzle uses the published engine line instead of exhaustive first-move enumeration.');
    return;
  }

  const engineMoves = findObjectivePreservingFirstMoves(puzzle);
  const allGoalMoves = findGoalSatisfyingFirstMoves(puzzle);
  const acceptedMoves = puzzle.acceptedMoves.map(entry => entry.move);

  const missingAccepted = acceptedMoves.filter(move =>
    !engineMoves.some(candidate => moveEquals(candidate, move)),
  );
  const extraWinning = engineMoves.filter(move =>
    !acceptedMoves.some(candidate => moveEquals(candidate, move)),
  );

  if (missingAccepted.length > 0) {
    errors.push(`Accepted move set includes non-winning move(s): ${missingAccepted.map(formatMove).join(', ')}.`);
  }

  if (extraWinning.length > 0) {
    errors.push(`Puzzle has additional objective-preserving first move(s): ${extraWinning.map(formatMove).join(', ')}.`);
  }

  const lowerQualityGoalMoves = allGoalMoves.filter(move =>
    !engineMoves.some(candidate => moveEquals(candidate, move)) &&
    !acceptedMoves.some(candidate => moveEquals(candidate, move)),
  );

  if (lowerQualityGoalMoves.length > 0 && acceptedMoves.length > 0) {
    warnings.push(`Puzzle has lower-quality goal move(s) that reach the raw goal but do not preserve the main idea cleanly: ${lowerQualityGoalMoves.map(formatMove).join(', ')}.`);
  }
}

export function validatePuzzle(puzzle: Puzzle): PuzzleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isBoardShapeValid(puzzle.board)) {
    errors.push('Board must be 8x8.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  const positionErrors = validateMakrukPuzzlePosition(puzzle.board).errors;
  if (positionErrors.length > 0) {
    errors.push(...positionErrors);
  }

  const turnValidation = validatePuzzleTurn(puzzle);
  if (!turnValidation.isValid) {
    errors.push(...turnValidation.errors);
  }

  if (puzzle.setupMoves && puzzle.setupMoves.length > 0) {
    const replay = validateMakrukReplay({
      moves: puzzle.setupMoves,
      expectedBoard: puzzle.board,
      expectedTurn: puzzle.sideToMove,
    });
    if (!replay.valid) {
      errors.push(...replay.errors.map(error => `Replay validation failed: ${error}`));
    }
  }

  validateTeachingFields(puzzle, errors, warnings);
  validateVerificationMetadata(puzzle, errors, warnings);
  validateObjectiveClarity(puzzle, errors);
  validateRuleImpact(puzzle, errors);
  validateThemeAndGoal(puzzle, errors, warnings);
  validateDoctrineCoherence(puzzle, errors, warnings);
  validatePositionLock(puzzle, errors);
  validateAcceptedMoves(puzzle, errors);
  validateForkMotif(puzzle, errors);
  validateCommonWrongMove(puzzle, errors, warnings);

  if (puzzle.solutionLines.length === 0) {
    errors.push('Puzzle must contain at least one solution line.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  const state = createGameStateFromPuzzle(puzzle);
  const defendingColor: PieceColor = puzzle.sideToMove === 'white' ? 'black' : 'white';
  const solverInCheck = isInCheck(puzzle.board, puzzle.sideToMove);
  const defenderInCheck = isInCheck(puzzle.board, defendingColor);

  if (solverInCheck && defenderInCheck) {
    errors.push('Puzzle board is illegal: both kings are in check.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (defenderInCheck) {
    errors.push('Starting position is illegal: the non-moving side is already in check.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (isThemeSatisfied(puzzle, state)) {
    errors.push('Puzzle goal is already satisfied in the starting position.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  if (!hasAnyLegalMoves(state.board, state.turn)) {
    errors.push('Side to move has no legal moves in the starting position.');
    return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
  }

  for (const line of puzzle.solutionLines) {
    validateSolutionLine(puzzle, line, errors);
  }

  if (errors.length === 0) {
    validateAuthoritativeSolutionLine(puzzle, errors);
  }

  if (errors.length === 0) {
    validateExactAcceptedSet(puzzle, errors, warnings);
  }

  if (puzzle.reviewStatus === 'ship' && getPliesRemaining(puzzle, state) === 0) {
    errors.push('Shipped puzzle cannot have zero search depth.');
  }

  return { puzzleId: puzzle.id, title: puzzle.title, errors, warnings };
}

export function validatePuzzles(puzzles: Puzzle[]): PuzzleValidationResult[] {
  return puzzles.map(validatePuzzle);
}

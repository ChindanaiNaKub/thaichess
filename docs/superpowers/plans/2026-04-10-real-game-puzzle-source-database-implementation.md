# Real-Game Makruk Puzzle Source Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-game-backed Makruk puzzle source database and make the puzzle pipeline use doctrine-based quality gates so generated puzzles feel natural, count-correct, and instructive.

**Architecture:** Extend the current source export/import path so saved games become auditable source records with attribution and count-ready metadata. Add a shared doctrine module that classifies meaningful preparatory ideas, structural material gains, and weak engine-only candidates, then use that module inside generation, validation, and audit scripts so every candidate is filtered and explained by the same rules.

**Tech Stack:** TypeScript, Node 22, npm workspaces, Vitest, Zod, existing shared Makruk engine/helpers, existing server export scripts

---

## File Map

- Create: `shared/puzzleDoctrine.ts`
  Purpose: centralize doctrine labels, rejection reasons, material-gain classes, and helper functions for meaningful preparatory moves.
- Create: `server/src/test/exportPuzzleSources.test.ts`
  Purpose: lock in the exported real-game source schema and default filtering behavior.
- Modify: `shared/validation/puzzle.ts`
  Purpose: extend the generation-source schema to accept richer source metadata and doctrine labels.
- Modify: `shared/puzzleSourceImport.ts`
  Purpose: preserve and validate enriched source metadata when reading JSON and PGN-like imports.
- Modify: `server/src/scripts/exportPuzzleSources.ts`
  Purpose: export a reusable real-game source database with attribution, URLs, and quality-ready metadata.
- Modify: `server/src/scripts/generatePuzzleCandidates.ts`
  Purpose: load enriched source records and emit doctrine-aware review output.
- Modify: `shared/puzzleGeneration.ts`
  Purpose: classify quiet-but-forcing ideas, reject incidental gains, prefer real-game source records, and carry doctrine labels into drafts.
- Modify: `shared/puzzleValidation.ts`
  Purpose: add teaching-coherence checks for doctrine labels, meaningful material gain, and human-plausible first moves.
- Modify: `shared/puzzleAudit.ts`
  Purpose: surface doctrine-based rejection reasons and review labels in audit rows.
- Modify: `shared/puzzleImportQueue.ts`
  Purpose: produce better default copy for real-game and doctrine-labeled candidates.
- Modify: `client/src/test/puzzleGeneration.test.ts`
  Purpose: cover doctrine-aware generation behavior.
- Modify: `client/src/test/puzzleValidation.test.ts`
  Purpose: cover doctrine-aware validation and publishability behavior.

### Task 1: Export A Reusable Real-Game Source Database

**Files:**
- Modify: `server/src/scripts/exportPuzzleSources.ts`
- Modify: `shared/validation/puzzle.ts`
- Modify: `shared/puzzleSourceImport.ts`
- Test: `server/src/test/exportPuzzleSources.test.ts`

- [ ] **Step 1: Write the failing server test**

Create `server/src/test/exportPuzzleSources.test.ts` with a schema-level assertion for the richer exported record:

```ts
import { describe, expect, it } from 'vitest';
import { PuzzleGenerationSourceSchema } from '../../../shared/validation/puzzle';

describe('exportPuzzleSources schema', () => {
  it('accepts a real-game source record with attribution and doctrine-ready metadata', () => {
    const parsed = PuzzleGenerationSourceSchema.parse({
      id: 'game-123',
      source: 'Exported rated game game-123',
      moves: [{ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }],
      positionSourceType: 'real-game',
      startingPlyNumber: 1,
      moveCount: 42,
      result: '1-0',
      resultReason: 'checkmate',
      sourceLicense: 'internal-real-game',
      sourceGameUrl: '/games/game-123',
      sourceGameId: 'game-123',
    });

    expect(parsed.positionSourceType).toBe('real-game');
    expect(parsed.sourceLicense).toBe('internal-real-game');
    expect(parsed.sourceGameUrl).toBe('/games/game-123');
  });
});
```

- [ ] **Step 2: Run the server test to verify it fails**

Run:

```bash
npm test --workspace=server -- exportPuzzleSources.test.ts
```

Expected: FAIL because `PuzzleGenerationSourceSchema` does not yet allow `sourceLicense`, `sourceGameUrl`, or `sourceGameId`.

- [ ] **Step 3: Extend the source schema**

Update `shared/validation/puzzle.ts` so generation sources can carry the real-game metadata that will become the source database:

```ts
export const PuzzleGenerationSourceSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  moves: z.array(z.object({
    from: PositionSchema,
    to: PositionSchema,
  })),
  initialBoard: BoardSchema.optional(),
  startingTurn: PieceColorSchema.optional(),
  setupMoves: z.array(z.object({
    from: PositionSchema,
    to: PositionSchema,
  })).optional(),
  positionSourceType: z.enum(['real-game', 'engine-generated', 'constructed']).optional(),
  startingPlyNumber: z.number().int().min(1).optional(),
  moveCount: z.number().int().min(0).optional(),
  result: z.string().optional(),
  resultReason: z.string().optional(),
  sourceGameId: z.string().optional(),
  sourceLicense: z.string().nullable().optional(),
  sourceGameUrl: z.string().nullable().optional(),
});
```

- [ ] **Step 4: Preserve the metadata during import**

Update `shared/puzzleSourceImport.ts` so JSON imports and helper constructors round-trip the new fields:

```ts
function buildSource(headers: ParsedHeaders, moves: Move[], index: number): PuzzleGenerationSource {
  return {
    id: headers.id ?? `pgnlike-${index + 1}`,
    source: headers.source ?? `Imported PGN-like game ${index + 1}`,
    moves,
    initialBoard: createInitialBoard(),
    startingTurn: headers.startingTurn ?? 'white',
    positionSourceType: 'real-game',
    moveCount: headers.moveCount ?? moves.length,
    result: headers.result,
    resultReason: headers.resultReason,
    sourceGameId: headers.id ?? `pgnlike-${index + 1}`,
    sourceLicense: 'imported-real-game',
    sourceGameUrl: null,
    startingPlyNumber: headers.startingPlyNumber ?? 1,
  };
}
```

Keep `createSeedPuzzleSource()` and related helpers accepting the optional fields and passing them through unchanged.

- [ ] **Step 5: Export the real-game metadata**

Update `server/src/scripts/exportPuzzleSources.ts` so exported source records include a stable game id and local game URL:

```ts
interface ExportedPuzzleSource {
  id: string;
  source: string;
  moves: Move[];
  moveCount: number;
  result: string;
  resultReason: string;
  rated: boolean;
  gameMode: string;
  finishedAt: number;
  sourceGameId: string;
  sourceLicense: string;
  sourceGameUrl: string;
}
```

Emit:

```ts
sourceGameId: game.id,
sourceLicense: 'internal-real-game',
sourceGameUrl: `/games/${game.id}`,
```

- [ ] **Step 6: Run the server test to verify it passes**

Run:

```bash
npm test --workspace=server -- exportPuzzleSources.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/src/scripts/exportPuzzleSources.ts server/src/test/exportPuzzleSources.test.ts shared/puzzleSourceImport.ts shared/validation/puzzle.ts
git commit -m "feat: export enriched real-game puzzle sources"
```

### Task 2: Add The Shared Puzzle Doctrine Module

**Files:**
- Create: `shared/puzzleDoctrine.ts`
- Modify: `shared/puzzleGeneration.ts`
- Test: `client/src/test/puzzleGeneration.test.ts`

- [ ] **Step 1: Write the failing generation test**

Add two tests to `client/src/test/puzzleGeneration.test.ts` that pin the new doctrine helpers:

```ts
import { classifyMaterialGain, isMeaningfulPreparatoryCandidate } from '../../../shared/puzzleDoctrine';

it('classifies incidental pawn wins as non-publishable gains', () => {
  expect(classifyMaterialGain({
    capturedPiece: 'P',
    leadsToMate: false,
    leadsToPromotion: false,
    countCritical: false,
    finalMaterialSwing: 100,
  })).toBe('incidental');
});

it('requires quiet first moves to create visible restriction or a forced threat', () => {
  expect(isMeaningfulPreparatoryCandidate({
    firstMoveIsCheck: false,
    firstMoveIsCapture: false,
    defenderReplyCount: 6,
    nearOnlyMove: false,
    createsTrap: false,
    createsMateThreat: false,
    countPressure: false,
  })).toBe(false);
});
```

- [ ] **Step 2: Run the client test to verify it fails**

Run:

```bash
npm test --workspace=client -- puzzleGeneration.test.ts
```

Expected: FAIL because `shared/puzzleDoctrine.ts` does not exist.

- [ ] **Step 3: Create the doctrine module**

Create `shared/puzzleDoctrine.ts` with the shared labels and helper logic:

```ts
export type PuzzleDoctrineLabel =
  | 'forcing'
  | 'quiet-but-forcing'
  | 'mate-preparation'
  | 'restriction'
  | 'trap-conversion'
  | 'count-pressure'
  | 'structural-win';

export type PuzzleMaterialGainClass = 'critical' | 'structural' | 'incidental';

export function classifyMaterialGain(input: {
  capturedPiece: 'R' | 'N' | 'S' | 'M' | 'PM' | 'P' | null;
  leadsToMate: boolean;
  leadsToPromotion: boolean;
  countCritical: boolean;
  finalMaterialSwing: number;
}): PuzzleMaterialGainClass {
  if (input.capturedPiece === 'R' || input.finalMaterialSwing >= 300) return 'critical';
  if (input.capturedPiece === 'P' && (input.leadsToMate || input.leadsToPromotion || input.countCritical)) return 'structural';
  if (input.capturedPiece && input.finalMaterialSwing >= 200) return 'structural';
  return 'incidental';
}

export function isMeaningfulPreparatoryCandidate(input: {
  firstMoveIsCheck: boolean;
  firstMoveIsCapture: boolean;
  defenderReplyCount: number;
  nearOnlyMove: boolean;
  createsTrap: boolean;
  createsMateThreat: boolean;
  countPressure: boolean;
}): boolean {
  if (input.firstMoveIsCheck || input.firstMoveIsCapture) return true;
  if (input.createsTrap || input.createsMateThreat || input.countPressure) return true;
  return input.nearOnlyMove || input.defenderReplyCount <= 2;
}
```

- [ ] **Step 4: Thread the doctrine helpers into generation**

Start using the new helper exports inside `shared/puzzleGeneration.ts`:

```ts
import {
  classifyMaterialGain,
  isMeaningfulPreparatoryCandidate,
  type PuzzleDoctrineLabel,
} from './puzzleDoctrine';
```

Add a small internal adapter that computes doctrine inputs from the current candidate state so later tasks can use the same classification path:

```ts
function deriveDoctrineLabels(args: {
  firstMoveIsCheck: boolean;
  firstMoveIsCapture: boolean;
  defenderReplyCount: number;
  createsTrap: boolean;
  createsMateThreat: boolean;
  countPressure: boolean;
}): PuzzleDoctrineLabel[] {
  const labels: PuzzleDoctrineLabel[] = [];
  if (args.firstMoveIsCheck || args.firstMoveIsCapture) labels.push('forcing');
  if (isMeaningfulPreparatoryCandidate({ ...args, nearOnlyMove: args.defenderReplyCount <= 2 })) {
    if (!args.firstMoveIsCheck && !args.firstMoveIsCapture) labels.push('quiet-but-forcing');
    if (args.createsTrap) labels.push('trap-conversion');
    if (args.createsMateThreat) labels.push('mate-preparation');
    if (args.countPressure) labels.push('count-pressure');
  }
  return labels;
}
```

- [ ] **Step 5: Run the client test to verify it passes**

Run:

```bash
npm test --workspace=client -- puzzleGeneration.test.ts
```

Expected: PASS for the new helper tests.

- [ ] **Step 6: Commit**

```bash
git add client/src/test/puzzleGeneration.test.ts shared/puzzleDoctrine.ts shared/puzzleGeneration.ts
git commit -m "feat: add shared makruk puzzle doctrine helpers"
```

### Task 3: Make Candidate Generation Prefer Human-Legible Real-Game Ideas

**Files:**
- Modify: `shared/puzzleGeneration.ts`
- Modify: `server/src/scripts/generatePuzzleCandidates.ts`
- Test: `client/src/test/puzzleGeneration.test.ts`

- [ ] **Step 1: Write the failing generation tests**

Add two behavior tests in `client/src/test/puzzleGeneration.test.ts`:

```ts
it('rejects a quiet material line when the gain is only incidental', () => {
  const candidates = generatePuzzleCandidateDraftsFromMoveSequence(
    createDefaultGenerationSource('quiet-incidental', 'Exported rated game quiet-incidental', moves, undefined, 'white', {
      moveCount: moves.length,
      result: '1-0',
      resultReason: 'checkmate',
      sourceGameId: 'quiet-incidental',
      sourceLicense: 'internal-real-game',
      sourceGameUrl: '/games/quiet-incidental',
    }),
  );

  expect(candidates).toHaveLength(0);
});

it('keeps a quiet rook-lift candidate when it creates a near-only defense and a mating net', () => {
  const candidates = generatePuzzleCandidateDraftsFromMoveSequence(realGameMatePrepSource);
  expect(candidates[0]?.draft.tags).toContain('mate-preparation');
  expect(candidates[0]?.draft.tags).toContain('quiet-but-forcing');
});
```

- [ ] **Step 2: Run the client test to verify it fails**

Run:

```bash
npm test --workspace=client -- puzzleGeneration.test.ts
```

Expected: FAIL because the generator still accepts weak quiet lines and does not emit doctrine tags.

- [ ] **Step 3: Tighten analysis and rejection**

Update `shared/puzzleGeneration.ts` so `analyzeTheme()` and `toDraft()` compute doctrine quality facts before a draft is returned:

```ts
const defenderReplyCount = firstState ? getAllLegalMovesForColor(firstState.board, firstState.turn).length : 0;
const doctrineLabels = deriveDoctrineLabels({
  firstMoveIsCheck: Boolean(firstState?.isCheck),
  firstMoveIsCapture: firstMoveCapture,
  defenderReplyCount,
  createsTrap: theme === 'TrappedPiece',
  createsMateThreat: Boolean(firstState?.isCheck || finalState.isCheckmate),
  countPressure: false,
});

if (!doctrineLabels.includes('forcing') && !doctrineLabels.includes('quiet-but-forcing')) {
  return null;
}

if (classifyMaterialGain({
  capturedPiece: firstCapturedPiece,
  leadsToMate: finalState.isCheckmate,
  leadsToPromotion: Boolean(finalState.moveHistory[finalState.moveHistory.length - 1]?.promoted),
  countCritical: false,
  finalMaterialSwing: swing,
}) === 'incidental') {
  return null;
}
```

- [ ] **Step 4: Carry doctrine labels into review output**

Update `server/src/scripts/generatePuzzleCandidates.ts` so markdown review output shows the new labels:

```ts
`- doctrine: ${candidate.draft.tags.filter(tag => [
  'forcing',
  'quiet-but-forcing',
  'mate-preparation',
  'restriction',
  'trap-conversion',
  'count-pressure',
  'structural-win',
].includes(tag)).join(', ') || 'none'}`,
```

- [ ] **Step 5: Run the client test to verify it passes**

Run:

```bash
npm test --workspace=client -- puzzleGeneration.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src/test/puzzleGeneration.test.ts server/src/scripts/generatePuzzleCandidates.ts shared/puzzleGeneration.ts
git commit -m "feat: gate makruk candidates by doctrine quality"
```

### Task 4: Make Validation And Audit Reject Puzzles That Do Not Teach The Claimed Idea

**Files:**
- Modify: `shared/puzzleValidation.ts`
- Modify: `shared/puzzleAudit.ts`
- Modify: `shared/puzzleImportQueue.ts`
- Test: `client/src/test/puzzleValidation.test.ts`

- [ ] **Step 1: Write the failing validation tests**

Add these cases to `client/src/test/puzzleValidation.test.ts`:

```ts
it('rejects a puzzle whose motif claims mate preparation but the line never restricts the king', () => {
  const result = validatePuzzle({
    ...basePuzzle,
    motif: 'mate-preparation',
    explanation: 'The rook lift seals the net.',
    tags: [...basePuzzle.tags, 'mate-preparation'],
  });

  expect(result.errors).toContain('Puzzle motif says mate preparation, but the verified line does not create a clear mating-net restriction.');
});

it('rejects a material puzzle when the only gain is incidental', () => {
  const result = validatePuzzle(incidentalPawnPuzzle);
  expect(result.errors).toContain('Puzzle wins only incidental material and does not teach a meaningful conversion.');
});
```

- [ ] **Step 2: Run the client test to verify it fails**

Run:

```bash
npm test --workspace=client -- puzzleValidation.test.ts
```

Expected: FAIL because validation does not yet understand doctrine labels or incidental gains.

- [ ] **Step 3: Add doctrine-aware validation**

Update `shared/puzzleValidation.ts` with a focused helper:

```ts
function validateDoctrineCoherence(puzzle: Puzzle, errors: string[], warnings: string[]): void {
  const hasMatePreparation = puzzle.tags.includes('mate-preparation') || /\bmate-preparation\b/i.test(puzzle.motif);
  const hasQuietForcing = puzzle.tags.includes('quiet-but-forcing');

  if (hasMatePreparation && !hasQuietForcing && !isMateTheme(puzzle.theme)) {
    errors.push('Puzzle motif says mate preparation, but the verified line does not create a clear mating-net restriction.');
  }

  if (puzzle.goal.kind === 'material-win' && /\bpawn\b/i.test(puzzle.description) && puzzle.goal.minMaterialSwing === 100) {
    warnings.push('Pawn-win puzzle must be reviewed to confirm the gain is structural, not incidental.');
  }
}
```

Call `validateDoctrineCoherence()` from `validatePuzzle()` after the existing teaching-field checks.

- [ ] **Step 4: Surface doctrine warnings in audit and default copy**

Update `shared/puzzleAudit.ts` to include doctrine-driven classification reasons:

```ts
if (puzzle.tags.includes('quiet-but-forcing')) {
  flags.push('quiet forcing idea');
}

if (puzzle.goal.kind === 'material-win' && puzzle.goal.minMaterialSwing === 100) {
  classificationReasons.push('Review whether the claimed material gain is structural or merely incidental.');
}
```

Update `shared/puzzleImportQueue.ts` so doctrine-tagged candidates get stronger default explanations:

```ts
if (draft.tags?.includes('mate-preparation')) {
  return 'The first move does not mate at once, but it seals key squares so every good defense collapses into the same mating net.';
}
```

- [ ] **Step 5: Run the client test to verify it passes**

Run:

```bash
npm test --workspace=client -- puzzleValidation.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src/test/puzzleValidation.test.ts shared/puzzleAudit.ts shared/puzzleImportQueue.ts shared/puzzleValidation.ts
git commit -m "feat: validate makruk puzzle doctrine coherence"
```

### Task 5: Verify The End-To-End Real-Game Pipeline

**Files:**
- Modify: `server/src/scripts/exportPuzzleSources.ts`
- Modify: `server/src/scripts/generatePuzzleCandidates.ts`
- Modify: `client/src/test/puzzleGeneration.test.ts`
- Modify: `client/src/test/puzzleValidation.test.ts`
- Test: `server/src/test/exportPuzzleSources.test.ts`

- [ ] **Step 1: Add the final failing regression assertions**

Add a pipeline-level test case in `client/src/test/puzzleGeneration.test.ts`:

```ts
it('prefers a real-game source over fallback content for the same position key', () => {
  const collapsed = collapseGeneratedCandidates([realGameCandidate, seedCandidate]);
  expect(collapsed).toHaveLength(1);
  expect(collapsed[0]?.draft.origin).toBe('real-game');
});
```

Add a publishability test in `client/src/test/puzzleValidation.test.ts`:

```ts
it('keeps low-teaching-value generated puzzles in quarantine', () => {
  const result = validatePuzzle(weakQuietPuzzle);
  expect(result.errors).toContain('Puzzle motif says mate preparation, but the verified line does not create a clear mating-net restriction.');
});
```

- [ ] **Step 2: Run the focused test suite to verify it fails**

Run:

```bash
npm test --workspace=client -- puzzleGeneration.test.ts puzzleValidation.test.ts
npm test --workspace=server -- exportPuzzleSources.test.ts
```

Expected: FAIL until the full pipeline behavior is connected.

- [ ] **Step 3: Finish the pipeline wiring**

Make sure `server/src/scripts/generatePuzzleCandidates.ts` preserves the source metadata on imported JSON input:

```ts
return parsed.map((game, index) =>
  createDefaultGenerationSource(
    game.id ?? `input-${index + 1}`,
    game.source ?? `Imported JSON game ${index + 1}`,
    game.moves,
    game.initialBoard,
    game.startingTurn ?? 'white',
    {
      moveCount: game.moveCount ?? game.moves.length,
      result: game.result,
      resultReason: game.resultReason,
      startingPlyNumber: game.startingPlyNumber ?? 1,
      sourceGameId: game.id ?? `input-${index + 1}`,
      sourceLicense: 'imported-real-game',
      sourceGameUrl: null,
    },
  ),
);
```

Ensure `collapseGeneratedCandidates()` continues using real-game priority and that doctrine labels survive draft finalization.

- [ ] **Step 4: Run the focused suite to verify it passes**

Run:

```bash
npm test --workspace=client -- puzzleGeneration.test.ts puzzleValidation.test.ts
npm test --workspace=server -- exportPuzzleSources.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run broader verification**

Run:

```bash
npm test --workspace=client -- puzzleGeneration.test.ts puzzleValidation.test.ts puzzleStreak.test.ts
npm run build --workspace=server
npm run build --workspace=client
```

Expected:

- client tests PASS
- server build PASS
- client build PASS

- [ ] **Step 6: Commit**

```bash
git add client/src/test/puzzleGeneration.test.ts client/src/test/puzzleValidation.test.ts server/src/scripts/exportPuzzleSources.ts server/src/scripts/generatePuzzleCandidates.ts server/src/test/exportPuzzleSources.test.ts shared/puzzleGeneration.ts shared/puzzleValidation.ts
git commit -m "feat: build real-game makruk puzzle source pipeline"
```

## Self-Review

- Spec coverage check: this plan covers the new real-game source database, doctrine module, generator quality gates, validator coherence checks, audit reasons, and test coverage called for by the approved doctrine spec.
- Placeholder scan: no `TODO`, `TBD`, or deferred implementation markers remain; every task names exact files, tests, commands, and commit boundaries.
- Type consistency check: the plan consistently uses `sourceGameId`, `sourceLicense`, `sourceGameUrl`, `PuzzleDoctrineLabel`, and `PuzzleMaterialGainClass` across schema, generator, and validation tasks.

Plan complete and saved to `docs/superpowers/plans/2026-04-10-real-game-puzzle-source-database-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

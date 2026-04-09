# Makruk Puzzle Quality Doctrine Design

Date: 2026-04-10
Status: Approved in conversation, pending written-spec review
Related source: `/Users/kwanchanokroumsuk/Downloads/Building a High-Quality Makruk Puzzle Platform.pdf`

## Summary

ThaiChess should treat the PDF as a quality doctrine and knowledge base, not as a direct puzzle database. The platform already has a functioning Makruk puzzle pipeline, but it still allows too many puzzles that are legal and engine-approved without being good teaching material. The next design step is to make the pipeline reject puzzles that do not teach a human-legible idea and to admit strategic or preparatory moves only when they clearly change the position in a way a solver can understand.

This design keeps the current generator, validator, audit, and publishing flow. It adds a shared doctrine layer and stricter quality heuristics so puzzles are selected, described, and reviewed according to Makruk-specific teaching value rather than engine output alone.

## Goals

- Make generated and imported puzzles feel purposeful, natural, and instructive.
- Allow both tactical and preparatory ideas when the first move has a clear human explanation.
- Use the PDF as the canonical quality rubric for generation, validation, audit, and review.
- Keep Makruk counting semantics as a hard correctness gate.
- Improve published explanations and motif labels so they match what the puzzle actually teaches.

## Non-Goals

- Do not treat the PDF as a direct source of puzzle positions.
- Do not build a full curator web UI in this phase.
- Do not implement full Glicko-2 puzzle rating in this phase.
- Do not loosen legality, uniqueness, or counting validation in order to admit more content.

## Doctrine

### Core rule

A puzzle is good only if it teaches an idea that can be explained in human terms. Engine preference alone is not enough.

### Accepted puzzle families

The system should accept two broad families:

1. Forcing tactics
   - Immediate checks, captures, forks, pins, discoveries, trapped-piece wins, mating lines, promotion races, and count-critical forcing sequences.

2. Meaningful preparatory moves
   - Quiet or semi-quiet moves that clearly improve the position by restriction, pressure, mating-net construction, count pressure, trapping, or forcing a structurally meaningful loss.

### Meaningful preparatory move

A first move that is not a direct check or capture is acceptable only if at least one of the following is true:

- It reduces the defender's viable responses in a clear way.
- It creates a new threat that must be answered immediately.
- It cuts escape squares or breaks defensive coordination.
- It traps a piece or makes a later capture unavoidable.
- It changes the count race so the attacker now wins in time or the defender loses a drawing resource.

If the first move is quiet and the defender still has many practical defenses of similar quality, the candidate should be rejected.

### Meaningful material gain

Material gain should be classified before a candidate can ship:

- `critical`
  - Wins a major piece or produces an obviously winning conversion.
- `structural`
  - Wins a pawn or small asset, but that gain directly enables mate, promotion, count conversion, or a clearly winning ending.
- `incidental`
  - Wins a small asset without changing the real result of the position.

Only `critical` and `structural` gains are publishable. `incidental` gains should be rejected even if engine evaluation improves.

### Human-plausible first move

The best move should look discoverable to a solver once the theme is understood. A candidate should be rejected or quarantined if:

- The first move is neither forcing nor clearly restrictive.
- A more natural-looking move is nearly as good in practical terms.
- The explanation relies on evaluation jargon instead of a board-based idea.

### Good wrong move

Every puzzle should have a plausible wrong move that a human might actually consider. Good wrong moves include:

- A greedy capture.
- A forcing-looking check.
- A natural defensive move.
- An active move that misses the deeper idea.

The platform should avoid weak wrong moves that feel random or obviously bad.

## Taxonomy

### Theme policy

Existing theme families remain valid, but the system should add doctrine-aware motif labels so puzzles describe what they teach more precisely than the current generic tactical copy.

### New or elevated motif labels

- `mate-preparation`
- `restriction`
- `space-squeeze`
- `trap-before-gain`
- `count-pressure`
- `count-reset`
- `structural-win`
- `promotion-race`
- `defensive-restriction`

These labels do not replace the current theme system. They refine it and support clearer explanation, filtering, and audit output.

## Architecture

### Shared doctrine layer

Create a shared doctrine module that centralizes:

- accepted puzzle-family definitions
- rejection reasons
- motif labels
- quality thresholds for preparatory moves
- material-gain classification rules
- explanation requirements

This module becomes the single source of truth used by generator, validator, publishing audit, and review tooling.

### Generator behavior

The generator should continue to prefer real games, detect tactical swings, verify uniqueness, and deduplicate by position. In addition, it should classify candidates by teaching value.

New generator duties:

- Distinguish direct forcing moves from meaningful preparatory moves.
- Reject quiet moves that do not create a clear restriction or forcing consequence.
- Reject positions that are already trivially winning before the puzzle starts.
- Reject material wins that are merely incidental.
- Emit doctrine labels and structured rejection reasons for review.

### Validator behavior

The validator should continue to enforce legality, exact accepted-move sets, and count correctness. It should also add teaching-coherence checks.

New validator duties:

- Ensure the declared objective matches the verified line.
- Ensure the motif, explanation, key idea, and wrong-move explanation match the actual mechanism.
- Ensure preparatory motifs show real restriction, trap, or pressure.
- Ensure pawn-loss and small-gain puzzles are meaningful to the final result.
- Ensure count-aware wins remain legal under the active count state.

### Audit and review behavior

Audit output should explain not only whether a puzzle is valid, but why it is strong or weak as teaching material.

New audit outputs:

- doctrinal classification labels
- rejection reasons such as `quiet_move_without_clear_restriction`
- `already_winning_before_puzzle`
- `material_gain_not_meaningful`
- `motif_mismatch`
- `count_invalid`
- `duplicate_family`
- explanation-quality and wrong-move-quality warnings

### Publishing behavior

Publishing should remain conservative:

- unverified candidates stay quarantined
- ambiguous candidates stay quarantined
- count-invalid candidates are rejected
- low-teaching-value candidates are rejected or held for rewrite

## Data Flow

1. Ingest or generate candidate positions.
2. Normalize source, position key, verification data, and counting state.
3. Analyze candidate type: forcing tactic, preparatory restriction, trap, count-pressure, promotion race, and so on.
4. Run uniqueness and count-aware verification.
5. Score teaching value using doctrine heuristics.
6. Validate explanation coherence and motif fit.
7. Deduplicate by position and by close family resemblance.
8. Send survivors to quarantine with explicit audit reasons and review guidance.
9. Ship only after review checklist passes.

## Error Handling

The system should fail explicitly and explainably.

- If count semantics invalidate a line, the puzzle must fail with a count-specific error.
- If the best move is ambiguous, the puzzle must fail with a uniqueness-specific error.
- If the explanation or motif does not match the verified line, the puzzle must fail with a teaching-coherence error.
- If a quiet move cannot be justified by restriction or threat creation, the puzzle must fail with a doctrine error rather than silently receiving weak copy.

## Testing Strategy

### Unit tests

- quiet first move rejected when it does not reduce practical defenses
- quiet first move accepted when it creates a forced mating net or trap
- pawn win rejected when the pawn is incidental
- pawn win accepted when it triggers a clearly winning conversion
- motif/explanation mismatch rejected
- wrong move rejected when it accidentally preserves the objective
- count-critical candidate rejected when the line succeeds only if counting is ignored

### Integration tests

- real-game candidate enters quarantine with doctrine labels and review reasons
- audit script reports doctrine-based rejection reasons
- publish flow excludes count-invalid, ambiguous, and low-teaching-value candidates
- difficulty seeding rises for puzzles with deeper only-move chains, clearer uniqueness, and count pressure

### Regression tests

- existing count-native lesson puzzles still validate
- clear tactical puzzles still ship
- duplicate collapse still prefers stronger real-game sources
- streak and difficulty features continue working with richer doctrine metadata

## Rollout

### Phase 1

Add the doctrine module, enrich metadata, and extend audit output without changing all generation thresholds yet.

### Phase 2

Turn doctrine checks into hard gates for candidate generation and validation.

### Phase 3

Retune copy generation, review checklist defaults, and puzzle explanations to match doctrine labels.

## Recommendation

Adopt the PDF as a Makruk puzzle quality doctrine, then encode that doctrine in shared code and review tooling. This gives ThaiChess a consistent answer to the user-facing question "why is this a good puzzle?" and directly addresses the current failure mode of legal but unintuitive or low-teaching-value puzzles.

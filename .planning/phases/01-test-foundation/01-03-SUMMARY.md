---
phase: 01-test-foundation
plan: 03
subsystem: build-tooling
tags: [linting, workspace, gap-closure]
dependency_graph:
  requires: []
  provides: [root-lint-scripts]
  affects: [developer-experience]
tech_stack:
  added:
    - "Root npm scripts: lint, lint:fix"
  patterns:
    - "Workspace delegation pattern (npm run <script> --workspace=<name>)"
key_files:
  created: []
  modified:
    - path: "package.json"
      changes: "Added lint and lint:fix scripts to root scripts section"
decisions: []
metrics:
  duration: "2 min"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_modified: 1
  commits: 1
---

# Phase 1 Plan 3: Gap Closure Plan for Root Lint Scripts Summary

**One-liner:** Root-level npm scripts for ESLint across all workspaces using workspace delegation pattern

## Overview

This plan addresses a planning gap discovered during UAT testing (01-UAT.md Test 1). The original ESLint configuration plan (01-01-PLAN.md) only specified adding lint scripts to client/ and server/ subdirectories, omitting root-level scripts for convenience.

## What Was Built

### Root Package.json Scripts

Added two scripts to `/home/prab/Documents/markrukthai-1/package.json`:

1. **`npm run lint`** - Runs ESLint on both client and server workspaces
2. **`npm run lint:fix`** - Auto-fixes linting issues in both workspaces

Both scripts follow the existing workspace delegation pattern used by other scripts (dev, build, etc.):

```json
"lint": "npm run lint --workspace=client && npm run lint --workspace=server",
"lint:fix": "npm run lint:fix --workspace=client && npm run lint:fix --workspace=server"
```

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

## Verification

### Task 1 Verification
- **Script presence confirmed:** Both `lint` and `lint:fix` scripts exist in root package.json
- **Pattern compliance:** Scripts follow workspace delegation pattern matching existing scripts
- **Commit:** `bdd3a4a` - feat(01-03): add root-level lint scripts for all workspaces

### Task 2 Verification
- **npm run lint** - Successfully executes ESLint on client and server workspaces (exit code 1 expected due to existing linting issues)
- **npm run lint:fix** - Successfully runs auto-fix on both workspaces
- **No "missing script" errors** - UAT gap closed

## UAT Gap Closure

**Before:** User reported "npm run lint from root fails - no lint script at root level"

**After:** Both `npm run lint` and `npm run lint:fix` work from project root, executing across all workspaces

**Test Status:** UAT Test 1 gap is now closed

## Technical Notes

### Workspace Delegation Pattern

The root package.json scripts use npm workspace syntax to delegate to individual workspace scripts:

```bash
npm run <script> --workspace=<name>
```

This pattern is consistent with existing scripts:
- `dev:client` → `npm run dev --workspace=client`
- `dev:server` → `npm run dev --workspace=server`
- `build` → `npm run build --workspace=client && npm run build --workspace=server`

### Script Ordering

Scripts were added in alphabetical order within the package.json scripts section:
- `build` (existing)
- `lint` (new)
- `lint:fix` (new)
- `validate:puzzles` (existing)

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01 | 03 | 2 min | 2 | 1 |

## Next Steps

Phase 1 (Test Foundation) is now complete with all 3 plans finished:
1. Plan 01-01: ESLint Configuration ✓
2. Plan 01-02: Contributor Documentation ✓
3. Plan 01-03: Root Lint Scripts (Gap Closure) ✓

Phase 2 (Game Engine Tests) can now begin.

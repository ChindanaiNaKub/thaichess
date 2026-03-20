---
phase: 1
slug: test-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit + component) |
| **Config file** | `client/vitest.config.ts` (existing) |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUND-01 | config | `node eslint.mjs --config-test` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | FOUND-02 | lint | `npm run lint` | ✅ | ⬜ pending |
| 01-03-01 | 03 | 1 | FOUND-03 | doc | `test -f CONTRIBUTING.md` | ✅ | ⬜ pending |
| 01-04-01 | 04 | 1 | FOUND-04 | lint + fix | `npm run lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `eslint.config.js` — ESLint 9+ flat config with react-hooks plugin
- [ ] `package.json` — lint scripts configured
- [ ] `client/src/test/` — existing test infrastructure

*Note: Vitest infrastructure already exists. Only ESLint configuration needs to be added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CONTRIBUTING.md clarity | FOUND-03 | Documentation quality | Review CONTRIBUTING.md for clarity and completeness |
| Socket.IO pattern documentation | FOUND-02 | Pattern correctness | Verify documented patterns match existing useGameSocket.ts |

*Note: ESLint configuration and dependency fixes are fully automated.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

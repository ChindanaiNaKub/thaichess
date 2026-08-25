# Test Suite Audit — Value Ranking & Removal Candidates

Measured on this machine (Aug 2026): **110 test files, ~630 tests** — client Vitest 478 tests / 79 files (**95.7s wall**), server Vitest 131 tests / 23 files (**4.25s wall**), Playwright 8 specs / 21 tests.

**Headline finding:** unit tests are *not* why CI feels slow. Client test CPU is dominated by **3 files (botEngine 27.6s + botCalibration 17.5s + puzzleValidation 13.3s = 58s of 77.7s)**, the server suite costs almost nothing, and the 8-minute PR window is structural: `npm ci` paid 6×, the server suite executed **three times per PR** (test job + two advisory shadow jobs), an e2e job that boots the whole dev stack, and sequential client→server execution inside one job. Post-merge, deployment is a **Northflank Docker rebuild triggered by the push to main** — GitHub Actions is not in the deploy path, so deleting tests will not speed up releases.

---

## 1. Where the time goes today

### PR pipeline (`.github/workflows/ci.yml`) — 6 parallel jobs

| Job | Does | Cost drivers |
|---|---|---|
| Lint | `npm ci` + ESLint over monorepo | npm ci |
| Unit & Integration | `npm ci` + `npm test` (client **then** server, sequential) | client suite ~1.5–3min on CI hardware |
| Build | `npm ci` + Vite build (incl. WASM asset step) + tsc + smoke-start + tar/upload artifact on main | Vite + WASM copy |
| E2E (PR only) | `npm ci` + Playwright chromium install + **boots full dev server** (120s boot allowance) + 8 specs, workers=1, retries=1 | live-multiplayer & bot-game-play spawn multiple browsers and poll sockets for minutes |
| Nub Shadow (PR only, **advisory**) | `npm ci` + puzzle validation + **entire server suite again** | duplicate install+run |
| Nub Install Shadow (PR only, **advisory**) | install global nub + retry loop + fresh dependency install + **server suite a third time** + tsc build | duplicate install+build |

Both shadow jobs are `continue-on-error: true` — pure signal, zero gating — yet every docs-only PR pays for them. They should be gated on `package-lock.json` changes or dropped.

### After merge (4–5 min to deployed)

1. Push to `main` triggers CI (lint, test, build — faster than PR because e2e/shadow don't run) and `react-doctor.yml` (advisory scan).
2. Independently, **Northflank sees the new main commit and rebuilds the Docker image from scratch** (builder stage: install build tools, all deps, full Vite build incl. Fairy-Stockfish WASM asset step). This build is the 4–5 minutes.
3. Cutover is destructive (single instance): brief outage, in-memory live games wiped (ADR-0001).
4. Health gate: `/api/health` must return ok with Turso connected.

**Lever:** cut Docker build time (layer caching, or build the image in Actions and let Northflank pull by digest). Cutting tests barely moves this clock. Also note: the `thaichess-release.tgz` artifact built on main pushes appears unconsumed by any deploy path — verify and likely delete.

---

## 2. Server suite — file-by-file (23 files, 131 tests, ~4s wall)

| File (tests) | What it proves | Why it earns its place | Tier |
|---|---|---|---|
| `gameManager.test.ts` (19) | Join serialization under races, private-game color reservation, move rejection, rematch swap/rejection, stale-room GC at 61min, draw flow, reconnect state, clock timeout endings, insufficient-material draws | Core multiplayer domain logic; every bug here corrupts live games. Fake timers, zero I/O — highest value/cost ratio in repo | **S** |
| `socketHandlers.test.ts` (17) | find_game validation, duplicate-matchmaking prevention, rated pairing rules, rematch relay, disconnect notify, presence heartbeat, seat restore on reconnect, spectator enforcement, counting broadcast | The wire protocol between client and GameManager; these are exactly the bugs users see as "my game froze" | **S** |
| `database-rating.test.ts` (8) | Elo applied exactly-once (incl. concurrent race), legacy-rating clamp, casual/rated separation, leaderboard ordering + fair-play exclusion, restrict/clear lifecycle | Money-path integrity: wrong Elo is irreversible user harm. Heaviest DB file and worth it | **S** |
| `betterAuthEmailOtp.test.ts` (6) | OTP hashed storage, admin sign-in preserving profile, 2FA enable + backup codes, session survives username change, 7-day cooldown, `twoFactorRedirect` creates no session | Auth/2FA correctness with real SQLite; security-critical | **S** |
| `matchmaking.test.ts` (3) | Exact TC match, flexible nearby-TC only after threshold, entry replacement, stale cleanup | Tight state machine, trivially cheap | **S** |
| `security.test.ts` (6) | XFF IP extraction, gameId/position/time-control validators, rate-limiter windows, prod CORS allowlist from env | Input-validation contract guarding SQL/socket surface | **S** |
| `csrf.test.ts` (10) | Trusted-write origin matrix, malformed origin handling, safe-method bypass, dev CORS defaults | Real security behavior. **Trim:** final test regex-pins the exact list of 12 protected routes scanned from source — a change-detector that churns on every new endpoint. Delete that one test | **S−** |
| `apiValidation.test.ts` (5) | Zod schemas: UUID ids, zero-move resigns, bot-level cap, engine-resource caps (movetime/multipv/moves), public search schemas | Resource-protection contract against abusive payloads; free to run | **S** |
| `auth.test.ts` (4) | Prod import fails without AUTH_SECRET; OTP sign-in leaves legacy tables empty; logout terminates legacy session + audit log | Security invariants. **Trim:** OTP sign-in scenario duplicates betterAuthEmailOtp — keep one, cross-file | **A+** |
| `gamesRoutes.test.ts` (3) | Route→schema wiring via real HTTP on ephemeral port; invalid queries rejected before DB | Proves routers actually mount the validators (schema tests alone don't). Overlaps apiValidation on rules but not on risk | **A** |
| `fairyStockfishBinary.test.ts` (17) | FEN normalization incl. promoted-pawn mapping, timeout budgets, illegal-move fallback to local bot, eval normalization to white POV, level-10 gating, depth plans | Engine-integration glue where silent breakage loses games. **Trim:** exact-millisecond budget pins duplicate config tables — collapse to boundary cases | **A−** |
| `database-puzzle-progress.test.ts` (4) | Progress merge/dedupe, play/complete counters, client-sync aggregation, per-user isolation | Persistence contract for streaks; cheap local SQLite | **A** |
| `database-search-openings.test.ts` (2) | Empty DB → populated search/opening stats/position games on real SQLite | Explorer data path end-to-end | **A** |
| `database-auth-schema.test.ts` (2) | Migration output has required better-auth columns/tables; OAuth sign-in builds correct URL without schema errors | Migration smoke for third-party schema coupling | **A** |
| `exportPuzzleSources.test.ts` (4) | Attribution fields, row→export mapping, PGN-like parser metadata, Turn alias | Data-import pipeline integrity | **A** |
| `seoHtml.test.ts (4)` | SEO snapshot injection, JSON-LD, noindex rules for auth/unpublished puzzles | Organic-traffic guard for a product that lives on SEO | **A** |
| `urlCanonicalization.test.ts` (3) | Trailing-slash redirects, query preservation, static-file null | Duplicate-content protection; free | **A** |
| `monitoring.test.ts` (1) | Event counters, Prometheus format, PII-free logging | One dense test, compliance-flavored | **A** |
| `spa.test.ts` (2) | Shell served for app routes, not for hashed assets | Routing footgun guard; trivial | **B** |
| `leaderboardPagination.test.ts` (2) | Clamp/defaults for page/limit params | Guards SQL abuse; trivial | **B** |
| `smokeStartConfig.test.ts` (4) | Timeout env parsing defaults/override/fallback | Constant-ish but is the whole contract of a startup knob | **B−** |
| `database-config.test.ts` (3) | DATA_DIR resolution, prod durable-DB guard | Prod-boot guard is valuable. **Fix:** first test's expectation flips on whether `data/makruk.db` exists on the machine — environment-dependent assertion, make deterministic | **B−** |
| `backfillGamePositions.test.ts` (2) | Asserts SQL **string literals** contain substrings; never executes SQL | Change-detector on implementation text. Delete; if the backfill matters, run the selection query against a seeded temp DB instead | **D — delete** |

---

## 3. Client suite — engine/logic files

| File (tests, measured) | What it proves | Why / notes | Tier |
|---|---|---|---|
| `engine.test.ts` (53, 93ms) | Initial layout, piece movement, king safety, check, PM promotion, Sak Mak auto-start, 8/16/64 counting, 65-move draw, mate precedence, stalemate, replay reconstruction, notation | The rules of the game. Everything else depends on this being right. Absurdly cheap | **S** |
| `botEngine.test.ts` (6, **27.6s**) | Legality across levels, config monotonicity, external-engine handoff ≥8, degenerate-budget fallback, 3 tactical fixtures (interpose/draw-rook/refund pawn grab) | Tactical fixtures prove the bot plays sensibly — irreplaceable. But it's the #1 client cost. **Trim:** the 12-level legality loop repeats near-identical searches; sample 3–4 levels → save roughly half the runtime | **S−** |
| `puzzleValidation.test.ts` (41, **13.3s**) | Validator rules (illegal pos, turn mismatch, ambiguity, incidental material, motif consistency, hint requirements), finalize canonicalization, quarantine behavior, play-through of shipped puzzles | The validator half is gold. **Consolidate hard:** pool-composition snapshots (lengths 19/32/34/35, id lists, audit counts) restate data files and break every curation edit; quarantine facts for 7002/9199/9200 asserted redundantly in 3–4 places. Keep rule fixtures + one pool-invariant test → save seconds and lots of maintenance | **A−** |
| `botCalibration.test.ts` (2, **17.5s**, up to 120s full) | Rating monotonicity, accuracy scaling, beginner-beatability | A calibration **job wearing a unit-test costume**: self-play search on every PR. Relocate to scheduled nightly workflow (it already supports env-gated modes) | **C — relocate** (single biggest unit-suite win) |
| `lessons.test.ts` (13, 722ms) | Curriculum invariants, catalog legality, guided-step/practice legality via real engine, doctrine candidates, opponent-best-reply soundness sweeps, unlock sequencing | Data-QA that prevents shipping broken lessons. **Trim:** catalog test duplicates explicit legality loop; eval sweeps partially overlap improvement heuristic | **A−** |
| `boardSession.test.ts` (9) | Scrub/live-view state machine, keyboard nav map, history-click resolution, editable-target detection | Canonical home for nav logic; drives every game screen | **S** |
| `analysisHelpers.test.ts` (7) | Position serialization/hashing incl. collision case, sessionStorage round-trip, uciToMove | Cache-invalidation correctness for analysis; cheap | **A** |
| `analysisAccuracy.test.ts` (8) | CP→win%, decay model, classification bands, aggregate accuracy, progress events | Shared analysis math; injected analyzer keeps it fast | **A** |
| `puzzleGeneration.test.ts` (13) | Replay-backing rejection, promoted-pawn ownership, theme classification, PGN parser, dedupe preference, doctrine predicates | Generator pipeline integrity. Three single-input predicate tests are near-tautological — fold | **A−** |
| `puzzleStreak.test.ts` (14) | Difficulty deltas, score/multiplier tables, tier progression, repeat/color variation, recent-window fallback | Product mechanics. **Cut** the 3 pool-alignment tests — hardcoded exclusion-id echoes of data, duplicating puzzleValidation auditing | **A−** |
| `i18nCatalog.test.ts` (3) | EN/TH key sync, blank-value ban, Thai terminology locks | Drift guard for a bilingual product | **A** |
| `reviewCopy.test.ts` (2) | Same sync/blank checks for review catalog | Worthwhile but **duplicated helper code** with i18nCatalog — extract shared helper | **A−** |
| `gameplayErrors.test.ts` (4) | Server strings → i18n keys; raw exception text never surfaces | Error-leak prevention; free | **A** |
| `usePostGameReview.test.tsx` (4) | Analysis branch state machine with the REAL engine: root switching, exact restoration, branch separation | Trickiest client state machine tested against reality; model hook test | **S** |
| `useGameSocket.test.tsx` (8) | Join-once semantics, pre-connected join, rejoin after reconnect, all server events, teardown, leave-on-unmount | The socket contract belongs here (not re-tested in page tests) | **S** |
| `useReviewEngineAnalysis.test.tsx` (3) | Debounced fetch, browser-first with server fallback, suppression flag | Exactly right hook testing | **A** |
| `browserEngineAnalysis.test.ts` (2) | UCI line parsing: cp/mate/PV/bestmove | Pure parsing, no WASM; excellent ratio | **A** |
| `selfPlay.test.ts` (2) | Seeded determinism, ply-cap termination | Cheap determinism guarantee | **A** |
| `regression/query-enable-logic.test.ts` (7) | Queries enable only for genuine game ids | Documents a real fixed bug; cheap | **A** |
| `cookieConsent.test.ts` (3) | Legacy migration, storage, event notification, analytics gating | GDPR-adjacent behavior; free | **A** |
| `analytics.test.ts` (5) | Consent-gated init/capture/opt-out/reset, once-per-session signup | Privacy contract; free | **A** |
| `botDialogue.test.ts` (4) | Recent-key avoidance, locale text, cooldown suppression | Deterministic, well-scoped | **A** |
| `makrukRuleSystem.test.ts` (5) | Honor limits, bare-king Sak Mak, timeout material adjudication, system structures | Adjudication test is unique. Limit/auto-start re-prove engine.test.ts end-to-end; structural checks are lint-grade — fold | **B** |
| `engineReplay.test.ts` (2) | Ply-exact reconstruction incl. counting state | Adds counting replay over engine.test.ts; merge eventually | **B** |
| `choiceWallDistill.test.ts` (3) | ≤4 choices per pace group, persona band caps | Encodes a real UX constraint on config data | **B** |
| `puzzleThemes.test.ts` (3) | Classification buckets incl. future-theme exclusion | Constant-shaped but encodes validator decisions | **B** |
| `gameMetaChips.test.ts` (3) | Chip class policy, emoji ban in labels, status-help truth table | Only the truth table tests logic. Chip regex + emoji locks are style/copy policing — cut those two | **B−** |
| `shouldShowMoveNavHint.test.tsx` (1) | 4-row boolean truth table | Near-trivial; merge into boardSession-style file | **B−** |
| `boards.test.ts` (3) | Category array echo; contrast numbers validated against magic ranges (no recomputation); unknown-id fallback | Only fallback test exercises behavior. Cut first two | **C — trim** |
| `makrukStroke.test.ts` (2) | Asserts stroke constants equal themselves (ratio math in one case) | Tautological. Fold the one real assertion elsewhere or delete | **D — delete** |
| `shareCardExport.test.ts` (5) | Site-host constant echo; origin restates implementation; URL routing for ephemeral ids; share-text composition | Keep URL-routing + text builders; cut the two self-referential tests | **C — trim** |
| `routes.test.ts` (4) | Asserts route constants equal their obvious string values | Tautological; overlaps seo sitemap test | **D — delete** |
| `engine.bench.test.ts` (~15 benches) | Performance benchmarks | Correctly excluded from `npm test`; runs via `npm run bench` only | n/a |

---

## 4. Client suite — components, pages, hooks

| File (tests) | What it proves | Why / notes | Tier |
|---|---|---|---|
| `QuickPlay.test.tsx` (17) | Matchmaking lifecycle: StrictMode-safe emit, cancel-on-unmount, queue status, 12s bot-fallback offer, connect_error recovery, autostart, rated messaging | Matchmaking edge cases have **no e2e equivalent**. **Cut:** marketing-copy-verbatim and chip-layout tests | **S−** |
| `LoginPage.test.tsx` (2) | OTP caches canonical user; `twoFactorRedirect` must not poison session cache | Guards real normalization bugs seen in production shapes | **S** |
| `AccountPage.test.tsx` (10) | Stats, rated-restriction messaging, stale-session handling, username cooldown with frozen clock, MFA enrollment end-to-end, session revoke-others | Security/session flows invisible to e2e | **S** |
| `AuthProvider.test.tsx` (3) | Deferred refresh until intent on home, immediate elsewhere, outage resilience | Perf + resilience behaviors with real provider | **S** |
| `Board.test.tsx` (28) | Rendering counts, highlights, SVG arrows incl. drag creation, mouse/touch drops, draggableColor override | Drag/touch is untested anywhere else. **Cut:** redundant white/black king renders, misnamed black-player render, null-color non-test | **S−** |
| `SpectatorPage.test.tsx` (2) | spectate_game join, read-only enforcement, history locked until game over | Read-only enforcement is hard to catch in e2e. Sound-call assertions are filler | **A** |
| `PuzzlePage.test.tsx` (14) | Streak scoring/auto-advance, hint, retry-without-streak-break, orientation from sideToMove, quarantine access, coach cards | Puzzles have zero e2e coverage. **Cut:** Tailwind class-string assertion, coach-card text sweep, one of the duplicate orientation pair | **A** |
| `BotGame.test.tsx` (12) | Persona setup, server→browser→local fallback chain, abort timeouts, clock-vs-request interplay, save on finish | Fallback chain is genuinely valuable. **Cut:** literal timeout-constant pins (config snapshot), start-face copy test | **A−** |
| `GamePageSidePanel.test.tsx` (3) | Panel ordering contract, counting-mode urgent toggle, modal suppresses panel/share chrome | Modal-suppression guards a real double-chrome bug; ordering is a deliberate design contract. Prop boilerplate begs for a factory | **A−** |
| `OfferDrawConfirm.test.tsx` (2) | Confirm gate emits exactly once, desktop + mobile | Prevents accidental resigns/draws — costly mistakes. Drop one class assertion | **A** |
| `ErrorBoundary.test.tsx` (2) | Chunk-load-error reload-once guard via sessionStorage; reporting after failed reload | Subtle production logic (reload loops are nasty) | **A** |
| `TwoFactorRoute.test.tsx` (3) | TOTP submit with trust-device → account; backup-code alternative | Security flows. Test 1 duplicates test 2's render path — cut it | **A−** |
| `AnalysisEditor.test.tsx` (6) | Piece banks, kingless-position block, localized validation messages, snapshot-key invalidation | Snapshot-key test is real cache coverage; message-map test is semi-circular | **A−** |
| `FeedbackWidget.test.tsx` (3) | Launcher hidden on play-operate routes, shown elsewhere | Legitimate product rule, very cheap | **A** |
| `HomePage.test.tsx` (16) | Private-game socket payloads (colorPreference/TC), join-by-code, listener cleanup, empty-state CTAs | Socket payload precision is unit-only value. **Cut:** verbatim tagline assertions, removed-content negatives, duplicate CTA navigation | **B+** |
| `GamesPage.test.tsx` (6) | Filter refetch URLs, finished-game routing to analysis not game, friendly errors, retry without reload | Routing decision is a real regression risk. CSS-class assertion noise | **B+** |
| `LessonsPlayerPage.i18n.test.tsx` (1) + `LessonsCoursePage.i18n.test.tsx` (1) | Thai chrome renders; obsolete strings absent | Only Thai-locale regression guard in repo (e2e never tests TH) | **B+** |
| `toast.test.tsx` (2) | Success/error auto-dismiss timing difference, manual close | Timing contract is behavioral. Class-split assertion compares component to its own constant — tautological, cut | **B** |
| `countingChrome.test.tsx` (4) | Start-first disclosure states | Disclosure tests are substantive; class-equality-vs-exported-constant assertions are circular — cut | **B** |
| `AppearanceSettingsPage.test.tsx` (2) | Theme selection persists to localStorage immediately | Real assertion buried under heading text; **10s timeouts smell — fix or trim** | **B** |
| `CapturedPiecesPanel.test.tsx` (2) | Grouping by captor, net material lead, even summary | Small, behavioral | **A−** |
| `MoveHistory.test.tsx` (1) | Scrolls container (not window) to active move | Precise scroll-container regression guard | **A−** |
| `InlineCapturedSummary.test.tsx` (2) | Icons with counts, material delta, empty render | Fine small component test | **B+** |
| `PieceSVG.test.tsx` (6) | All 14 type/color combos render with fills, promoted silhouette, sprite mapping per theme | Sprite/theme mapping valuable. Color-permutation hex pins brittle — spot-check instead | **B** |
| `BoardSnapshot.test.tsx` (2) | Coordinate labels EN/TH | Duplicates Board label tests for a second component; cheap | **B−** |
| `Header.test.tsx` (12) | Mobile menu hierarchy, Tools dropdown destinations, nav composition, Thai tooltips | **Parameterize** the 4 destination tests into one table-driven test; cut nav-composition snapshot + "no Import shortcut" negative (change-detectors) | **B−** |
| `GameOverClimax.test.tsx` (12) | Outcome seal instead of glyphs, spectator vs second-person copy, peak action ownership, scrim/gold policies | Keep outcome-mark rule (once, not 4×) and peak-path exclusivity. **Cut** oklch/shadow/color-class pairs and the duplicated modal↔panel "matches" contracts — visual-regression territory | **C — trim** |
| `Clock.test.tsx` (7) | Captured-summary placement, to-move indicator, reconnect dot, rating/latency chip parking rules | Info-hiding rules have some product value, but 5/7 tests freeze design-token classes. Keep placement + parking logic, drop color assertions | **C — trim** |
| `ConnectionStatus.test.tsx` (1) | Disconnect/reconnect banner states | Keep the data-status transition; the Tailwind class matrix is styling armor | **C — trim** |
| `PostGameSharePanel.test.tsx` (2) | Single OG canvas 1200×630, deferred accuracy/rating behind toggle, card switching | Deferral UX + OG dimensions are contracts; preview pixel math and lift-class membership are details — trim | **B** |
| `PostGameReviewPanel.test.tsx` (2) | Labeled nav buttons call handlers; glyph ban; soft-primary styling | Click-through is behavioral; the rest is style policing — halve it | **C — trim** |
| `LocalGame.test.tsx` (2) | View-as flip; resign while viewing black reports correctly | Test 2 carries real value. Test 1 is className regexes duplicating e2e local-game.spec — cut | **C — trim** |
| `GameScreenLayout.test.tsx` (3) | Status row slots; exported frame-class constant | Slot test fine; class-composition + circular constant re-assertion cut | **C — trim** |
| `BotGameSidePanel.test.tsx` (5) | Back affordance during play, nav-hint visibility, mid-play chat suppression policy | Behavioral via testids; niche but cheap | **B** |
| `LiveGamesPage.test.tsx` (2) | Listing loads, spectate nav, empty CTAs | Duplicates e2e discovery path; cheap but marginal — fold into HomePage or e2e | **C** |
| `LeaderboardPage.test.tsx` (1) | Renders ranked players, highlights own row | Render-only smoke, no interaction/edges. Delete or absorb into an e2e check | **D — delete** |
| `PuzzleRoutes.test.tsx` (2) | Wrappers render content "without lazy-loading shell" | Tests an implementation decision via absence-of-text; breaks if someone legitimately adds Suspense | **D — delete** |
| `LessonsPage.test.tsx` (2) | Rule fields render; refresh on param change | Param-change behavior valuable. Console.info log assertion tests a debug statement; aspect-ratio inline-style pin is brittle — cut both | **C — trim** |
| `i18nBootstrap.test.tsx` (1) | Bootstrap strings exist pre-catalog | Narrow cold-start flash guard; costs nothing | **B** |
| `seo.test.ts` (12) | Sitemap composition, per-route titles/robots, canonicalization, JSON-LD hydration dedupe | Noindex rules + hydration dedupe carry real value. **Cut** the hardcoded sitemap echo and title/image content pins | **B** |
| `a11y.test.tsx` (10) | Named "accessibility": 64 squares, 32 pieces, check indicator, selected/lastmove/legal-dot classes, context-menu prevention | Misnamed — asserts the same CSS classes Board.test.tsx already asserts; the aria-label check passes trivially because the mocked pieces always set one. No screen-reader semantics are actually verified. Delete; if a11y matters, add jest-axe (already a dependency pattern per AGENTS.md) assertions to Board.test.tsx | **D — delete** |

---

## 5. E2E suite (8 specs, 21 tests) — keep nearly all of it

| Spec | Journey | Notes | Tier |
|---|---|---|---|
| `live-multiplayer.spec.ts` (2) | Host+guest private game with move sync, spectate, seat reclaim after reload; quick-play pairing of two seekers | Heaviest (multiple contexts, socket polling) but covers the product's defining feature end-to-end. Unreplaceable | **S** |
| `bot-game-play.spec.ts` (2) | Long bot games never stick in premove | Regression guard for a real nasty bug; heavy but justified | **S** |
| `home.spec.ts` (5) | Hub navigation, setup reveal, dropdowns | Light-medium | **A** |
| `local-game.spec.ts` (4) | Board render, select/move/highlight, scroll anchoring | Medium | **A** |
| `local-game-analysis.spec.ts` (2) | Analysis routes for unsaved/local games, expired-session handling | 90s timeouts each; medium | **B+** |
| `bot-game-analysis.spec.ts` (2) | Same for bot games | Medium-heavy | **B+** |
| `database-openings.spec.ts` (2) | Search + explorer with fully mocked API | Light — good cost ratio | **A** |
| `analysis-layout.spec.ts` (2) | Keyboard nav keeps active move in viewport; variation branches | Seeded payload, no backend; medium-light | **A** |

The e2e cost problem is configuration, not scope: workers=1 + retries=1 + full dev-server boot. Sharding the two heavy specs onto separate workers, or moving them to a merge-queue/nightly lane, recovers minutes without losing journeys.

---

## 6. Stack rank summary

**Tier S — core correctness; never remove (delete nothing here):**
engine, boardSession, useGameSocket, usePostGameReview, gameManager, socketHandlers, database-rating, betterAuthEmailOtp, matchmaking, security, apiValidation, csrf (core 9), LoginPage, AccountPage, AuthProvider, QuickPlay (state machine), Board (drag/touch), live-multiplayer + bot-game-play e2e.

**Tier A — high value per cost; keep (minor internal trims noted above):**
auth, gamesRoutes, fairyStockfishBinary (fallback logic), database-puzzle-progress/-search-openings/-auth-schema, exportPuzzleSources, seoHtml, urlCanonicalization, monitoring, gameplayErrors, analysisHelpers/Accuracy/Mode, gamesQueries, browserEngineAnalysis, selfPlay, cookieConsent, analytics, botDialogue, i18nCatalog, reviewCopy, regression/query-enable-logic, lessons (legality/soundness), puzzleValidation (rules), puzzleStreak (mechanics), puzzleGeneration, SpectatorPage, PuzzlePage (mechanics), BotGame (fallback chain), GamePageSidePanel, OfferDrawConfirm, ErrorBoundary, TwoFactorRoute (2,3), AnalysisEditor, FeedbackWidget, CapturedPiecesPanel, MoveHistory, home/local-game/database-openings/analysis-layout e2e.

**Tier B — legitimate but marginal; keep cheap, consolidate where flagged:**
spa, leaderboardPagination, smokeStartConfig, database-config (fix flaky assumption), makrukRuleSystem (adjudication), engineReplay, makrukNativeLessonSystem (unify with lessons), choiceWallDistill, puzzleThemes, gameMetaChips (truth table), shouldShowMoveNavHint, i18nBootstrap, LessonsPlayer/Course i18n, LessonsPage (param switch), HomePage (payload precision), GamesPage (routing), Header (parameterized), PieceSVG (theme map), BoardSnapshot, InlineCapturedSummary, BotGameSidePanel, AppearanceSettings (persistence), toast (timing), countingChrome (disclosure), PostGameSharePanel (deferral), seo (robots/hydration), local-game-analysis/bot-game-analysis e2e.

**Tier C — low value as written; trim to essentials or relocate:**
botCalibration (**relocate to nightly** — biggest single win), GameOverClimax, Clock, ConnectionStatus, PostGameReviewPanel, LocalGame (test 1), GameScreenLayout, LiveGamesPage, LessonsPage (log/style assertions), fairyStockfishBinary ms-pins, csrf route-pinning, boards (#1–2), shareCardExport (#1–2), botEngine level-loop.

**Tier D — delete outright:**
`regression/template.test.ts`, `routes.test.ts`, `makrukStroke.test.ts`, `backfillGamePositions.test.ts` (server), `a11y.test.tsx`, `LeaderboardPage.test.tsx`, `PuzzleRoutes.test.tsx`.

---

## 7. Concrete removal/consolidation plan

### Delete now (~0 risk, pure noise reduction)
1. `client/src/test/regression/template.test.ts` — contains `expect(true).toBe(true)`; vacuous.
2. `client/src/test/routes.test.ts` — asserts constants equal themselves.
3. `client/src/test/makrukStroke.test.ts` — same.
4. `server/src/test/backfillGamePositions.test.ts` — greps SQL strings; replace with one seeded-SQLite execution test only if backfill correctness ever bites.
5. `client/src/test/a11y.test.tsx` — misnamed duplication of Board class checks; replace with jest-axe on Board if a11y coverage is wanted.
6. `client/src/test/LeaderboardPage.test.tsx` — render smoke.
7. `client/src/test/PuzzleRoutes.test.tsx` — anti-feature detector.

### Trim inside files (biggest maintenance + some runtime win)
8. `puzzleValidation`: delete pool-snapshot + repeated quarantine-permutation tests → keep validator rules + one invariant. (~13s file shrinks; curation edits stop breaking CI.)
9. `puzzleStreak`: delete 3 pool-alignment id-echo tests.
10. `GamePage`: delete 4 tests duplicating `useGameSocket` (join/join-immediate/rejoin/leave-unmount); delete sound-call and copied-label timer assertions.
11. `auth.test.ts` vs `betterAuthEmailOtp.test.ts`: keep the OTP sign-in scenario in one file.
12. `csrf.test.ts`: delete protected-route source-scanning pin.
13. `fairyStockfishBinary`: collapse ms-constant pins to boundaries (level 1/12, role extremes).
14. `BotGame`: delete `getBotRequestTimeoutMs` constant table test.
15. `GameOverClimax`/`Clock`/`ConnectionStatus`/`PostGameReviewPanel`/`LocalGame`/`GameScreenLayout`/`Header`/`countingChrome`/`gameMetaChips`/`boards`/`shareCardExport`: apply the per-file cuts listed above (style-token class matrices, duplicated "matches" contracts, nav-composition snapshots, console.log assertion, circular constant comparisons). If visual policy matters, adopt visual regression tooling rather than Vitest class regexes.
16. `botEngine`: sample legality levels (e.g., 1/6/10/12) instead of all 12 → ~10s saved.
17. `database-config`: make the default-URL assertion deterministic (stop depending on `data/makruk.db` existing).
18. `seo.test.ts`: stop echoing the full sitemap array; assert count + spot routes.

### Relocate out of the PR path
19. `botCalibration` → scheduled nightly workflow (env vars for full mode already exist). Removes up to a 120s ceiling from every PR.

## 8. Pipeline fixes (these dwarf the test deletions)

1. **Split `npm test` into two parallel jobs** (client, server). Today they run sequentially in one job: wall becomes max(client, server) instead of the sum.
2. **Gate the two nub-shadow jobs** with `paths: ['package-lock.json', '**/package.json']` (or delete them). They re-install deps and re-run the server suite on every PR — including docs PRs — and cannot fail the build anyway. Server suite then executes once per PR instead of three times.
3. **E2E**: shard so `live-multiplayer` and `bot-game-play` don't serialize behind everything else (workers>1 with per-spec sharding, or a dedicated job), and reuse the dev-server boot across projects. Consider running e2e on `merge_group`/post-merge if PR latency matters more than pre-merge confidence.
4. **Deploy latency is Northflank, not Actions**: enable build caching (deps + Vite/WASM layers), or build/push the image in Actions on main and have Northflank deploy by digest. Also decide the fate of the unused `thaichess-release.tgz` artifact step and the leftover `render-build` script.

**Expected effect:** PR feedback roughly halves (dominated by items 1–3), unit suite sheds ~35–45s CPU plus a 17.5–120s calibration outlier, and the suite stops punishing content/data edits (puzzle pools, nav, styling) that currently break dozens of change-detector assertions.

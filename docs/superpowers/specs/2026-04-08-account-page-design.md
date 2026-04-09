# Account Page Redesign

Date: 2026-04-08
Status: Proposed
Direction: Rally Board

## Goal

Redesign the account page so it feels like a player hub rather than a generic settings screen.

The page should optimize for:

- first-time account completion, especially claiming a username
- casual and returning players
- a competitive, game-like tone without becoming intimidating

## Problems In The Current Page

- The page gives equal visual weight to profile editing, stats, puzzle progress, and secondary actions.
- The primary action is unclear even though username setup is the most important next step.
- The layout feels box-heavy and generic.
- The account route incorrectly highlights the About tab in the header.
- Puzzle progress is useful but visually disconnected from the player identity area.

## Design Direction

Use a `Rally Board` layout:

- profile completion is the hero section
- player stats act as supporting context
- puzzle continuation reads like the next move in the player journey
- destructive and secondary actions are pushed lower

The visual tone should stay consistent with ThaiChess:

- dark surface palette
- warm brass and green accents
- compact, game-like information blocks
- clearer hierarchy and less repeated card framing

## Layout

### Desktop

Use a dominant-left two-column layout:

- Left column: account hero, username setup, core player stats, account actions
- Right column: puzzle progress summary, next puzzle, recent puzzle activity

The left column should visually dominate because the page priority is profile completion.

### Mobile

Stack sections in this order:

1. account hero and username setup
2. core stats
3. next training move
4. puzzle progress details
5. secondary actions

This keeps the primary action visible before less important navigation and history.

## Components

### 1. Account Hero

Purpose:
- establish identity
- make username setup the clearest next step

Content:
- account title
- player email
- role badge
- short support copy explaining why the username matters
- username field
- primary save button
- success and error states below the form

### 2. Core Stats Strip

Purpose:
- give immediate game-related context without overpowering the form

Content:
- rating
- rated games
- wins
- losses
- draws

The styling should feel like a match summary rather than admin analytics.

### 3. Fair Play Notice

Purpose:
- preserve important safety/account state

Behavior:
- remain visible near the top when the user is restricted
- stay visually distinct from the main hero

### 4. Next Training Move

Purpose:
- connect the account page to useful next gameplay action

Content:
- continue puzzle card if a puzzle is available
- fallback state when puzzle progression is fully complete
- light metadata such as difficulty and theme

This should feel like a single recommended next move, not a separate dashboard.

### 5. Puzzle Progress Summary

Purpose:
- show account-linked progress in a compact way

Content:
- completed count
- remaining count
- favorite theme
- recent puzzle activity

### 6. Secondary Actions

Purpose:
- keep utilities accessible without competing with the main action

Content:
- leaderboard
- admin actions when applicable
- sign out

Placement:
- lower on the page
- visually quieter than the save action

## Navigation

The account page must stop highlighting the About tab.

Options:
- either render the header without an active public nav item
- or extend the header to support an account-specific active state

Recommended:
- render the header with no misleading active item on the account route

## Data And Behavior

No schema or API changes are required.

Reuse existing behavior:

- `useAuth()` for user, logout, and username updates
- existing account translations
- existing puzzle progress hooks and summary data

Preserve:

- redirect to login when unauthenticated
- admin-only account actions
- existing profile update request and validation

## Error Handling

- Keep current loading fallback for authenticated page load.
- Keep inline form success and error messages.
- Do not block puzzle progress rendering if username update fails.
- Preserve restricted-user messaging as a separate state from profile setup.

## Testing

Focus testing on:

- account page still redirects unauthenticated users to login
- username save action remains visible and functional
- Facebook button removal on login page remains intact
- header no longer highlights About on the account route
- account page still renders puzzle continuation and account actions correctly

## Scope

In scope:

- account page layout redesign
- improved hierarchy and styling
- header active-state fix for account route

Out of scope:

- new account features
- new database fields
- new onboarding workflows
- Facebook rollout

## Recommendation

Implement the redesign as a focused UI pass with no product-scope expansion.

This gives the account page a clearer purpose immediately, matches the current auth rollout, and reduces the risk of mixing visual cleanup with feature work.

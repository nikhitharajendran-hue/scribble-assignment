# Implementation Plan: Round Mechanics — Drawing, Guessing & Scoring

## Problem Summary

When a round is active, the drawer draws on a canvas while guessers submit
guesses. Drawing data and guess history must be synced to all players via
HTTP polling. Guesses must be validated (trimmed, non-empty,
case-insensitively compared). Correct guesses score 100 points.

## Implementation Phases

| Phase | Scope | Files |
|-------|-------|-------|
| **1. Setup** | Verify baseline (tests pass, app compiles) | — |
| **2. Data Model** | Add `score` to `Participant`; `canvasData` + `guessHistory` to `Room` and `RoomSnapshot`; new `Stroke` / `GuessEntry` types | `backend/src/models/game.ts` |
| **3. Canvas Backend** | `POST /rooms/:code/canvas` endpoint; storage + snapshot return; drawer-only write guard | `backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`, `backend/src/services/roomStore.ts` |
| **4. Guess Backend** | `POST /rooms/:code/guess` endpoint; validation, comparison, scoring, history | `backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`, `backend/src/services/roomStore.ts` |
| **5. Frontend — Types & API** | Update frontend types, add `submitCanvas` and `submitGuess` API methods | `frontend/src/services/api.ts` |
| **6. Frontend — Canvas** | Interactive canvas component for the drawer; stroke capture, clear, and server sync | `frontend/src/components/Canvas.tsx`, `frontend/src/pages/GamePage.tsx` |
| **7. Frontend — Guess Form** | Wire `GuessForm` to the backend; show submission result | `frontend/src/components/GuessForm.tsx` |
| **8. Frontend — Scoreboard** | Wire `Scoreboard` to participant scores from snapshot | `frontend/src/components/Scoreboard.tsx` |
| **9. Frontend — Activity/History** | Wire `ResultPanel` to `guessHistory` from snapshot | `frontend/src/components/ResultPanel.tsx` |
| **10. Polish** | Full test pass, lint, typecheck | All |

## Key Design Decisions

1. **Stroke-based canvas serialisation**: Canvas data is stored as an array
   of stroke objects, each containing an array of `{x, y}` points. This is
   compact and easy to merge/diff, unlike bitmap snapshots.

2. **Drawer-only write guard on canvas**: Only the current drawer may write
   to the canvas. The server checks `participantId === room.currentDrawerId`
   before accepting canvas updates.

3. **Guess comparison**: `guess.trim().toLowerCase() ===
   secretWord.trim().toLowerCase()`. No stemming or fuzzy matching.

4. **Score-tracked with per-round guard**: `score` is an integer field on
   the `Participant` object. `correctGuessersThisRound` is a `string[]` on
   the `Room` (list of participant IDs who have guessed correctly this
   round). The guess endpoint checks this list — not `score > 0` — to
   determine whether a player has already guessed correctly. This avoids
   the multi-round bug where a cumulative score check would incorrectly
   block returning players.

5. **Guess history as room-level array**: All guesses (correct and
   incorrect) are appended to a `guessHistory` array on the room. This is
   included in every snapshot so all players see the same history. Entries
   are capped at 200 to prevent unbounded growth.

6. **Reuse of existing polling**: No new polling mechanism. The existing
   `startPolling` in `roomStore.ts` (2s interval on `GET /rooms/:code`)
   already fetches the full snapshot. Adding `canvasData` and `guessHistory`
   to the snapshot automatically makes them available to all clients.

7. **Canvas clear is a special canvas write**: A `POST /rooms/:code/canvas`
   with an empty stroke array (`[]`) clears the canvas. No separate clear
   endpoint.

8. **Canvas size fixed at 800×600**: All players use the same canvas
   resolution (800×600 CSS pixels). Coordinates are absolute pixels. This
   avoids scaling complexity and guarantees the drawing looks identical to
   everyone.

9. **Canvas style**: All strokes are black, 3px width, solid line. No
   colour picker or brush size in V1.

10. **Drawer's side panel**: The drawer sees their role ("You are the
    drawer") and the secret word in the right panel, replacing the
    guess form that guessers see.

11. **Guess deduplication (case-insensitive)**: Once a guesser is correct,
    all subsequent guesses from that player are silently ignored (not
    recorded, not checked). For incorrect guesses, only the first
    occurrence of a given guess text per player is recorded; duplicates
    are silently dropped. Dedup comparison is case-insensitive (consistent
    with the correctness check).

12. **`resolveWord` must be exported**: The function currently exists as a
    module-private function in `roomStore.ts`. The guess endpoint needs it
    to compare guesses against the secret word. It will be exported or
    refactored into a shared helper.

13. **LobbyPage → GamePage transition + polling handoff**: The LobbyPage
    redirects to `/game` when `room.status` becomes `in-progress`. The
    GamePage starts its own polling on mount (same pattern as LobbyPage's
    `startPolling`). This ensures the canvas, guess history, and scores
    stay live during gameplay.

14. **Canvas coordinate validation**: Zod schema constrains `x` to
    [0, 800) and `y` to [0, 600). Strokes are capped at 1000 points each.
    Malformed payloads are rejected early.

15. **Auto-end round on all correct guesses**: After each correct guess,
    `submitGuess` checks whether all non-drawer participants are now in
    `correctGuessersThisRound`. If so, the room status transitions to
    `finished` automatically. No separate `endRound` call is needed. The
    host can still call `POST /rooms/:code/end-round` for manual early
    termination. This check runs inside `submitGuess` after awarding
    points and updating state, ensuring the snapshot returned with the
    guess response already reflects the finished state.

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Large canvas payloads slow polling | Medium | Cap strokes at 500, points-per-stroke at 1000; no pressure/width for V1 |
| Guess race condition (two guesses at same time) | Low | Requests are sequential; server processes one at a time per room |
| Frontend canvas component complexity | Medium | Use existing HTML Canvas API; start with freehand lines only (no shapes, no colours) |
| ESLint/TypeScript issues | Low | Run typecheck after each phase |
| GamePage lacks polling after LobbyPage redirect | Medium | Add explicit `startPolling` call in GamePage `useEffect` |
| JSON body size exceeded by canvas payload | Low | Increase `express.json()` limit to 1mb |
| Forgetting to export `resolveWord` | Medium | Exported explicitly; task references this requirement |
| Zod error handler returns generic message | Medium | Update errorHandler to propagate first Zod issue message |

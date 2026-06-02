# Implementation Plan: Round End & Restart

## Problem Summary

When a round ends, all players must see the correct word, final scores,
and full guess history. The host can then restart the game, returning
everyone to lobby with round state cleared but players and cumulative
scores preserved.

## Implementation Phases

| Phase | Scope | Task IDs | Files |
|-------|-------|----------|-------|
| **1. Setup** | Verify baseline (tests pass, app compiles) | T001 | — |
| **2. Foundational** | `hostActionSchema` Zod schema shared by end-round and restart routes | T002 | `backend/src/api/schemas.ts` |
| **3. US1 — Round Results Display** | `endRound` service function + `POST /rooms/:code/end-round` route; `toRoomSnapshot` exposes word to all when `finished`; tests | T003–T006 | `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts` |
| **4. US2 — Host Restarts the Game** | `restartGame` service function (clear round state, preserve players + scores) + `POST /rooms/:code/restart` route; tests | T007–T009 | `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts` |
| **5. US3 — Frontend Results Page** | Add `endRound`/`restartGame` to API layer and store; create `ResultsPage.tsx`; add `/results` route; GamePage redirect + ResultsPage polling; tests | T010–T016 | `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/ResultsPage.tsx`, `frontend/src/routes/index.tsx`, `frontend/src/pages/GamePage.tsx` |
| **6. Polish** | Full test pass, lint, typecheck | T017–T020 | All |

## Key Design Decisions

1. **`toRoomSnapshot` exposes word on `finished`**: When `room.status === "finished"`, `currentWord` is returned to ALL viewers (not just the drawer). This is a one-line change in `toRoomSnapshot`.

2. **Restart clears round state only**: `canvasData`, `guessHistory`, `correctGuessersThisRound`, `currentDrawerId`, `currentRound`, and each participant's `gameRole` are reset. Participants and their `score` values are preserved.

3. **No new RoomStatus values**: `"finished"` already exists in the type. End-round transitions `in-progress → finished`. Restart transitions `finished → lobby`.

4. **Results page is a standalone route**: `/results` renders a read-only view of the finished snapshot. This is simpler than overlaying results on the GamePage.

5. **End-round trigger not specified**: A manual `POST /rooms/:code/end-round` endpoint is provided. The trigger (timer, all-correct, host action) is out of scope. This endpoint gives a clear mechanism for future spec integration.

6. **Reuse of existing polling**: No polling changes needed. GamePage redirects to `/results` when `status === "finished"` (detected on poll). ResultsPage redirects to `/lobby` when `status === "lobby"` (detected on poll or after restart call).

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Existing `toRoomSnapshot` has `isViewerDrawer` guard that blocks word for non-drawers | Low | Single-line change: remove the guard when status is `finished` |
| Restart clears scores accidentally | Medium | Explicitly preserve scores in the restart function; verified by tests |
| Frontend navigation loops (redirect → redirect → redirect) | Low | Guard with status checks; only redirect on specific transitions |
| Polling during results shows transient states | Low | Snapshot updates atomically; no transient state between end-round and restart |

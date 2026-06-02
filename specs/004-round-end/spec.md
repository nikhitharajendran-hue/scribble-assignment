# Feature Specification: Round End & Restart

**Feature Branch**: `004-round-end`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Round Results Display (Priority: P1)

When a round ends, all participants see a results view showing the correct
word, each player's final score for the round, and the full guess history
from the round.

**Why this priority**: Players need closure on each round — knowing the
answer and how everyone performed is core to the game experience.

**Independent Test**: Start a game, submit guesses, call the end-round
endpoint, verify the snapshot includes `status: "finished"`, the correct
word visible to all, and `guessHistory` intact.

**Acceptance Scenarios**:

1. **Given** a round is in progress, **When** the round ends,
   **Then** the room status changes to `"finished"`.
2. **Given** the room status is `"finished"`, **When** any participant
   fetches the snapshot, **Then** `currentWord` contains the secret word
   (visible to all players, not just the drawer).
3. **Given** the room status is `"finished"`, **When** the snapshot is
   fetched, **Then** `guessHistory` contains all guesses from the round
   and `canvasData` contains the final drawing.
4. **Given** the room status is `"finished"`, **When** the snapshot is
   fetched, **Then** each participant's `score` reflects their cumulative
   points.
5. **Given** the room status is `"in-progress"`, **When** a non-host
   attempts to end the round, **Then** the response is a 403 error.

---

### User Story 2 — Host Restarts the Game (Priority: P1)

After a round ends, the host can restart the game, returning all players
to the lobby with their identities preserved and all round-specific state
cleared. Scores persist across rounds.

**Why this priority**: Players who want to play again should not need to
re-create or re-join the room. A single click should reset for a new game.

**Independent Test**: End a round as host, restart, verify the room status
is `"lobby"`, players are intact, scores are preserved, but `canvasData`,
`guessHistory`, `currentDrawerId`, `currentRound`, and `gameRole` are
all reset.

**Acceptance Scenarios**:

1. **Given** the room status is `"finished"`, **When** the host calls
   restart, **Then** all participants remain in the room and the room
   status returns to `"lobby"`.
2. **Given** the room has been restarted, **When** any participant fetches
   the snapshot, **Then** `canvasData` is `[]`, `guessHistory` is `[]`,
   `currentDrawerId` is `null`, `currentRound` is `0`, and all
   participants have `gameRole: null`.
3. **Given** the room has been restarted, **When** any participant fetches
   the snapshot, **Then** each participant's `score` retains its value
   from before the restart (cumulative across rounds).
4. **Given** the room status is `"finished"`, **When** a non-host attempts
   to restart, **Then** the response is a 403 error.
5. **Given** the room status is `"lobby"` (not finished), **When** any
   player calls restart, **Then** the response is a 400 error ("Game is
   not finished").

---

### User Story 3 — Frontend Results Page (Priority: P1)

When the round ends, the frontend shows a results page with the correct
word, final scoreboard, and guess history. A "Play Again" button is
visible to the host.

**Why this priority**: The results display is the player-facing endpoint
of each round. Without it, players have no feedback on the round outcome.

**Independent Test**: End a round via the backend, navigate to the results
page in the frontend, verify the correct word, scores, and history are
displayed.

**Acceptance Scenarios**:

1. **Given** the room status is `"finished"`, **When** the frontend polls
   the snapshot, **Then** it renders a results page showing the correct
   word, final scores, and guess history.
2. **Given** the viewer is the host, **When** the results page is shown,
   **Then** a "Play Again" button is visible.
3. **Given** the viewer is not the host, **When** the results page is
   shown, **Then** the "Play Again" button is disabled with a tooltip
   "Waiting for host to restart".
4. **Given** the host clicks "Play Again", **When** the restart completes,
   **Then** the frontend navigates to the lobby page.

---

### Edge Cases

- **Restart from lobby**: Calling restart on a room that is already in
  `"lobby"` status returns a 400 error.
- **End round from lobby**: Calling end-round on a room that is not
  `"in-progress"` returns a 400 error.
- **Non-host end-round**: Calling end-round as a non-host returns a 403
  error.
- **End round idempotent**: If the room is already `"finished"`, calling
  end-round again returns the current snapshot (idempotent).
- **Restart idempotent**: If the room is already `"lobby"`, calling
  restart again returns a 400 error (idempotent not applicable — must be
  finished first).
- **GameRoles reset**: After restart, all `gameRole` values are `null`.
  The next `startGame` call assigns them fresh.
- **Host leaves during results**: Standard host transfer logic applies
  (transfers to next-joined participant). The new host can restart.
- **Empty room restart**: If all players left before restart, standard
  room cleanup deletes the room. Restart becomes impossible (room gone).
- **Multiple rounds, cumulative scores**: Scores accumulate across
  rounds. If Alice scored 100 in round 1 and 100 in round 2, her total
  is 200. Restart does NOT reset scores — only round state (canvas,
  history, drawer, roles) is cleared.
- **Frontend polling during results**: The existing polling loop continues
  to fetch the snapshot on `"finished"` status. No polling changes needed.
- **Frontend navigation on restart**: After restart succeeds, the frontend
  navigates back to `/lobby`, where the existing LobbyPage polling picks
  up.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support a `POST /rooms/:code/end-round`
  endpoint that transitions the room from `"in-progress"` to `"finished"`.
- **FR-002**: When the room status is `"finished"`, the `currentWord` field
  MUST contain the secret word for ALL viewers (not just the drawer).
- **FR-003**: The room snapshot MUST include the final `guessHistory` and
  `canvasData` when status is `"finished"`.
- **FR-004**: The system MUST support a `POST /rooms/:code/restart`
  endpoint, restricted to the host, that transitions the room from
  `"finished"` to `"lobby"`.
- **FR-005**: On restart, the system MUST clear all round-specific state:
  `canvasData` → `[]`, `guessHistory` → `[]`,
  `correctGuessersThisRound` → `[]`, `currentDrawerId` → `null`,
  `currentRound` → `0`, and all participants' `gameRole` → `null`.
- **FR-006**: On restart, participants MUST be preserved in the room
  (no one is removed) and their `score` values MUST persist.
- **FR-007**: Calling restart as a non-host MUST return a 403 error with
  message "Only the host can restart the game".
- **FR-008**: Calling restart on a room that is not `"finished"` MUST
  return a 400 error with message "Game is not finished".
- **FR-009**: Calling end-round on a room that is not `"in-progress"` MUST
  return a 400 error with message "Game is not in progress".
- **FR-010**: Calling end-round as a non-host MUST return a 403 error with
  message "Only the host can end the round".
- **FR-011**: The frontend MUST display a results page when the room
  status is `"finished"`, showing the correct word, final scoreboard,
  and full guess history.
- **FR-012**: The frontend MUST show a "Play Again" button for the host
  and a disabled "Waiting for host to restart" message for non-hosts.

### Key Entities

- **Room** (no changes to existing fields): The existing `RoomStatus` type
  (`"lobby" | "in-progress" | "finished"`) already supports the finished
  status. No new fields required.
- **Results view**: Not a stored entity — derived from `RoomSnapshot`
  when `status === "finished"`, where `currentWord` is exposed to all.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After end-round, all participants see `currentWord` in
  their snapshot within one poll cycle (≤3s).
- **SC-002**: After restart, the snapshot confirms all round state is
  cleared and players are preserved (verified via API).
- **SC-003**: Non-host restart attempts are rejected 100% of the time.
- **SC-004**: Non-finished restart attempts are rejected 100% of the time.
- **SC-005**: Cumulative scores persist correctly across restarts.

## Clarifications

### Session 2026-06-02

- Q: Who can call end-round? → A: Only the host can end the round (consistent with restart semantics).

## Assumptions

- The round-end trigger (e.g., all correct, timer, manual host action) is
  out of scope for this feature. This spec covers what happens once the
  round has ended, not how it ends.
- The `"finished"` status already exists in the `RoomStatus` type.
- Existing polling is reused — no changes to polling interval or
  mechanism.
- The frontend creates a new results page (or uses the existing GamePage
  with a results overlay) — covered in the frontend tasks.
- The frontend navigates back to `/lobby` on restart, where the existing
  LobbyPage polling and UI resume.
- `startGame` (from 002) already handles assigning the host as drawer
  for the next round. No changes to that flow are needed.

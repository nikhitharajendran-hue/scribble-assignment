# Feature Specification: Round Start — Drawer & Word Assignment

**Feature Branch**: `002-round-start-drawer-word`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player Name Validation on Create/Join (Priority: P1)

Player names are trimmed of whitespace. Empty or whitespace-only names
are rejected with "Name is required" on both room creation and join.

**Why this priority**: Valid player names are a prerequisite for any round.
Without this, the drawer assignment could involve nameless participants.

**Independent Test**: Create a room with a space-only name → error.
Join a room with a space-only name → error. Create with "  Alice  "
→ name stored as "Alice".

**Acceptance Scenarios**:

1. **Given** a player enters a name with leading/trailing spaces,
   **When** they create a room, **Then** the name is stored trimmed.
2. **Given** a player enters an empty string, **When** they create a room,
   **Then** the response is a 400 error with message "Name is required".
3. **Given** a player enters only whitespace characters, **When** they
   join a room, **Then** the response is a 400 error with message
   "Name is required".

---

### User Story 2 - Drawer Assigned on Game Start (Priority: P1)

When the host starts the game, the first participant (the host, or the
earliest-joined after host transfer) is assigned as the drawer for the
first round. The drawer is clearly identified in the room snapshot via
a `currentDrawerId` field.

**Why this priority**: Core game mechanic — every round needs exactly one
drawer, and the first round needs a deterministic assignment rule.

**Independent Test**: Create a room, join a second player, host starts
game → room snapshot includes `currentDrawerId` matching the host's
participant ID. Non-host participants differ from drawer.

**Acceptance Scenarios**:

1. **Given** a room with 2+ participants, **When** the host starts the
   game, **Then** the room snapshot contains a `currentDrawerId` field
   matching the host's participant ID.
2. **Given** the host has transferred to another player (host left before
   start), **When** the new host starts the game, **Then** the
   `currentDrawerId` matches the new host.
3. **Given** a game is in progress and a snapshot is fetched, **When**
   the viewer is the drawer, **Then** they see `currentDrawerId` and
   their own `role` reflects they are the drawer.
4. **Given** a snapshot is fetched, **When** the viewer is not the drawer,
   **Then** they see `currentDrawerId` but their own `role` reflects
   they are a guesser.

---

### User Story 3 - Secret Word Visible Only to Drawer (Priority: P1)

When the round starts, a secret word is chosen deterministically from the
starter words list. Only the drawer sees the word; non-drawers see
`currentWord: null` or the word is omitted from their snapshot.

**Why this priority**: The core drawing/guessing game loop depends on the
drawer knowing the word and guessers not knowing it.

**Independent Test**: Start a game as host (drawer) → snapshot includes
`currentWord`. Fetch snapshot as a non-drawer → `currentWord` is absent
or `null`.

**Acceptance Scenarios**:

1. **Given** a game has started, **When** the drawer fetches the room
   snapshot, **Then** `currentWord` contains the secret word string.
2. **Given** a game has started, **When** a non-drawer participant fetches
   the room snapshot, **Then** `currentWord` is `null`.
3. **Given** a game has started, **When** an unauthenticated viewer
   (no `participantId`) fetches the snapshot, **Then** `currentWord`
   is `null`.

---

### User Story 4 - Deterministic Word Selection (Priority: P2)

The secret word is selected deterministically from the starter list based
on the room code and round number, ensuring all participants agree on which
word is active without communication.

**Why this priority**: Multiplayer consistency — the drawer and guessers
must reference the same word. A deterministic function avoids a separate
"word broadcast" step.

**Independent Test**: Start two rooms with the same code → impossible
(codes are unique). Instead, verify that for a given room, repeated calls
to resolve the word for round N return the same value.

**Acceptance Scenarios**:

1. **Given** a room in `in-progress` status, **When** the word for the
   current round is resolved, **Then** the same word is returned every
   time for that room and round number.
2. **Given** the starter words list contains `["rocket", "pizza",
   "castle", "guitar", "sunflower"]`, **When** the round advances,
   **Then** the next word in deterministic order is selected.

---

### Edge Cases

- What happens if the starter words list is exhausted (more rounds than words)?
- What happens if the drawer leaves mid-round?
- How does the system handle `/rooms/:code` polling during an active round?
- What happens if the drawer's snapshot is fetched with an invalid participantId?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST trim leading and trailing whitespace from
  player names on create and join.
- **FR-002**: System MUST reject player names that are empty or
  whitespace-only with a 400 error and message "Name is required".
- **FR-003**: When the game starts (`lobby` → `in-progress`), the
  system MUST assign the host as the drawer and set `currentDrawerId`
  on the room.
- **FR-004**: The room snapshot MUST include `currentDrawerId`
  identifying the current drawer.
- **FR-005**: The room snapshot MUST include a `currentWord` field set
  to the secret word for the drawer, and `null` for all other viewers.
- **FR-006**: The active word MUST be selected deterministically from
  the starter words list based on room code and round number (e.g.,
  `hash(roomCode + roundNumber) % words.length`).
- **FR-007**: When the drawer fetches the snapshot, their participant
  entry MUST reflect the drawer role (e.g., `role: "drawer"`).
- **FR-008**: Guesser participants MUST NOT see the secret word in any
  API response.

### Key Entities

- **Room** (extended): New fields `currentDrawerId`, `currentRound`
  (starting at 1), `currentWord` (transient, only populated based on
  viewer).
- **Round**: Not a stored entity — derived from `currentRound` counter
  on the Room and the deterministic word function.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Player names with leading/trailing whitespace are trimmed
  in every case (100% of create/join calls).
- **SC-002**: The drawer is correctly identified in the room snapshot
  immediately after the game starts (within 1 API call).
- **SC-003**: The secret word appears in the drawer's snapshot and is
  absent from all non-drawer snapshots (100% of cases).
- **SC-004**: The word selection is deterministic — the same room+round
  always produces the same word.

## Assumptions

- The current implementation assigns the host as the drawer for round 1.
  Future rounds will cycle through participants (out of scope for this
  feature).
- The starter words list is the same `["rocket", "pizza", "castle",
  "guitar", "sunflower"]` from the seed data.
- Round numbers start at 1 and increment by 1 each round.
- The drawer can see the word at any time during the round by fetching
  the room snapshot.
- If the word list is exhausted (unlikely with 5 words for a single
  round), the word wraps around (index % words.length).

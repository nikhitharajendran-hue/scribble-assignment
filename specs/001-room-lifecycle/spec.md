# Feature Specification: Room Lifecycle

**Feature Branch**: `001-room-lifecycle`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Host tracking on room creation, join validation with clear error messages, verified multi-room isolation, automatic lobby polling within about 2 seconds, host-only start with 2-player minimum"

## Clarifications

### Session 2026-06-01

- Q: What happens when the host leaves the room? → A: Transfer host to the next-joined participant (the one with earliest join time after the current host)
- Q: What happens when a player tries to join a room that is full? → A: No hard limit; any number may join until the host starts
- Q: What should the frontend do when polling fails (backend unreachable)? → A: Silently retry next interval; show "Connection lost" inline message after 3 consecutive failures
- Q: How should the system handle rapid repeated "Start Game" clicks by the host? → A: Idempotent — subsequent starts return room snapshot with status already in-progress
- Q: What happens if the room is deleted while players are in the lobby? → A: Never delete rooms with active participants; clean up only when all players have left

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Room as Host (Priority: P1)

A player opens the app, enters a name, and creates a new game room. They are
automatically designated as the host and can see their host status.

**Why this priority**: Host identity is the foundation for all subsequent
moderation actions (start game, kick players, etc.). Without host tracking,
no other story can function.

**Independent Test**: Can be tested by creating a room and verifying the
response includes a `role: "host"` for the creator. No other participants
needed.

**Acceptance Scenarios**:

1. **Given** a player is on the start page, **When** they enter a name
   and click "Create Room", **Then** a room is created and the response
   includes that player as a participant with `role: "host"`.
2. **Given** a host exists in a room, **When** a snapshot is fetched,
   **Then** the host participant has `role: "host"` while others have
   `role: "guesser"`.

---

### User Story 2 - Join Room with Validation (Priority: P1)

A player enters a room code and their name, and joins an existing room.
Invalid or missing inputs produce clear error messages.

**Why this priority**: The core multiplayer loop requires players to join
rooms. Validation prevents confusion and bad state.

**Independent Test**: Can be tested by attempting joins with various
invalid inputs (empty name, bogus code, full room) and verifying the
returned error messages are human-readable and specific.

**Acceptance Scenarios**:

1. **Given** a room exists, **When** a player joins with a valid name,
   **Then** they are added to the participant list and receive a
   `participantId`.
2. **Given** any room, **When** a player attempts to join with an empty
   name, **Then** the response is a 400 error with message "Name is
   required".
3. **Given** no room exists for the given code, **When** a player
   attempts to join, **Then** the response is a 404 error with message
   "Room not found".
4. **Given** a room is already in `in-progress` status, **When** a player
   attempts to join, **Then** the response is a 400 error with message
   "Game already in progress".

---

### User Story 3 - Host Starts Game with 2-Player Minimum (Priority: P2)

Only the host can start the game. The game does not start unless at least
2 players are in the room. Non-host participants see a disabled start
button.

**Why this priority**: Essential for game flow. The 2-player minimum is a
game rule, and host-only control prevents chaos.

**Independent Test**: Can be tested by: (1) host starting with 1 player →
error, (2) host starting with 2+ players → success, (3) non-host calling
start → 403 error.

**Acceptance Scenarios**:

1. **Given** a room with 1 participant (host only), **When** the host
   attempts to start the game, **Then** the response is a 400 error with
   message "Need at least 2 players to start".
2. **Given** a room with 2 or more participants, **When** the host
   attempts to start the game, **Then** the room status changes to
   `in-progress` and the response confirms success.
3. **Given** a room where the requester is not the host, **When** they
   attempt to start the game, **Then** the response is a 403 error with
   message "Only the host can start the game".
4. **Given** a non-host participant viewing the lobby, **When** they see
   the start button, **Then** it is visually disabled with a tooltip
   "Waiting for host to start" and clicking it does nothing.

---

### User Story 4 - Lobby Auto-Polling (Priority: P2)

While on the lobby page, the frontend automatically fetches the room
snapshot every ~2 seconds so participants see new joiners appear without
manual refresh.

**Why this priority**: Core UX requirement — no polling means players
cannot see who else is in the room without refreshing the page manually.

**Independent Test**: Can be tested by opening the lobby page in one
browser tab, joining from a second tab, and verifying the first tab's
participant list updates within ~3 seconds.

**Acceptance Scenarios**:

1. **Given** a participant is on the lobby page, **When** another player
   joins the room, **Then** the participant list updates automatically
   within approximately 3 seconds.
2. **Given** a participant navigates away from the lobby page, **When**
   they leave, **Then** polling stops (no unnecessary network requests).

---

### User Story 5 - Multi-Room Isolation (Priority: P3)

Rooms are completely independent — players in different rooms cannot see
each other's data, and room codes are unique.

**Why this priority**: Correctness guarantee. Without isolation, players
could see or interfere with other games.

**Independent Test**: Can be tested by creating two rooms, joining a
different player to each, and verifying each room's participant list
contains only its own members.

**Acceptance Scenarios**:

1. **Given** two separate rooms exist, **When** fetching the snapshot
   for room A, **Then** only room A's participants are returned.
2. **Given** a room code that was never created, **When** a player
   attempts to join, **Then** a 404 error is returned with message
   "Room not found".

---

### Edge Cases

- **Host leaves**: Host transfers to the next-joined participant (earliest join time after the current host). The room remains active.
- **Full room**: No player limit — anyone can join until the host starts the game.
- **Rapid start attempts**: Idempotent — subsequent starts return the room snapshot with status already `in-progress` (no error).
- **Polling failure**: Silently retry on next interval; show a subtle "Connection lost" inline message after 3 consecutive failures.
- **Room deletion**: Rooms are never deleted while participants are present; cleanup happens only after all players have left.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST designate the room creator as `host` and
  include `role` in participant data.
- **FR-002**: System MUST reject room joins with an empty
  or whitespace-only player name with a 400 error and message
  "Name is required".
- **FR-003**: System MUST reject room joins for non-existent room codes
  with a 404 error and message "Room not found".
- **FR-004**: System MUST reject room joins for rooms with status
  `in-progress` with a 400 error and message "Game already in progress".
- **FR-005**: System MUST only allow the host to start the game.
  Non-host requests return a 403 error.
- **FR-006**: System MUST require at least 2 participants to start the
  game. If fewer, return a 400 error with message "Need at least 2
  players to start".
- **FR-007**: System MUST change room status from `lobby` to
  `in-progress` when the host successfully starts the game.
- **FR-008**: The frontend MUST poll `GET /rooms/:code` at approximately
  2-second intervals while the lobby page is active.
- **FR-009**: The frontend MUST stop polling when the user navigates
  away from the lobby page.
- **FR-010**: Room data MUST be scoped per room code — no cross-room
  data leakage.
- **FR-011**: Non-host participants MUST see a disabled "Start Game"
  button in the lobby with a tooltip "Waiting for host to start".
- **FR-012**: If the host leaves the room while in `lobby` status,
  host MUST transfer to the next-joined participant (earliest join time
  after the current host). The room remains active.
- **FR-013**: Rooms MUST be cleaned up (removed from memory) when all
  participants have left.

### Key Entities

- **Room**: Represents a game session. Attributes: unique `code`
  (4-character uppercase alphanumeric, auto-generated, unique via
  collision retry), `status` (lobby | in-progress | finished),
  `participants` list, `hostId` (references the creating participant).
- **Participant**: A player in a room. Attributes: unique `id` (UUIDv4),
  `name`, `role` (host | guesser), `joinedAt` timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see their host role in
  under 1 second from clicking "Create".
- **SC-002**: Invalid join attempts return a specific, human-readable
  error message every time (100% of cases).
- **SC-003**: Participant list updates appear in the lobby within
  3 seconds of another player joining (measured by polling).
- **SC-004**: Non-host attempted starts are rejected 100% of the time.
- **SC-005**: Game start is possible only when the host initiates it
  with 2+ players present.

## Assumptions

- Room codes are generated by the system (4-character uppercase
  alphanumeric, using alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
  with collision retry).
- Host role transfers to the next-joined participant if the current host
  leaves the room before the game starts. If two participants have the
  same join time, the tie is broken by participant ID (lexicographic
  order).
- The frontend runs in a modern browser with `fetch` and `setInterval`
  support.
- Network latency for polling is assumed to be sub-500ms under normal
  conditions.
- A maximum room size is not defined for this feature — any number of
  players may join until the host starts.
- Rate limiting, API request timeouts, and horizontal scalability are
  out of scope for this feature.

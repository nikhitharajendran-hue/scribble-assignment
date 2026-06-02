# Reflection: Room Lifecycle (001)

## What Was Built

**Backend**: Foundational room lifecycle — create room with host designation, join with validation (empty name, unknown room, game-in-progress), host-only game start (2+ player minimum), host transfer on leave (earliest-joined becomes new host), room cleanup when empty, and multi-room isolation via `Map<string, Room>`.

**Frontend**: StartPage with create/join, LobbyPage with polling at ~2s intervals, connection-lost detection after 3 consecutive poll failures, disabled Start Game button for non-hosts, and RoomCodeBadge for sharing.

## Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
| 4-character room codes (per spec Assumptions) | 6-character codes (per data-model.md) | Minor discrepancy between spec sections; actual implementation followed `data-model.md` |
| — | — | No other significant deviations |

## Challenges

1. **Host transfer on leave**: Determining "next host" required a tiebreaker (participant ID) when join times are identical. The `findEarliestJoined` helper resolves this by sorting by `joinedAt` then `id`.

2. **Polling failure detection**: Distinguishing transient network errors from actual disconnection required a consecutive-failure counter (3 strikes → "Connection lost").

3. **Idempotent start**: Preventing duplicate game starts while returning a useful response (current snapshot) rather than an error.

## What Went Well

- All 39 tasks completed with no breaks to existing code.
- Clean separation of concerns: API validation in `schemas.ts`, business logic in `roomStore.ts`, routes in `rooms.ts`.
- The `HttpError` pattern (404/400/403 with clear messages) established a consistent error-handling convention used by all subsequent features.

## Future Considerations

- No rate limiting on create/join — a malicious client could flood rooms.
- Room codes could collide under high concurrency (currently loops until unique — O(n) in worst case).
- Host transfer is not communicated to the new host in real-time; they only see it on next poll.

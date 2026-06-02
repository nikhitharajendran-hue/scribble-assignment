# Reflection: Round Start — Drawer & Word Assignment (002)

## What Was Built

**Backend**: Player name trimming/validation on create and join (Zod `.trim().min(1)`), drawer assignment as host on game start (`currentDrawerId = room.hostId`), deterministic word selection via FNV-1a-like hash of `code + round`, viewer-dependent word visibility in `toRoomSnapshot`, role split (`Role` for room ownership, `GameRole` for round roles). Removed `availableWords` and `roles` from `RoomSnapshot`.

**Frontend**: LobbyPage shows drawer name prominently after game start; drawer sees secret word; guessers see "Drawer is drawing..."; auto-navigate to `/game` on game start.

## Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
| `playerName` optional on create with `.optional()` | `playerName` required (no `.optional()`) | Late refinement — Zod validation at API boundary makes fallback unnecessary |
| `displayName()` fallback kept for backward compat | `displayName()` removed, `createParticipant` takes `name: string` | With `playerName` required, the fallback path is dead code |
| `selectWord` function name | Named `resolveWord` | Minor naming variation |
| `gameRole` as `gameRole?: GameRole` (optional) | `gameRole: GameRole \| null` (required) | Semantically equivalent; `\| null` is more explicit |

## Challenges

1. **Role split complexity**: The old `ParticipantRole` had `"host"` and `"drawer"` in the same union, conflating ownership and round roles. Splitting into `Role` and `GameRole` required updating all references across backend and frontend types — any missed reference caused a TypeScript error.

2. **`playerName` optional → required**: Making the schema field required changed Zod's error message for missing fields ("Required" vs custom "Name is required" from `.min()`), requiring a test assertion adjustment.

3. **`joinRoom` type propagation**: Making `joinRoom`'s `playerName` required caused a cascading type error because `createParticipant` had `name?: string`. Required changing both in sequence.

## What Went Well

- Viewer-dependent snapshots (`toRoomSnapshot(viewerParticipantId)`) established a pattern reused by spec 004 for round-end word revelation.
- Deterministic word selection avoids any need for "word broadcast" — all participants independently compute the same word.
- Frontend types mirrored backend types exactly, keeping the API contract clean.

## Future Considerations

- Word list is hardcoded (`["rocket", "pizza", "castle", "guitar", "sunflower"]`). A future feature could add more words or a word-pool endpoint.
- Drawer rotation (cycling through participants per round) is deferred — the host is always the drawer for now.
- `resolveWord` lives in `roomStore.ts`; extracting to a `wordStore.ts` would be cleaner as more word-related logic accumulates.

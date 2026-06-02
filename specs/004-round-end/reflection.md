# Reflection: Round End & Restart (004)

## What Was Built

**Backend**: `POST /rooms/:code/end-round` transitions `in-progress` → `finished`, revealing the word to all viewers. `POST /rooms/:code/restart` transitions `finished` → `lobby`, clearing round state while preserving participants and cumulative scores. Both endpoints are host-only, validated via `hostActionSchema`.

**Frontend**: `ResultsPage` displays the word, scoreboard, and guess history; the host sees a "Play Again" button that calls restart + navigates to `/lobby`; non-hosts see a disabled button. Polling detects restart and auto-navigates from `finished` → `lobby`. `GamePage` navigates to `/results` when polled status becomes `finished`.

## Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
| `playerName` optional on create with `displayName()` fallback | `playerName` required, `displayName()` removed | Zod validation at API boundary makes the fallback unreachable; making it required is simpler and type-safe |
| `selectWord` function name | Named `resolveWord` | Minor naming variation — same contract |
| `gameRole` as optional field (`gameRole?: GameRole`) | Required field typed `GameRole \| null` | Semantically equivalent; required + null is more explicit |

## Challenges

1. **TypeScript `player2.id` bug**: The restart test at `roomStore.test.ts:418` used `joinRoom` return value's `.id` property, but `joinRoom` returns `{ room, participantId }` not a `Participant`. Fixed by switching to `getRoom().participants.find()` pattern used elsewhere.

2. **Zod error message mismatch**: When `playerName` was made required, Zod's "Required" message for missing fields differs from `.min(1)`'s "Name is required". The test assertion had to be relaxed.

3. **Frontend test coverage gap**: No React Testing Library setup meant we couldn't test `LobbyPage` rendering directly. Added API-response-level tests instead.

## What Went Well

- Backend test count grew from 43 → 55 without breaking any existing tests.
- The `toRoomSnapshot` change was a one-liner: expose word to all when `status === "finished"`.
- `hostActionSchema` cleanly reused for both end-round and restart.
- Room state machine is now complete: `lobby → in-progress → finished → lobby`.

## Future Considerations

- End round is currently manual (host-triggered). A timer-based auto-end would improve UX.
- The `displayName()` removal means all name validation is centralized in Zod schemas — nice for consistency, but `createRoom` becomes coupled to the API layer.
- If T7.5 (manual smoke test) reveals issues, the polling interval or navigation timing may need adjustment.
- The `resolveWord` function lives in `roomStore.ts`; extracting it to a dedicated `wordStore.ts` would be cleaner as more word-related logic accumulates.

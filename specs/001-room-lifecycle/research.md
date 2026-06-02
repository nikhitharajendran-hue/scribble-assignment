# Research: Room Lifecycle

**Phase**: 0 | **Plan**: [plan.md](./plan.md)

## Unknowns Resolution

All unknowns were resolved during the `/speckit.clarify` phase. No open
research items remain.

### Verified Decisions

| Decision | Rationale |
|----------|-----------|
| Host transfers on leave (lobby only) | Keeps room playable; host role is fixed after game starts |
| No room size limit | Simplest approach; host starts when ready |
| Polling failure: retry + inline error | Resilient UX without disruption |
| Idempotent start button | Prevents double-start errors |
| Rooms never deleted with active players | Prevents mid-session disruption |

## Technology Confirmations

| Technology | Status | Notes |
|------------|--------|-------|
| `role` field on Participant | New field | `"host"` or `"guesser"` |
| `hostId` on Room | New field | References creator's participant ID |
| `startGame` in roomStore | New function | Validates role + participant count |
| `POST /rooms/:code/start` | New endpoint | Only host can call |
| Polling via setInterval + fetch | Frontend | ~2000ms interval, cleanup on unmount |
| Disabled button UX | Frontend | Non-hosts see disabled button with tooltip |

# Quickstart: Room Lifecycle Implementation

## Backend

### 1. Extend types (`src/models/game.ts`)

- Add `role: ParticipantRole` field to `Participant`
- Add `hostId: string` field to `Room`

### 2. Update roomStore (`src/services/roomStore.ts`)

- `createRoom(playerName)` — set creator's `role` to `"host"`, store `hostId`
- `joinRoom(code, playerName)` — add validation checks before adding
- Add `startGame(code, participantId)` — validate host + min 2 players,
  transition status to `in-progress`

### 3. Add schemas (`src/api/schemas.ts`)

- Add `startGameSchema` (zod object with `participantId`)
- Update `createRoomSchema` and `joinRoomSchema` if needed

### 4. Add route (`src/api/rooms.ts`)

- Add `POST /:code/start` endpoint

### 5. Test

```bash
cd backend && npm test
```

## Frontend

### 1. Add startGame to API client (`src/services/api.ts`)

- Add `startGame(code, participantId)` method calling
  `POST /rooms/:code/start`

### 2. Add polling + start to roomStore (`src/state/roomStore.ts`)

- `startPolling(code, participantId)` — `setInterval` every ~2000ms,
  calls `fetchRoom`
- `stopPolling()` — `clearInterval`
- `startGame()` — calls API, updates state
- Clean up polling on unmount via `useEffect` return

### 3. Update LobbyPage (`src/pages/LobbyPage.tsx`)

- Start polling on mount
- Show host indicator next to host participant
- "Start Game" button: enabled for host, disabled for others with tooltip
- Show "Connection lost" inline after 3 failed polls

### 4. Test

```bash
cd frontend && npm test
```

## Verification

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Create a room → host sees their role
4. Join from another browser → lobby updates within ~3s
5. Try start with 1 player → error
6. Add 2nd player → host can start → status changes to `in-progress`
7. Non-host sees disabled button

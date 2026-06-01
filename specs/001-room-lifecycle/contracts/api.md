# API Contracts: Room Lifecycle

**Phase**: 1 | **Plan**: [plan.md](./plan.md)

## `POST /rooms/:code/start`

Start the game (host only, minimum 2 players).

### Request

- **Method**: `POST`
- **Path**: `/rooms/:code`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "participantId": "uuid-string"
  }
  ```

### Success Response (200)

```json
{
  "room": {
    "code": "ABC123",
    "status": "in-progress",
    "hostId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "Sketch captain",
        "role": "host",
        "joinedAt": "2026-06-01T12:00:00.000Z"
      },
      {
        "id": "uuid-string-2",
        "name": "Player 2",
        "role": "guesser",
        "joinedAt": "2026-06-01T12:01:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Error Responses

| Status | Body `message` | Condition |
|--------|----------------|-----------|
| 403 | `"Only the host can start the game"` | Requester is not the host |
| 400 | `"Need at least 2 players to start"` | Fewer than 2 participants |
| 400 | `"Invalid request payload"` | Missing or invalid `participantId` |
| 404 | `"Unable to load room"` | Room code not found |

### Idempotency

If the room is already `in-progress`, return the current room snapshot
with status `in-progress` (200, no error).

## Extended: `POST /rooms`

### Response (201)

Now includes `role: "host"` in the creator's participant entry.

## Extended: `POST /rooms/:code/join`

### Error Responses

| Status | Body `message` | Condition |
|--------|----------------|-----------|
| 400 | `"Name is required"` | Empty or whitespace-only player name |
| 400 | `"Game already in progress"` | Room status is `in-progress` |
| 404 | `"Room not found"` | Room code does not exist |

## Extended: `GET /rooms/:code`

### Response (200)

Now includes `role` field on each participant and `hostId` on the room.

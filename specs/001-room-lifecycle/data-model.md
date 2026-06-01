# Data Model: Room Lifecycle

**Phase**: 1 | **Plan**: [plan.md](./plan.md)

## Entities

### Room

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Unique 6-char uppercase alphanumeric room identifier |
| `status` | `"lobby" | "in-progress" | "finished"` | Current room phase |
| `hostId` | `string` | Participant ID of the current host |
| `participants` | `Participant[]` | Ordered list of joined participants |
| `availableWords` | `string[]` | Words to draw (from seed data) |
| `roles` | `ParticipantRole[]` | Available roles for assignment |

**State transitions**: `lobby` → `in-progress` (host starts game) → `finished`

### Participant

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique participant identifier (UUID) |
| `name` | `string` | Player-chosen display name (trimmed, non-empty) |
| `role` | `"host" | "guesser"` | Participant's role in the room |
| `joinedAt` | `string` | ISO 8601 timestamp of join |

## Validation Rules

- **Participant.name**: Must be non-empty after trim (checked by Zod)
- **Room.code**: 6 uppercase alphanumeric chars, auto-generated
- **Room.status**: Only host can transition `lobby` → `in-progress`
- **Host transfer**: Only in `lobby` status; transfers to earliest-joined
  non-host participant when host leaves

## Key Relationships

- A Room **has many** Participants (1:N)
- Room.hostId **references** Participant.id
- Participant.role is `"host"` for exactly one participant at a time

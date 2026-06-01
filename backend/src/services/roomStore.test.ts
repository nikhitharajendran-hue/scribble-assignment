import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startGame } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom assigns role host to the creator", () => {
    const result = createRoom("Bob");

    expect(result.room.participants[0].role).toBe("host");
  });

  it("createRoom stores hostId on the room", () => {
    const result = createRoom("Charlie");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("room snapshot includes hostId and role on participants", () => {
    const room1 = createRoom("Host");
    const room2 = createRoom("Other");
    const snapshot1 = getRoom(room1.room.code)!;

    expect(snapshot1.hostId).toBe(room1.participantId);
    expect(snapshot1.participants[0].role).toBe("host");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom rejects empty name", () => {
    const room = createRoom("Host");
    const result = joinRoom(room.room.code, "");

    expect(result).toBeNull();
  });

  it("joinRoom rejects joins to in-progress rooms", () => {
    const room = createRoom("Host");
    const room2 = joinRoom(room.room.code, "Player2")!;
    startGame(room.room.code, room.participantId);

    const result = joinRoom(room.room.code, "Player3");
    expect(result).toBeNull();
  });

  it("startGame with fewer than 2 participants returns error", () => {
    const room = createRoom("SoloHost");
    const result = startGame(room.room.code, room.participantId);

    expect(result.error).toBe("NOT_ENOUGH_PLAYERS");
  });

  it("startGame by non-host returns error", () => {
    const room = createRoom("Host");
    const player2 = joinRoom(room.room.code, "Player2")!;
    const result = startGame(room.room.code, player2.participantId);

    expect(result.error).toBe("NOT_HOST");
  });

  it("startGame with host and 2+ participants succeeds and transitions to in-progress", () => {
    const room = createRoom("Host");
    joinRoom(room.room.code, "Player2");
    const result = startGame(room.room.code, room.participantId);

    expect(result.error).toBeNull();
    expect(result.room!.status).toBe("in-progress");
  });

  it("startGame is idempotent when already in-progress", () => {
    const room = createRoom("Host");
    joinRoom(room.room.code, "Player2");
    startGame(room.room.code, room.participantId);

    const result = startGame(room.room.code, room.participantId);
    expect(result.error).toBeNull();
    expect(result.room!.status).toBe("in-progress");
  });
});

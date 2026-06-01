import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom assigns role host to the creator and initializes new fields", () => {
    const result = createRoom("Bob");

    expect(result.room.participants[0].role).toBe("host");
    expect(result.room.participants[0].gameRole).toBeNull();
    expect(result.room.currentDrawerId).toBeNull();
    expect(result.room.currentRound).toBe(0);
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

  it("startGame assigns host as drawer and sets game roles", () => {
    const room = createRoom("Host");
    joinRoom(room.room.code, "Player2");
    startGame(room.room.code, room.participantId);

    const snapshot = getRoom(room.room.code)!;
    expect(snapshot.currentDrawerId).toBe(room.participantId);
    expect(snapshot.currentRound).toBe(1);

    const hostParticipant = snapshot.participants.find((p) => p.id === room.participantId)!;
    expect(hostParticipant.gameRole).toBe("drawer");

    const guesserParticipant = snapshot.participants.find((p) => p.id !== room.participantId)!;
    expect(guesserParticipant.gameRole).toBe("guesser");
  });

  it("startGame is idempotent when already in-progress", () => {
    const room = createRoom("Host");
    joinRoom(room.room.code, "Player2");
    startGame(room.room.code, room.participantId);

    const result = startGame(room.room.code, room.participantId);
    expect(result.error).toBeNull();
    expect(result.room!.status).toBe("in-progress");
    expect(result.room!.currentDrawerId).toBe(room.participantId);
    expect(result.room!.currentRound).toBe(1);
  });

  it("drawer sees the secret word in the snapshot", () => {
    const room = createRoom("Host");
    joinRoom(room.room.code, "Player2");
    startGame(room.room.code, room.participantId);

    const snapshot = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
    expect(snapshot.currentWord).toBeTruthy();
    expect(typeof snapshot.currentWord).toBe("string");
  });

  it("non-drawer sees currentWord as null", () => {
    const room = createRoom("Host");
    const player2 = joinRoom(room.room.code, "Player2")!;
    startGame(room.room.code, room.participantId);

    const snapshot = toRoomSnapshot(getRoom(room.room.code)!, player2.participantId);
    expect(snapshot.currentWord).toBeNull();
  });

  it("unauthenticated viewer sees currentWord as null", () => {
    const room = createRoom("Host");
    joinRoom(room.room.code, "Player2");
    startGame(room.room.code, room.participantId);

    const snapshot = toRoomSnapshot(getRoom(room.room.code)!);
    expect(snapshot.currentWord).toBeNull();
  });

  it("word selection is deterministic for same room and round", () => {
    const room = createRoom("Host");
    joinRoom(room.room.code, "Player2");
    startGame(room.room.code, room.participantId);

    const snapshot1 = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
    const snapshot2 = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);

    expect(snapshot1.currentWord).toBe(snapshot2.currentWord);
  });

  it("lobby snapshot has currentWord null and currentRound 0", () => {
    const room = createRoom("Host");

    const snapshot = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
    expect(snapshot.currentWord).toBeNull();
    expect(snapshot.currentRound).toBe(0);
    expect(snapshot.currentDrawerId).toBeNull();
  });
});

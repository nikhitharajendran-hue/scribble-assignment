import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, saveCanvas, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

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

  describe("submitGuess", () => {
    it("correct guess returns correct: true and score becomes 100", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);
      const snapshot = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
      const word = snapshot.currentWord!;

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      const result = submitGuess(room.room.code, player2.id, word);

      expect(result.correct).toBe(true);
      expect(result.room!.participants.find((p) => p.id === player2.id)!.score).toBe(100);
    });

    it("incorrect guess returns correct: false and score stays 0", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      const result = submitGuess(room.room.code, player2.id, "wronganswer");

      expect(result.correct).toBe(false);
      expect(result.room!.participants.find((p) => p.id === player2.id)!.score).toBe(0);
    });

    it("guess is case-insensitive", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);
      const snapshot = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
      const word = snapshot.currentWord!;

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      const result = submitGuess(room.room.code, player2.id, word.toUpperCase());

      expect(result.correct).toBe(true);
    });

    it("guess with surrounding whitespace is trimmed", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);
      const snapshot = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
      const word = snapshot.currentWord!;

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      const result = submitGuess(room.room.code, player2.id, `  ${word}  `);

      expect(result.correct).toBe(true);
    });

    it("drawer cannot submit a guess", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);

      const result = submitGuess(room.room.code, room.participantId, "anything");

      expect(result.error).toBe("IS_DRAWER");
    });

    it("guess after correct is silently ignored", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);
      const snapshot = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
      const word = snapshot.currentWord!;

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      submitGuess(room.room.code, player2.id, word);

      const result = submitGuess(room.room.code, player2.id, word);
      expect(result.correct).toBe(true);
      expect(result.room!.guessHistory.filter((g) => g.participantId === player2.id)).toHaveLength(1);
    });

    it("duplicate incorrect guess from same player is silently ignored", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      submitGuess(room.room.code, player2.id, "wrong1");
      const result = submitGuess(room.room.code, player2.id, "wrong1");

      expect(result.error).toBeNull();
      expect(result.correct).toBe(false);
      expect(result.room!.guessHistory.filter((g) => g.participantId === player2.id)).toHaveLength(1);
    });

    it("case-insensitive dedup: ROCKET then rocket", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      submitGuess(room.room.code, player2.id, "WRONG");
      const result = submitGuess(room.room.code, player2.id, "wrong");

      expect(result.error).toBeNull();
      expect(result.correct).toBe(false);
      expect(result.room!.guessHistory.filter((g) => g.participantId === player2.id)).toHaveLength(1);
    });

    it("same incorrect guess from different players — both recorded", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      joinRoom(room.room.code, "Player3");
      startGame(room.room.code, room.participantId);

      const players = getRoom(room.room.code)!.participants.filter((p) => p.id !== room.participantId);
      submitGuess(room.room.code, players[0].id, "samewrong");
      const result = submitGuess(room.room.code, players[1].id, "samewrong");

      expect(result.room!.guessHistory).toHaveLength(2);
    });

    it("guess for lobby room is rejected", () => {
      const room = createRoom("Host");

      const result = submitGuess(room.room.code, room.participantId, "test");

      expect(result.error).toBe("NOT_IN_PROGRESS");
    });

    it("guess appears in guessHistory in the snapshot", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      submitGuess(room.room.code, player2.id, "testguess");

      const snapshot = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
      expect(snapshot.guessHistory).toHaveLength(1);
      expect(snapshot.guessHistory[0].guess).toBe("testguess");
    });

    it("correctGuessersThisRound includes participantId after correct guess", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);
      const snapshot = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
      const word = snapshot.currentWord!;

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      submitGuess(room.room.code, player2.id, word);

      const updated = getRoom(room.room.code)!;
      expect(updated.correctGuessersThisRound).toContain(player2.id);
    });

    it("correctGuessersThisRound is empty for incorrect guesses", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);

      const player2 = getRoom(room.room.code)!.participants.find((p) => p.id !== room.participantId)!;
      submitGuess(room.room.code, player2.id, "wrong");

      const updated = getRoom(room.room.code)!;
      expect(updated.correctGuessersThisRound).not.toContain(player2.id);
    });
  });

  describe("saveCanvas", () => {
    it("drawer can save canvas strokes", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);

      const strokes = [{ points: [{ x: 10, y: 20 }, { x: 30, y: 40 }] }];
      const result = saveCanvas(room.room.code, room.participantId, strokes);

      expect(result.error).toBeNull();
      expect(result.room!.canvasData).toEqual(strokes);
    });

    it("non-drawer cannot save canvas", () => {
      const room = createRoom("Host");
      const player2 = joinRoom(room.room.code, "Player2")!;
      startGame(room.room.code, room.participantId);

      const result = saveCanvas(room.room.code, player2.participantId, []);

      expect(result.error).toBe("NOT_DRAWER");
    });

    it("canvas data appears in snapshot", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);

      const strokes = [{ points: [{ x: 100, y: 200 }] }];
      saveCanvas(room.room.code, room.participantId, strokes);

      const snapshot = toRoomSnapshot(getRoom(room.room.code)!, room.participantId);
      expect(snapshot.canvasData).toEqual(strokes);
    });

    it("canvas clear (empty strokes) works", () => {
      const room = createRoom("Host");
      joinRoom(room.room.code, "Player2");
      startGame(room.room.code, room.participantId);

      saveCanvas(room.room.code, room.participantId, [{ points: [{ x: 10, y: 10 }] }]);
      const result = saveCanvas(room.room.code, room.participantId, []);

      expect(result.room!.canvasData).toEqual([]);
    });

    it("canvas save fails for lobby rooms", () => {
      const room = createRoom("Host");

      const result = saveCanvas(room.room.code, room.participantId, []);

      expect(result.error).toBe("NOT_IN_PROGRESS");
    });
  });
});

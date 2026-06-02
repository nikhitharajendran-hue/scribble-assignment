import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("createRoom sends POST to /rooms with playerName in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: { code: "ABCD", status: "lobby", participants: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Alice" }),
      })
    );
  });

  it("fetchRoom sends GET to /rooms/:code with participantId query param", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: { code: "XYZW", status: "lobby", participants: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("endRound sends POST to /rooms/:code/end-round with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: { code: "ABCD", status: "finished", participants: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.endRound("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/end-round"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("restartGame sends POST to /rooms/:code/restart with participantId", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: { code: "ABCD", status: "lobby", participants: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.restartGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/ABCD/restart"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("fetchRoom returns currentWord for drawer and null for non-drawer", async () => {
    const drawerSnapshot = {
      code: "ABCD",
      status: "in-progress" as const,
      currentDrawerId: "drawer1",
      currentRound: 1,
      currentWord: "rocket",
      participants: [
        { id: "drawer1", name: "Alice", role: "host" as const, gameRole: "drawer" as const, score: 0, joinedAt: "" },
        { id: "guesser1", name: "Bob", role: "participant" as const, gameRole: "guesser" as const, score: 0, joinedAt: "" },
      ],
      canvasData: [],
      guessHistory: [],
      correctGuessersThisRound: [],
    };

    // Mock fetch for drawer view
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ room: drawerSnapshot }),
    } as unknown as Response);

    const drawerResult = await api.fetchRoom("ABCD", "drawer1");
    expect(drawerResult.room.currentWord).toBe("rocket");
    expect(drawerResult.room.currentDrawerId).toBe("drawer1");
    expect(drawerResult.room.currentRound).toBe(1);
    const drawerParticipant = drawerResult.room.participants.find(p => p.id === "drawer1");
    expect(drawerParticipant?.gameRole).toBe("drawer");

    // Mock fetch for non-drawer view
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ room: { ...drawerSnapshot, currentWord: null } }),
    } as unknown as Response);

    const guesserResult = await api.fetchRoom("ABCD", "guesser1");
    expect(guesserResult.room.currentWord).toBeNull();
    const guesserParticipant = guesserResult.room.participants.find(p => p.id === "guesser1");
    expect(guesserParticipant?.gameRole).toBe("guesser");
  });

  it("fetchRoom returns finished snapshot with currentWord visible to all", async () => {
    const finishedSnapshot = {
      code: "ABCD",
      status: "finished" as const,
      currentDrawerId: "drawer1",
      currentRound: 1,
      currentWord: "rocket",
      participants: [
        { id: "drawer1", name: "Alice", role: "host" as const, gameRole: "drawer" as const, score: 100, joinedAt: "" },
        { id: "guesser1", name: "Bob", role: "participant" as const, gameRole: "guesser" as const, score: 50, joinedAt: "" },
      ],
      canvasData: [],
      guessHistory: [{ participantId: "guesser1", participantName: "Bob", guess: "rocket", correct: true }],
      correctGuessersThisRound: ["guesser1"],
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ room: finishedSnapshot }),
    } as unknown as Response);

    const result = await api.fetchRoom("ABCD", "guesser1");
    expect(result.room.status).toBe("finished");
    expect(result.room.currentWord).toBe("rocket");
    expect(result.room.guessHistory).toHaveLength(1);
    expect(result.room.guessHistory[0].guess).toBe("rocket");
  });
});

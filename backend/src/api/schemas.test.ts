import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startGameSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims leading and trailing whitespace", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects whitespace-only name", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Name is required");
  });

  it("createRoomSchema accepts missing playerName (optional)", () => {
    const result = createRoomSchema.parse({});

    expect(result.playerName).toBeUndefined();
  });

  it("joinRoomSchema trims leading and trailing whitespace", () => {
    const result = joinRoomSchema.parse({ playerName: "  Bob  " });

    expect(result.playerName).toBe("Bob");
  });

  it("joinRoomSchema rejects empty name", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow("Name is required");
  });

  it("joinRoomSchema rejects whitespace-only name", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow("Name is required");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("startGameSchema rejects missing participantId", () => {
    expect(() => startGameSchema.parse({})).toThrow();
  });

  it("startGameSchema accepts valid participantId", () => {
    const result = startGameSchema.parse({ participantId: "abc-123" });

    expect(result.participantId).toBe("abc-123");
  });
});

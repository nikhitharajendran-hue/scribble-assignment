import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string, role: Participant["role"] = "guesser"): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    role,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function transferHostIfNeeded(room: Room): void {
  if (!room.participants.some((p) => p.id === room.hostId)) {
    const nextHost = room.participants.slice().sort((a, b) => {
      const timeDiff = a.joinedAt.localeCompare(b.joinedAt);
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    })[0];

    if (nextHost) {
      room.hostId = nextHost.id;
      nextHost.role = "host";
    }
  }
}

function cleanupEmptyRooms(): void {
  for (const [code, room] of rooms) {
    if (room.participants.length === 0) {
      rooms.delete(code);
    }
  }
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName, "host");
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    return null;
  }

  const trimmedName = (playerName ?? "").trim();
  if (!trimmedName) {
    return null;
  }

  const participant = createParticipant(trimmedName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function leaveRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const index = room.participants.findIndex((p) => p.id === participantId);
  if (index === -1) {
    return null;
  }

  room.participants.splice(index, 1);
  room.updatedAt = now();

  if (room.hostId === participantId && room.status === "lobby") {
    transferHostIfNeeded(room);
  }

  cleanupEmptyRooms();

  return { room: cloneRoom(room) };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  void viewerParticipantId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "NOT_FOUND" as const };
  }

  if (room.hostId !== participantId) {
    return { error: "NOT_HOST" as const };
  }

  if (room.participants.length < 2) {
    return { error: "NOT_ENOUGH_PLAYERS" as const };
  }

  if (room.status === "in-progress") {
    return { room: cloneRoom(room), error: null };
  }

  room.status = "in-progress";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), error: null };
}

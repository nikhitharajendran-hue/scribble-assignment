import { randomUUID } from "node:crypto";
import type { GuessEntry, Participant, Room, RoomSnapshot, Stroke } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

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

function createParticipant(name: string, role: Participant["role"] = "participant"): Participant {
  return {
    id: randomUUID(),
    name,
    role,
    gameRole: null,
    score: 0,
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

export function submitGuess(code: string, participantId: string, guess: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "NOT_FOUND" as const };
  }

  if (room.status !== "in-progress") {
    return { error: "NOT_IN_PROGRESS" as const };
  }

  if (participantId === room.currentDrawerId) {
    return { error: "IS_DRAWER" as const };
  }

  if (!room.participants.some((p) => p.id === participantId)) {
    return { error: "UNKNOWN_PARTICIPANT" as const };
  }

  if (room.correctGuessersThisRound.includes(participantId)) {
    return { correct: true, room: cloneRoom(room), error: null };
  }

  const normalized = guess.trim().toLowerCase();
  const alreadyGuessed = room.guessHistory.some(
    (entry) => entry.participantId === participantId && entry.guess.toLowerCase() === normalized
  );

  if (alreadyGuessed) {
    return { correct: false, room: cloneRoom(room), error: null };
  }

  const word = resolveWord(room.code, room.currentRound);
  const isCorrect = normalized === word.toLowerCase();

  const guesserName = room.participants.find((p) => p.id === participantId)!.name;

  const entry: GuessEntry = {
    participantId,
    participantName: guesserName,
    guess: guess.trim(),
    correct: isCorrect,
    timestamp: now()
  };

  if (room.guessHistory.length >= 200) {
    room.guessHistory.shift();
  }
  room.guessHistory.push(entry);

  if (isCorrect) {
    const participant = room.participants.find((p) => p.id === participantId)!;
    participant.score = 100;
    room.correctGuessersThisRound.push(participantId);

    const guesserCount = room.participants.filter((p) => p.id !== room.currentDrawerId).length;
    if (room.correctGuessersThisRound.length >= guesserCount) {
      room.status = "finished";
    }
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { correct: isCorrect, room: cloneRoom(room), error: null };
}

export function saveCanvas(code: string, participantId: string, strokes: Stroke[]) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "NOT_FOUND" as const };
  }

  if (room.status !== "in-progress") {
    return { error: "NOT_IN_PROGRESS" as const };
  }

  if (participantId !== room.currentDrawerId) {
    return { error: "NOT_DRAWER" as const };
  }

  if (!room.participants.some((p) => p.id === participantId)) {
    return { error: "UNKNOWN_PARTICIPANT" as const };
  }

  const capped = strokes.map((s) => ({
    points: s.points.slice(0, 1000)
  })).slice(-500);

  room.canvasData = capped;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), error: null };
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName, "host");
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    currentDrawerId: null,
    currentRound: 0,
    participants: [participant],
    canvasData: [],
    guessHistory: [],
    correctGuessersThisRound: [],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    return null;
  }

  const participant = createParticipant(playerName);
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
  const isGameActive = room.status === "in-progress";
  const isViewerDrawer = isGameActive && viewerParticipantId === room.currentDrawerId;
  const showWord = isViewerDrawer || room.status === "finished";

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    currentDrawerId: room.currentDrawerId,
    currentRound: room.currentRound,
    currentWord: showWord ? resolveWord(room.code, room.currentRound) : null,
    participants: room.participants.map((participant) => ({ ...participant })),
    canvasData: room.canvasData,
    guessHistory: room.guessHistory
  };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "NOT_FOUND" as const };
  }

  if (room.status !== "finished") {
    return { error: "NOT_FINISHED" as const };
  }

  if (room.hostId !== participantId) {
    return { error: "NOT_HOST" as const };
  }

  room.status = "lobby";
  room.canvasData = [];
  room.guessHistory = [];
  room.correctGuessersThisRound = [];
  room.currentDrawerId = null;
  room.currentRound = 0;
  for (const p of room.participants) {
    p.gameRole = null;
  }
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), error: null };
}

export function resolveWord(code: string, round: number): string {
  const words = [...STARTER_WORDS];
  const hash = simpleHash(code + round);
  return words[hash % words.length];
}

function simpleHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
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
  room.currentDrawerId = room.hostId;
  room.currentRound = 1;
  for (const p of room.participants) {
    p.gameRole = p.id === room.hostId ? "drawer" : "guesser";
  }
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), error: null };
}

export function endRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "NOT_FOUND" as const };
  }

  if (room.status !== "in-progress") {
    return { error: "NOT_IN_PROGRESS" as const };
  }

  if (room.hostId !== participantId) {
    return { error: "NOT_HOST" as const };
  }

  room.status = "finished";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), error: null };
}

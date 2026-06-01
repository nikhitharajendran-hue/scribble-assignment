export type Role = "host" | "participant";
export type GameRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-progress" | "finished";

export interface Participant {
  id: string;
  name: string;
  role: Role;
  gameRole: GameRole | null;
  score: number;
  joinedAt: string;
}

export interface Stroke {
  points: { x: number; y: number }[];
}

export interface GuessEntry {
  participantId: string;
  participantName: string;
  guess: string;
  correct: boolean;
  timestamp: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  currentDrawerId: string | null;
  currentRound: number;
  participants: Participant[];
  canvasData: Stroke[];
  guessHistory: GuessEntry[];
  correctGuessersThisRound: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  currentDrawerId: string | null;
  currentRound: number;
  currentWord: string | null;
  participants: Participant[];
  canvasData: Stroke[];
  guessHistory: GuessEntry[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

export type Role = "host" | "participant";
export type GameRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-progress" | "finished";

export interface Participant {
  id: string;
  name: string;
  role: Role;
  gameRole: GameRole | null;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  currentDrawerId: string | null;
  currentRound: number;
  participants: Participant[];
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
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

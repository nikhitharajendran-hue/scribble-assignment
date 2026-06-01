export type ParticipantRole = "drawer" | "guesser" | "host";
export type RoomStatus = "lobby" | "in-progress" | "finished";

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

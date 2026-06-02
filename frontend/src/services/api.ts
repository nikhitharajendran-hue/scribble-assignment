export type Role = "host" | "participant";
export type GameRole = "drawer" | "guesser";

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

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "in-progress" | "finished";
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

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ message: "Request failed" }))) as {
      message?: string;
    };

    throw new Error(errorBody.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

export const api = {
  createRoom(playerName: string) {
    return request<RoomSessionResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  joinRoom(code: string, playerName: string) {
    return request<RoomSessionResponse>(`/rooms/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  fetchRoom(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  },
  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitGuess(code: string, participantId: string, guess: string) {
    return request<{ correct: boolean; room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/guess`,
      { method: "POST", body: JSON.stringify({ participantId, guess }) }
    );
  },
  submitCanvas(code: string, participantId: string, strokes: Stroke[]) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/canvas`,
      { method: "POST", body: JSON.stringify({ participantId, strokes }) }
    );
  },
  endRound(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/end-round`,
      { method: "POST", body: JSON.stringify({ participantId }) }
    );
  },
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/restart`,
      { method: "POST", body: JSON.stringify({ participantId }) }
    );
  }
};

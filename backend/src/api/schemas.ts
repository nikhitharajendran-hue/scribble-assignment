import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name is required").optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  guess: z.string().trim().min(1, "Guess is required")
});

export const startGameSchema = z.object({
  participantId: z.string()
});

const pointSchema = z.object({
  x: z.number().min(0).lt(800),
  y: z.number().min(0).lt(600)
});

const strokeSchema = z.object({
  points: z.array(pointSchema).max(1000, "Stroke exceeds max points")
});

export const submitCanvasSchema = z.object({
  participantId: z.string(),
  strokes: z.array(strokeSchema)
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

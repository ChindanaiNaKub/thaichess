import { z } from 'zod';
import { PositionSchema, TimeControlSchema, PieceColorSchema } from './types';

/**
 * Socket.IO Event Payload Schemas
 * 
 * These schemas validate payloads for ClientToServerEvents.
 * Use in socket handlers to ensure type safety at runtime.
 * 
 * @example
 * ```typescript
 * socket.on('create_game', (data) => {
 *   const validated = CreateGamePayloadSchema.parse(data);
 *   // validated is now type-safe
 * });
 * ```
 */

export const CreateGamePayloadSchema = z.object({
  timeControl: TimeControlSchema,
  colorPreference: z.union([PieceColorSchema, z.literal('random')]),
});
export type CreateGamePayload = z.infer<typeof CreateGamePayloadSchema>;

export const JoinGamePayloadSchema = z.object({
  gameId: z.string().min(1),
});
export type JoinGamePayload = z.infer<typeof JoinGamePayloadSchema>;

export const SpectateGamePayloadSchema = z.object({
  gameId: z.string().min(1),
});
export type SpectateGamePayload = z.infer<typeof SpectateGamePayloadSchema>;

export const PresenceHeartbeatPayloadSchema = z.object({
  gameId: z.string().min(1),
  sentAt: z.number().int(),
  clientStatus: z.enum(['active', 'idle', 'away']),
  latencyMs: z.number().int().nullable().optional(),
});
export type PresenceHeartbeatPayload = z.infer<typeof PresenceHeartbeatPayloadSchema>;

export const LeaveGamePayloadSchema = z.object({
  gameId: z.string().min(1).optional(),
});
export type LeaveGamePayload = z.infer<typeof LeaveGamePayloadSchema>;

export const MakeMovePayloadSchema = z.object({
  from: PositionSchema,
  to: PositionSchema,
});
export type MakeMovePayload = z.infer<typeof MakeMovePayloadSchema>;

export const RespondDrawPayloadSchema = z.object({
  accept: z.boolean(),
});
export type RespondDrawPayload = z.infer<typeof RespondDrawPayloadSchema>;

export const FindGamePayloadSchema = z.object({
  timeControl: TimeControlSchema,
});
export type FindGamePayload = z.infer<typeof FindGamePayloadSchema>;

// Union type of all client-to-server event payloads
export const ClientEventPayloadSchema = z.union([
  CreateGamePayloadSchema,
  JoinGamePayloadSchema,
  SpectateGamePayloadSchema,
  PresenceHeartbeatPayloadSchema,
  LeaveGamePayloadSchema,
  MakeMovePayloadSchema,
  RespondDrawPayloadSchema,
  FindGamePayloadSchema,
  z.void(), // For events with no payload (resign, cancel_matchmaking, etc.)
]);

/**
 * Event name to schema mapping for runtime validation
 */
export const SocketEventSchemas = {
  create_game: CreateGamePayloadSchema,
  join_game: JoinGamePayloadSchema,
  spectate_game: SpectateGamePayloadSchema,
  presence_heartbeat: PresenceHeartbeatPayloadSchema,
  leave_game: LeaveGamePayloadSchema,
  make_move: MakeMovePayloadSchema,
  respond_draw: RespondDrawPayloadSchema,
  find_game: FindGamePayloadSchema,
  // Events with no payload
  resign: z.void(),
  start_counting: z.void(),
  stop_counting: z.void(),
  offer_draw: z.void(),
  request_rematch: z.void(),
  cancel_matchmaking: z.void(),
} as const;

export type SocketEventName = keyof typeof SocketEventSchemas;

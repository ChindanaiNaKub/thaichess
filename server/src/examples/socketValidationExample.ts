/**
 * Socket.IO Validation Middleware Example
 * 
 * This file demonstrates how to integrate Zod validation into socket handlers.
 * Copy patterns from here into server/src/socketHandlers.ts
 * 
 * @example
 * ```typescript
 * import { CreateGamePayloadSchema } from '../../shared/validation';
 * 
 * socket.on('create_game', (data) => {
 *   const validated = CreateGamePayloadSchema.parse(data);
 *   // Now validated has proper types and runtime validation
 * });
 * ```
 */

import type { Socket } from 'socket.io';
import { z } from 'zod';
import type { ServerToClientEvents, ClientToServerEvents } from '../../shared/types';
import {
  CreateGamePayloadSchema,
  JoinGamePayloadSchema,
  MakeMovePayloadSchema,
  PresenceHeartbeatPayloadSchema,
  type SocketEventName,
} from '../../shared/validation';

/**
 * Creates a type-safe, validated socket event handler.
 * 
 * @param schema - Zod schema for the event payload
 * @param handler - Business logic handler that receives validated data
 * @returns Wrapped handler with validation
 * 
 * @example
 * ```typescript
 * socket.on('create_game', withValidation(
 *   CreateGamePayloadSchema,
 *   (validated, socket) => {
 *     // validated is type-safe
 *     gameManager.createGame(validated.timeControl, validated.colorPreference);
 *   }
 * ));
 * ```
 */
export function withValidation<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  handler: (data: z.infer<TSchema>, socket: Socket) => void | Promise<void>
) {
  return (data: unknown, socket: Socket) => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      // Send validation error to client
      socket.emit('error', {
        message: `Validation failed: ${result.error.message}`,
      });
      return;
    }
    
    // Call handler with validated data
    handler(result.data, socket);
  };
}

/**
 * Alternative: Strict validation that throws (for internal use)
 */
export function validateEvent<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown
): z.infer<TSchema> {
  return schema.parse(data);
}

/**
 * Example: Validated event handlers for socketHandlers.ts
 * 
 * Replace existing handlers with these patterns:
 */

// BEFORE (in socketHandlers.ts):
// socket.on('create_game', ({ timeControl, colorPreference }) => {
//   // No runtime validation - could receive malformed data
// });

// AFTER (with Zod):
// socket.on('create_game', (data) => {
//   const { timeControl, colorPreference } = validateEvent(CreateGamePayloadSchema, data);
//   // timeControl and colorPreference are now validated and typed
// });

/**
 * Migration Guide for socketHandlers.ts
 * 
 * 1. Import schemas at top of file:
 *    import { CreateGamePayloadSchema, JoinGamePayloadSchema, ... } from '../../shared/validation';
 * 
 * 2. Replace handler signatures:
 *    
 *    // Old
 *    socket.on('create_game', ({ timeControl, colorPreference }) => {
 *      
 *    // New  
 *    socket.on('create_game', (data) => {
 *      const { timeControl, colorPreference } = CreateGamePayloadSchema.parse(data);
 * 
 * 3. For optional validation (non-breaking):
 *    const result = CreateGamePayloadSchema.safeParse(data);
 *    if (!result.success) {
 *      socket.emit('error', { message: 'Invalid game configuration' });
 *      return;
 *    }
 *    const { timeControl, colorPreference } = result.data;
 */

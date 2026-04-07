/**
 * Zod Validation Schemas
 * 
 * This module provides runtime validation schemas using Zod.
 * Use these schemas to validate data at system boundaries:
 * - Socket.IO events
 * - API requests/responses  
 * - External data (puzzles, game states)
 * - Environment variables
 * 
 * All schemas export both:
 * - The Zod schema object (for .parse(), .safeParse())
 * - The inferred TypeScript type (for type safety)
 */

// Core game types
export * from './types';

// Socket.IO event payloads
export * from './socketEvents';

// Puzzle data
export * from './puzzle';

// Environment configuration
export * from './env';

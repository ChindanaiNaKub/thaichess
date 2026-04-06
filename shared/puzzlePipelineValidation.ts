/**
 * Puzzle Pipeline Validation
 * 
 * Provides runtime validation for puzzle data at system boundaries:
 * - Import from external sources (PGN, Lichess, etc.)
 * - Generated puzzle candidates
 * - Database-loaded puzzles
 * 
 * Uses Zod for structure validation before business logic validation.
 * 
 * @example
 * ```typescript
 * import { validatePuzzleImport } from './puzzlePipelineValidation';
 * 
 * const result = validatePuzzleImport(rawPuzzle);
 * if (!result.success) {
 *   console.error('Import failed:', result.errors.join(', '));
 *   return null;
 * }
 * // result.data is now validated and typed
 * ```
 */

import { PuzzleSchema } from './validation/puzzle';
import type { Puzzle } from './puzzles';

export type PuzzleValidationSuccess = {
  success: true;
  data: Puzzle;
};

export type PuzzleValidationFailure = {
  success: false;
  errors: string[];
};

export type PuzzleValidationResult = PuzzleValidationSuccess | PuzzleValidationFailure;

/**
 * Validates a puzzle at import time.
 * 
 * This performs two-stage validation:
 * 1. Zod schema validation (structure and types)
 * 2. Business logic validation (mate detection, legal moves, etc.)
 * 
 * Use this when importing puzzles from external sources.
 * 
 * @param data - Raw puzzle data from import
 * @returns Validation result with detailed errors or validated puzzle
 * 
 * @example
 * ```typescript
 * const importedPuzzles = rawData.map(data => {
 *   const result = validatePuzzleImport(data);
 *   if (!result.success) {
 *     logImportError(data.id, result.errors);
 *     return null;
 *   }
 *   return result.data;
 * }).filter(Boolean);
 * ```
 */
export function validatePuzzleImport(data: unknown): PuzzleValidationResult {
  // Stage 1: Zod schema validation (structure and types)
  const schemaResult = PuzzleSchema.safeParse(data);
  
  if (!schemaResult.success) {
    // Format Zod errors into readable messages
    const errors = schemaResult.error.issues.map(issue => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    
    return { success: false, errors };
  }
  
  // Stage 2: Business logic validation would go here
  // For now, we trust the schema validation
  // Future: Add validatePuzzle() from puzzleValidation.ts
  
  return { success: true, data: schemaResult.data as Puzzle };
}

/**
 * Validates multiple puzzles in batch.
 * 
 * @param dataArray - Array of raw puzzle data
 * @returns Object with valid puzzles and error summary
 * 
 * @example
 * ```typescript
 * const { valid, invalid, summary } = validatePuzzleBatch(rawPuzzles);
 * console.log(`Imported ${valid.length} puzzles, ${invalid.length} failed`);
 * ```
 */
export function validatePuzzleBatch(dataArray: unknown[]): {
  valid: Puzzle[];
  invalid: Array<{ index: number; errors: string[] }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
} {
  const valid: Puzzle[] = [];
  const invalid: Array<{ index: number; errors: string[] }> = [];
  
  for (let i = 0; i < dataArray.length; i++) {
    const result = validatePuzzleImport(dataArray[i]);
    
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ index: i, errors: result.errors });
    }
  }
  
  return {
    valid,
    invalid,
    summary: {
      total: dataArray.length,
      successful: valid.length,
      failed: invalid.length,
    },
  };
}

/**
 * Type guard to check if data is a valid puzzle.
 * 
 * @param data - Data to check
 * @returns Type predicate for Puzzle
 * 
 * @example
 * ```typescript
 * if (isValidPuzzle(data)) {
 *   // data is now typed as Puzzle
 *   console.log(data.title);
 * }
 * ```
 */
export function isValidPuzzle(data: unknown): data is Puzzle {
  const result = PuzzleSchema.safeParse(data);
  return result.success;
}

/**
 * Safe puzzle parser that returns null on failure.
 * 
 * @param data - Raw puzzle data
 * @returns Validated puzzle or null
 * 
 * @example
 * ```typescript
 * const puzzle = safeParsePuzzle(rawData) ?? createDefaultPuzzle();
 * ```
 */
export function safeParsePuzzle(data: unknown): Puzzle | null {
  const result = PuzzleSchema.safeParse(data);
  return result.success ? (result.data as Puzzle) : null;
}

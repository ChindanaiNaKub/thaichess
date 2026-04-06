import { z } from 'zod';

/**
 * Environment Variable Schemas
 * 
 * Validates environment configuration at startup.
 * Fails fast with clear error messages if required vars are missing or invalid.
 * 
 * @example
 * ```typescript
 * const env = ServerEnvSchema.parse(process.env);
 * // env is now type-safe and validated
 * ```
 */

export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.preprocess(
    (val) => (val === undefined ? 3000 : Number(val)),
    z.number().int().min(1).max(65535)
  ),
  DATA_DIR: z.string().min(1).optional(),
  
  // Database
  DATABASE_URL: z.string().url().optional(),
  
  // Session/Auth (if needed in future)
  SESSION_SECRET: z.string().min(32).optional(),
  
  // External services
  REDIS_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export const ClientEnvSchema = z.object({
  VITE_API_URL: z.string().url().default('/'),
  VITE_WS_URL: z.string().url().optional(),
  VITE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

/**
 * Validates server environment variables.
 * Call this early in server startup to fail fast on misconfiguration.
 */
export function validateServerEnv(env: Record<string, string | undefined>): ServerEnv {
  return ServerEnvSchema.parse(env);
}

/**
 * Validates client environment variables (import.meta.env in Vite).
 */
export function validateClientEnv(env: Record<string, unknown>): ClientEnv {
  return ClientEnvSchema.parse(env);
}

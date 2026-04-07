# Zod Validation System

## Overview

This project uses [Zod](https://zod.dev/) for runtime type validation at all system boundaries. Zod provides TypeScript-first schema validation with static type inference, ensuring data integrity while maintaining type safety.

## Why Zod

- **Type Safety**: Schemas infer TypeScript types automatically
- **Runtime Validation**: Catches invalid data at system boundaries
- **Clear Errors**: Detailed validation messages with field paths
- **Composability**: Build complex schemas from reusable components
- **Developer Experience**: Excellent IDE support and debugging

## Where We Use Validation

### 1. Socket.IO Events

All client-to-server events are validated using Zod schemas:

```typescript
// server/src/socketHandlers.ts
socket.on('create_game', (payload) => {
  const parseResult = CreateGamePayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    rejectSocketEvent(deps.monitoring, socket, 'create_game', 
      formatZodError(parseResult.error));
    return;
  }
  // payload is now fully typed and validated
  const { timeControl, colorPreference } = parseResult.data;
});
```

**Validated Events:**
- `create_game` - Uses `CreateGamePayloadSchema`
- `join_game` - Uses `JoinGamePayloadSchema`
- `spectate_game` - Uses `SpectateGamePayloadSchema`
- `make_move` - Uses `MakeMovePayloadSchema`
- `find_game` - Uses `FindGamePayloadSchema`
- `respond_draw` - Uses `RespondDrawPayloadSchema`
- `presence_heartbeat` - Uses `PresenceHeartbeatPayloadSchema`

### 2. Environment Variables

Server environment is validated at startup:

```typescript
// server/src/env.ts
const env = validateServerEnv(process.env);
// env.PORT is number, not string | undefined
// env.NODE_ENV is 'development' | 'production' | 'test'
```

**Validation Rules:**
- `PORT`: Number, 1-65535, defaults to 3000
- `NODE_ENV`: Enum, defaults to 'development'
- `DATABASE_URL`: Optional, must be valid URL
- `SESSION_SECRET`: Optional, minimum 32 characters

### 3. Puzzle Pipeline

Puzzle data is validated at multiple stages:

```typescript
// Import validation
import { validatePuzzleImport } from './puzzlePipelineValidation';

const result = validatePuzzleImport(rawPuzzle);
if (!result.success) {
  console.error('Import failed:', result.errors.join(', '));
  return null;
}
// result.data is fully typed Puzzle
```

**Validation Stages:**
1. **Import** (`puzzleSourceImport.ts`) - Validates PGN/external sources
2. **Generation** (`puzzleGeneration.ts`) - Validates generated candidates
3. **Pipeline** (`puzzlePipelineValidation.ts`) - Runtime validation utilities

## How to Add New Validation

### Step 1: Create a Schema

Add your schema to the appropriate file in `shared/validation/`:

```typescript
// shared/validation/myFeature.ts
import { z } from 'zod';

export const MyFeatureSchema = z.object({
  id: z.string().min(1),
  count: z.number().int().min(0),
  status: z.enum(['active', 'inactive']),
  metadata: z.record(z.string()).optional(),
});

export type MyFeature = z.infer<typeof MyFeatureSchema>;
```

### Step 2: Export from Index

Add to `shared/validation/index.ts`:

```typescript
export * from './myFeature';
```

### Step 3: Use in Your Code

**For Socket.IO events:**

```typescript
import { MyFeatureSchema } from '../../shared/validation';

socket.on('my_event', (payload) => {
  const result = MyFeatureSchema.safeParse(payload);
  if (!result.success) {
    rejectSocketEvent(deps.monitoring, socket, 'my_event', 
      formatZodError(result.error));
    return;
  }
  const { id, count, status } = result.data;
  // Use validated data
});
```

**For API routes:**

```typescript
import { MyFeatureSchema } from '../../shared/validation';

app.post('/api/my-feature', (req, res) => {
  const result = MyFeatureSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: result.error.flatten() 
    });
  }
  // Use result.data
});
```

**For internal validation:**

```typescript
import { MyFeatureSchema } from './validation/myFeature';

// Type guard
if (MyFeatureSchema.safeParse(data).success) {
  // data is valid
}

// Or throw on invalid
const validated = MyFeatureSchema.parse(rawData);
```

## Best Practices

### 1. Use `safeParse` for User Input

Always use `safeParse()` for external data to avoid throwing:

```typescript
// Good - graceful error handling
const result = MySchema.safeParse(userInput);
if (!result.success) {
  // Handle error
}

// Avoid for user input - will throw
const data = MySchema.parse(userInput); // Don't do this
```

### 2. Reuse Shared Schemas

Use existing schemas from `shared/validation/types.ts`:

```typescript
import { PositionSchema, MoveSchema, TimeControlSchema } from './types';

export const MySchema = z.object({
  position: PositionSchema,  // Reuse!
  move: MoveSchema,           // Reuse!
  timeControl: TimeControlSchema,  // Reuse!
});
```

### 3. Provide Clear Error Messages

Use the `formatZodError` helper for user-facing errors:

```typescript
import { formatZodError } from '../socketHandlers';

const result = MySchema.safeParse(data);
if (!result.success) {
  // Produces: "Invalid fields: fieldName (error message)"
  const message = formatZodError(result.error);
}
```

### 4. Validate at System Boundaries

Add validation at every entry point:
- Socket.IO events
- API routes
- File imports
- Database reads (for critical data)

### 5. Export Both Schema and Type

Always export both for flexibility:

```typescript
export const MySchema = z.object({ ... });
export type MyType = z.infer<typeof MySchema>;
```

## Common Patterns

### Optional vs Nullable

```typescript
// Optional: field can be omitted
optionalField: z.string().optional()

// Nullable: field must be present but can be null
nullableField: z.string().nullable()

// Both: field can be omitted OR null
optionalNullable: z.string().optional().nullable()
```

### Arrays

```typescript
// Basic array
items: z.array(z.string())

// Non-empty array
items: z.array(z.string()).min(1)

// Exact length
board: z.array(z.array(PieceSchema)).length(8)
```

### Enums

```typescript
// String enum
status: z.enum(['active', 'inactive', 'pending'])

// Native TypeScript enum
enum Status { Active, Inactive }
status: z.nativeEnum(Status)
```

### Refinements (Custom Validation)

```typescript
// Custom validation logic
email: z.string().email().refine(
  (val) => val.endsWith('@company.com'),
  { message: 'Must be company email' }
)

// Transform data
normalized: z.string().transform(val => val.toLowerCase().trim())
```

### Composition

```typescript
// Extend existing schema
const ExtendedSchema = BaseSchema.extend({
  newField: z.string(),
});

// Pick/omit fields
const SubsetSchema = FullSchema.pick({ id: true, name: true });
const WithoutSecret = FullSchema.omit({ password: true });

// Merge schemas
const CombinedSchema = z.intersection(SchemaA, SchemaB);
```

## Error Handling Reference

### ZodError Structure

```typescript
{
  issues: [
    {
      code: 'invalid_type',
      path: ['timeControl', 'initial'],
      message: 'Expected number, received string',
    },
    {
      code: 'too_small',
      path: ['timeControl', 'initial'],
      message: 'Number must be greater than or equal to 10',
    }
  ]
}
```

### Using flatten()

```typescript
const flattened = error.flatten();

// Field errors by path
flattened.fieldErrors = {
  'timeControl.initial': ['Number must be >= 10'],
  'colorPreference': ['Required'],
}

// Form-level errors
flattened.formErrors = ['Custom form validation failed']
```

## Testing Validation

### Unit Tests

```typescript
import { MySchema } from './validation/myFeature';

describe('MySchema', () => {
  it('accepts valid data', () => {
    const result = MySchema.safeParse({ id: '123', count: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid data', () => {
    const result = MySchema.safeParse({ id: '', count: -1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(2);
  });
});
```

### Integration Tests

```typescript
// Test socket handler validation
it('rejects invalid payloads', () => {
  socket.trigger('create_game', { timeControl: { initial: 5 } });
  
  expect(socket.emit).toHaveBeenCalledWith('error', {
    message: expect.stringContaining('Invalid fields:')
  });
});
```

## Troubleshooting

### "Cannot find module" Error

Make sure the schema is exported from `shared/validation/index.ts`:

```typescript
export * from './myFeature';
```

### Type Mismatch Between Schema and Interface

Ensure your schema matches the TypeScript interface exactly:

```typescript
// If interface has optional field
interface MyType {
  field?: string;
}

// Schema must match
const MySchema = z.object({
  field: z.string().optional(),
});
```

### Complex Nested Validation

For deeply nested objects, break into smaller schemas:

```typescript
// Instead of one huge schema
const AddressSchema = z.object({ ... });
const PersonSchema = z.object({
  name: z.string(),
  address: AddressSchema,  // Reuse!
});
```

## Resources

- [Zod Documentation](https://zod.dev/)
- [Zod Error Handling](https://zod.dev/ERROR_HANDLING)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict) - Required for best Zod experience
- Project schemas: `shared/validation/`
- Project examples: `server/src/socketHandlers.ts`

## Migration Guide

### From Manual Validation

**Before:**
```typescript
if (!payload || typeof payload.timeControl !== 'object') {
  throw new Error('Invalid time control');
}
if (payload.timeControl.initial < 10) {
  throw new Error('Initial time too small');
}
```

**After:**
```typescript
const result = TimeControlSchema.safeParse(payload.timeControl);
if (!result.success) {
  // All validation in one place with detailed errors
  console.error(result.error.message);
}
```

### From TypeScript Interfaces

**Before:**
```typescript
interface User {
  id: string;
  email: string;
}
// No runtime validation
```

**After:**
```typescript
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;
// Runtime + compile-time validation
```

---

## Quick Reference

| Task | Code |
|------|------|
| Basic object | `z.object({ name: z.string() })` |
| Optional field | `z.string().optional()` |
| Nullable field | `z.string().nullable()` |
| Array | `z.array(z.string())` |
| Enum | `z.enum(['a', 'b'])` |
| Number range | `z.number().min(0).max(100)` |
| String pattern | `z.string().regex(/^[a-z]+$/)` |
| Union type | `z.union([z.string(), z.number()])` |
| Parse safely | `schema.safeParse(data)` |
| Parse or throw | `schema.parse(data)` |
| Extract type | `z.infer<typeof schema>` |

---

**Last Updated:** April 2026  
**Maintainer:** Development Team  
**Related:** [Puzzle Generation Workflow](./puzzle-generation-workflow.md)

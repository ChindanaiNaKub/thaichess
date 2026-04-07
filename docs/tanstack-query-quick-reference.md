# TanStack Query Quick Reference

Fast lookup for common TanStack Query patterns in this project.

## Creating a New Query

### 1. Create Query Options Factory

```typescript
// client/src/queries/myFeature.ts
import { queryOptions } from '@tanstack/react-query';

export interface MyData {
  id: string;
  name: string;
}

async function fetchMyData(id: string): Promise<MyData> {
  const response = await fetch(`/api/my-feature/${id}`);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

export function myDataQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['myFeature', 'data', { id }],
    queryFn: () => fetchMyData(id),
    staleTime: 1000 * 60, // 1 minute
  });
}
```

### 2. Export from Index

```typescript
// client/src/queries/index.ts
export { myDataQueryOptions, type MyData } from './myFeature';
```

### 3. Use in Component

```typescript
import { useQuery } from '@tanstack/react-query';
import { myDataQueryOptions } from '../queries';

function MyComponent({ id }: { id: string }) {
  const { data, isLoading, error } = useQuery({
    ...myDataQueryOptions(id),
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return <div>{data.name}</div>;
}
```

## Creating a New Mutation

### 1. Create Mutation Hook

```typescript
// client/src/queries/myFeature.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

async function createMyData(input: CreateInput): Promise<void> {
  const response = await fetch('/api/my-feature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create');
}

export function useCreateMyDataMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMyData,
    onSuccess: () => {
      // Invalidate to refresh list
      queryClient.invalidateQueries({ queryKey: ['myFeature', 'data'] });
    },
  });
}
```

### 2. Use with Toast

```typescript
import { useToast } from '../lib/toast';

function MyForm() {
  const mutation = useCreateMyDataMutation();
  const { showToast } = useToast();

  const handleSubmit = (data: CreateInput) => {
    mutation.mutate(data, {
      onSuccess: () => showToast('Created!', 'success'),
      onError: (err) => showToast(err.message, 'error'),
    });
  };

  return (
    <button onClick={handleSubmit} disabled={mutation.isPending}>
      {mutation.isPending ? 'Creating...' : 'Create'}
    </button>
  );
}
```

## Adding Prefetching

### 1. Add to usePrefetchQueries Hook

```typescript
// client/src/hooks/usePrefetchQueries.ts
export function usePrefetchQueries() {
  const queryClient = useQueryClient();

  const prefetchMyData = useCallback((id: string) => {
    queryClient.prefetchQuery(myDataQueryOptions(id));
  }, [queryClient]);

  return {
    // ... other prefetch functions
    prefetchMyData,
  };
}
```

### 2. Use in Component

```typescript
function MyComponent() {
  const { prefetchMyData } = usePrefetchQueries();

  return (
    <button 
      onClick={() => navigate('/my-page')}
      onMouseEnter={() => prefetchMyData('123')}
    >
      Go to Page
    </button>
  );
}
```

## Testing

### Test Setup

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### Mock Fetch

```typescript
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ /* data */ }),
  });
  vi.stubGlobal('fetch', fetchMock);
});
```

### Test Async Operations

```typescript
// ✅ Use findByText (waits automatically)
const element = await screen.findByText('Loaded');

// ❌ Don't use waitFor + getByText
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Common Query Keys

| Entity | Query Key Pattern | Example |
|--------|------------------|---------|
| Games | `['games', 'recent', { page, limit, filter }]` | `['games', 'recent', { page: 1, limit: 10, filter: 'all' }]` |
| Leaderboard | `['leaderboard', { limit }]` | `['leaderboard', { limit: 50 }]` |
| Stats | `['stats', 'home']` or `['stats', 'about']` | `['stats', 'home']` |
| Analysis | `['analysis', 'game', gameId]` | `['analysis', 'game', 'abc123']` |
| Fair Play | `['fairPlay', 'cases', { page, limit, status }]` | `['fairPlay', 'cases', { page: 1, limit: 20, status: 'all' }]` |
| Feedback | `['feedback', 'messages', { page, limit, type }]` | `['feedback', 'messages', { page: 1, limit: 20, type: 'all' }]` |

## Common Stale Times

| Data Type | Stale Time | Reason |
|-----------|-----------|---------|
| Games list | 30-60s | Changes frequently |
| Leaderboard | 2 minutes | Changes less often |
| Stats | 30s | Real-time-ish |
| User profile | 5 minutes | Rarely changes |
| Static content | 10+ minutes | Almost never changes |

## Error Handling

```typescript
const { data, isLoading, error, refetch } = useQuery({
  ...myQueryOptions(),
});

if (isLoading) return <Loading />;

if (error) {
  return (
    <ErrorState 
      message={error.message}
      onRetry={refetch} // Allow retry
    />
  );
}
```

## Debugging

### Enable DevTools

Already enabled in `client/src/main.tsx`:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Press `Shift + Alt + T` to open DevTools in browser.

### Log Queries

```typescript
const queryClient = new QueryClient({
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error,
  },
});
```

## Migration Checklist

- [ ] Create query options factory in `client/src/queries/`
- [ ] Export from `client/src/queries/index.ts`
- [ ] Replace `useEffect` + `useState` with `useQuery`
- [ ] Add loading state handling
- [ ] Add error state handling
- [ ] Add mutation with invalidation
- [ ] Add toast notifications
- [ ] Add prefetching if needed
- [ ] Update tests with QueryClientProvider
- [ ] Add fetch mock with `ok: true`
- [ ] Use `findByText` for async tests

## Need Help?

1. Check `docs/tanstack-query-patterns.md` for detailed guide
2. Look at existing implementations in `client/src/queries/`
3. See component examples in `client/src/components/`
4. Review tests in `client/src/test/`

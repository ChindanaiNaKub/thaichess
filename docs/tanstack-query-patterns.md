# TanStack Query Patterns Guide

This document describes the TanStack Query patterns used in the Thai Chess (Makruk) project for data fetching, caching, and state management.

## Table of Contents

1. [Query Option Factories](#query-option-factories)
2. [Using Queries in Components](#using-queries-in-components)
3. [Mutations with Invalidation](#mutations-with-invalidation)
4. [Optimistic Updates](#optimistic-updates)
5. [Toast Notifications](#toast-notifications)
6. [Query Prefetching](#query-prefetching)
7. [Testing Patterns](#testing-patterns)
8. [Best Practices](#best-practices)

---

## Query Option Factories

We use query option factories to centralize query configuration. This pattern makes queries reusable, testable, and consistent.

### Location
All query option factories are in `client/src/queries/`:
- `games.ts` - Games pagination
- `leaderboard.ts` - Leaderboard data
- `stats.ts` - Home/About stats
- `analysis.ts` - Game analysis
- `fairPlay.ts` - Fair play cases
- `feedback.ts` - Feedback messages

### Pattern

```typescript
import { queryOptions, keepPreviousData } from '@tanstack/react-query';

// Types
export interface GameEntry {
  id: string;
  // ... other fields
}

export interface GamesResponse {
  games: GameEntry[];
  total: number;
}

// API Function
async function fetchGames(page: number, limit: number): Promise<GamesResponse> {
  const response = await fetch(`/api/games?page=${page}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch games: ${response.status}`);
  }
  
  return response.json();
}

// Query Options Factory
export function gamesQueryOptions(page: number, limit: number) {
  return queryOptions({
    queryKey: ['games', 'recent', { page, limit }],
    queryFn: () => fetchGames(page, limit),
    placeholderData: keepPreviousData, // Keep old data while fetching new
    staleTime: 1000 * 60, // 1 minute
  });
}
```

### Key Configuration Options

| Option | Purpose | Typical Value |
|--------|---------|---------------|
| `queryKey` | Unique identifier for the query | Array with entity type and parameters |
| `queryFn` | Function that fetches data | Async function returning Promise |
| `placeholderData` | Show old data while loading | `keepPreviousData` for pagination |
| `staleTime` | How long data is considered fresh | 30s - 2 minutes depending on volatility |
| `gcTime` | How long to keep unused data in cache | 5-10 minutes |
| `retry` | Number of retry attempts | 1-3 for critical data, 0 for non-critical |

---

## Using Queries in Components

### Basic Usage

```typescript
import { useQuery } from '@tanstack/react-query';
import { gamesQueryOptions } from '../queries/games';

function GamesPage() {
  const { data, isLoading, error } = useQuery({
    ...gamesQueryOptions(1, 10),
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return <GamesList games={data.games} />;
}
```

### With Pagination

```typescript
function GamesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useQuery({
    ...gamesQueryOptions(page, 10),
  });

  return (
    <>
      <GamesList games={data?.games ?? []} />
      {isFetching && <Spinner />} {/* Show spinner for background updates */}
      <Pagination 
        page={page} 
        total={data?.total ?? 0} 
        onChange={setPage} 
      />
    </>
  );
}
```

### Conditional Queries

```typescript
function AnalysisPage({ gameId }: { gameId?: string }) {
  const { data } = useQuery({
    ...gameQueryOptions(gameId!),
    enabled: !!gameId, // Only run if gameId exists
  });
  
  // ...
}
```

---

## Mutations with Invalidation

Mutations modify data and should invalidate related queries to refresh the UI.

### Basic Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

// API Function
async function submitFeedback(input: SubmitFeedbackInput): Promise<void> {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }
}

// Mutation Hook
export function useSubmitFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      // Invalidate feedback queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['feedback', 'messages'] });
    },
  });
}
```

### Using in Components

```typescript
import { useToast } from '../lib/toast';

function FeedbackWidget() {
  const submitMutation = useSubmitFeedbackMutation();
  const { showToast } = useToast();

  const handleSubmit = (data: SubmitFeedbackInput) => {
    submitMutation.mutate(data, {
      onSuccess: () => {
        showToast('Feedback submitted!', 'success');
      },
      onError: (err) => {
        showToast(err.message, 'error');
      },
    });
  };

  return (
    <button 
      onClick={handleSubmit}
      disabled={submitMutation.isPending}
    >
      {submitMutation.isPending ? 'Sending...' : 'Submit'}
    </button>
  );
}
```

---

## Optimistic Updates

Optimistic updates make the UI feel faster by updating immediately and rolling back on error.

### Pattern

```typescript
export function useCaseActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ action, caseId }: { action: string; caseId: number }) =>
      performCaseAction(action, caseId),
    
    onMutate: async ({ caseId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['fairPlay', 'cases'] });

      // Snapshot the previous value
      const previousQueries = queryClient.getQueriesData<FairPlayCasesResponse>({
        queryKey: ['fairPlay', 'cases'],
      });

      // Optimistically remove the case from all queries
      queryClient.setQueriesData<FairPlayCasesResponse>(
        { queryKey: ['fairPlay', 'cases'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            cases: old.cases.filter(c => c.id !== caseId),
            total: Math.max(0, old.total - 1),
          };
        }
      );

      // Return context for rollback
      return { previousQueries };
    },
    
    onError: (err, { caseId }, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['fairPlay', 'cases'] });
    },
  });
}
```

### When to Use

| Scenario | Use Optimistic? | Reason |
|----------|----------------|---------|
| Toggle favorite | ✅ Yes | User expects immediate feedback |
| Delete item | ✅ Yes | Item should disappear immediately |
| Submit form | ❌ No | Wait for server confirmation |
| Update profile | ⚠️ Maybe | Depends on UX requirements |

---

## Toast Notifications

We use toast notifications to provide user feedback on mutations.

### Setup

The `ToastProvider` is in `client/src/main.tsx`:

```typescript
import { ToastProvider } from './lib/toast';

<QueryClientProvider client={queryClient}>
  <ToastProvider>
    <App />
  </ToastProvider>
</QueryClientProvider>
```

### Usage

```typescript
import { useToast } from '../lib/toast';

function MyComponent() {
  const { showToast } = useToast();
  const mutation = useMyMutation();

  const handleAction = () => {
    mutation.mutate(data, {
      onSuccess: () => {
        showToast('Operation successful!', 'success');
      },
      onError: (err) => {
        showToast(err.message, 'error');
      },
    });
  };
}
```

### Toast Types

- `'success'` - Green toast for successful operations
- `'error'` - Red toast for failures
- `'info'` - Blue toast for neutral information

---

## Query Prefetching

Prefetching loads data before the user navigates, making the app feel instant.

### The Hook

`client/src/hooks/usePrefetchQueries.ts` provides prefetch functions:

```typescript
export function usePrefetchQueries() {
  const queryClient = useQueryClient();

  const prefetchGames = useCallback(() => {
    queryClient.prefetchQuery(gamesQueryOptions(1, 10, 'all'));
  }, [queryClient]);

  // ... other prefetch functions

  return { prefetchGames, prefetchLeaderboard, /* ... */ };
}
```

### Hover Prefetching (Header)

```typescript
function Header() {
  const { prefetchGames, prefetchLeaderboard } = usePrefetchQueries();

  return (
    <nav>
      <button 
        onClick={() => navigate('/games')}
        onMouseEnter={prefetchGames} // Prefetch on hover
      >
        Games
      </button>
      <button 
        onClick={() => navigate('/')}
        onMouseEnter={prefetchLeaderboard}
      >
        Play
      </button>
    </nav>
  );
}
```

### Idle Prefetching (HomePage)

```typescript
function HomePage() {
  const { prefetchGames, prefetchLeaderboard } = usePrefetchQueries();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const prefetchWhenIdle = () => {
      prefetchGames();
      prefetchLeaderboard();
    };

    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetchWhenIdle, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(idleId);
    } else {
      const timeoutId = setTimeout(prefetchWhenIdle, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [prefetchGames, prefetchLeaderboard]);
}
```

### When to Prefetch

| Trigger | Use Case | Example |
|---------|----------|---------|
| Hover | Navigation links | Header nav items |
| Idle | Likely next page | HomePage → Games |
| Focus | Input fields | Search suggestions |
| Mount | Critical data | User profile |

---

## Testing Patterns

### Test Setup

Every test needs its own QueryClient:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: Infinity, // Don't garbage collect
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}
```

### Mocking Fetch

```typescript
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ games: [], total: 0 }),
  });
  vi.stubGlobal('fetch', fetchMock);
});
```

### Async Testing

Use `findByText` instead of `waitFor` + `getByText`:

```typescript
// ✅ Good - findByText waits automatically
const element = await screen.findByText('Game loaded');

// ❌ Bad - getByText throws immediately if not found
await waitFor(() => {
  expect(screen.getByText('Game loaded')).toBeInTheDocument();
});
```

### Testing Mutations

```typescript
it('submits feedback and shows success toast', async () => {
  const showToastMock = vi.fn();
  vi.mocked(useToast).mockReturnValue({ showToast: showToastMock });

  render(<FeedbackWidget />);
  
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    expect(showToastMock).toHaveBeenCalledWith('Feedback submitted!', 'success');
  });
});
```

---

## Best Practices

### 1. Always Use Query Option Factories

```typescript
// ✅ Good - Centralized, reusable
const { data } = useQuery({ ...gamesQueryOptions(1, 10) });

// ❌ Bad - Inline query config
const { data } = useQuery({
  queryKey: ['games'],
  queryFn: () => fetch('/api/games').then(r => r.json()),
});
```

### 2. Handle Loading and Error States

```typescript
// ✅ Good - Always handle both states
const { data, isLoading, error } = useQuery({ ... });

if (isLoading) return <Loading />;
if (error) return <Error message={error.message} />;

// ❌ Bad - No error handling
const { data } = useQuery({ ... });
return <div>{data.name}</div>; // Crashes on error
```

### 3. Use Stale Time Appropriately

```typescript
// High volatility - short stale time
gamesQueryOptions: { staleTime: 1000 * 30 } // 30 seconds

// Low volatility - long stale time
leaderboardQueryOptions: { staleTime: 1000 * 60 * 2 } // 2 minutes
```

### 4. Invalidate Queries After Mutations

```typescript
// ✅ Good - Invalidate to refresh
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['games'] });
}

// ❌ Bad - No invalidation, stale data remains
```

### 5. Use TypeScript for Type Safety

```typescript
// ✅ Good - Typed queries
interface GamesResponse {
  games: GameEntry[];
  total: number;
}

async function fetchGames(): Promise<GamesResponse> {
  // ...
}

// ❌ Bad - Untyped, errors at runtime
async function fetchGames() {
  return fetch('/api/games').then(r => r.json());
}
```

### 6. Test with Isolated QueryClients

```typescript
// ✅ Good - Each test has its own client
function createWrapper() {
  const queryClient = new QueryClient({ ... });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ❌ Bad - Shared client causes test pollution
```

---

## Migration Guide

### From useEffect + useState

```typescript
// Before
const [games, setGames] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/games')
    .then(r => r.json())
    .then(data => {
      setGames(data.games);
      setLoading(false);
    });
}, []);

// After
const { data, isLoading } = useQuery({
  ...gamesQueryOptions(1, 10),
});
```

### From Manual Fetch

```typescript
// Before
const handleSubmit = async () => {
  setSubmitting(true);
  try {
    await fetch('/api/feedback', { method: 'POST', body: JSON.stringify(data) });
    setSubmitting(false);
    showToast('Success!');
  } catch (err) {
    setSubmitting(false);
    showToast('Error!');
  }
};

// After
const mutation = useSubmitFeedbackMutation();

const handleSubmit = () => {
  mutation.mutate(data, {
    onSuccess: () => showToast('Success!', 'success'),
    onError: (err) => showToast(err.message, 'error'),
  });
};
```

---

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Query Key Factory Pattern](https://tkdodo.eu/blog/effective-react-query-keys)

---

## Questions?

If you have questions about these patterns, check:
1. Existing implementations in `client/src/queries/`
2. Component examples in `client/src/components/`
3. Test examples in `client/src/test/`

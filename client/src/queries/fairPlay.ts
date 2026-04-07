import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

export interface FairPlayCase {
  id: number;
  user_id: string;
  user_email: string;
  user_username: string | null;
  user_fair_play_status: 'clear' | 'restricted';
  user_rated_restricted_at: number | null;
  status: 'open' | 'reviewed' | 'restricted' | 'dismissed';
  reason: string;
  note: string | null;
  reviewed_by: string | null;
  created_at: number;
  updated_at: number;
  event_count: number;
  latest_event_type: 'analysis_blocked' | 'user_reported' | null;
}

export interface FairPlayCasesResponse {
  cases: FairPlayCase[];
  total: number;
}

export type FilterStatus = 'all' | 'open' | 'reviewed' | 'restricted' | 'dismissed';

// API function for fetching cases
async function fetchFairPlayCases(
  page: number,
  limit: number,
  status: FilterStatus,
): Promise<FairPlayCasesResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
  });

  const response = await fetch(`/api/fair-play/cases?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch fair play cases');
  }

  return response.json();
}

// API function for reporting fair play
async function reportFairPlay(gameId: string): Promise<void> {
  const response = await fetch('/api/fair-play/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to report fair play');
  }
}

// API function for case actions
async function performCaseAction(
  action: 'restrict' | 'dismiss' | 'clear',
  caseId: number,
  userId?: string,
): Promise<void> {
  let path: string;
  if (action === 'clear') {
    path = `/api/fair-play/users/${userId}/clear`;
  } else {
    path = `/api/fair-play/cases/${caseId}/${action}`;
  }

  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: 'Action performed by admin' }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to perform action');
  }
}

// Query options factory
export function fairPlayCasesQueryOptions(
  page: number,
  limit: number,
  status: FilterStatus,
) {
  return queryOptions({
    queryKey: ['fairPlay', 'cases', { page, limit, status }],
    queryFn: () => fetchFairPlayCases(page, limit, status),
    staleTime: 1000 * 30, // 30 seconds - admin data changes frequently
  });
}

// Mutation hook for reporting fair play
export function useReportFairPlayMutation() {
  return useMutation({
    mutationFn: reportFairPlay,
  });
}

// Mutation hook for case actions
export function useCaseActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ action, caseId, userId }: { action: 'restrict' | 'dismiss' | 'clear'; caseId: number; userId?: string }) =>
      performCaseAction(action, caseId, userId),
    onSuccess: () => {
      // Invalidate fair play cases queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['fairPlay', 'cases'] });
    },
  });
}

import { queryOptions } from '@tanstack/react-query';

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

// API function
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

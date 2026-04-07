import { queryOptions } from '@tanstack/react-query';

export interface FeedbackEntry {
  id: number;
  type: string;
  message: string;
  page: string;
  user_agent: string;
  created_at: number;
  visible?: number;
}

export interface FeedbackResponse {
  feedback: FeedbackEntry[];
  total: number;
}

export type FilterType = 'all' | 'bug' | 'feature' | 'other';

// API function
async function fetchFeedback(
  page: number,
  limit: number,
  type: FilterType,
): Promise<FeedbackResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (type !== 'all') params.set('type', type);

  const response = await fetch(`/api/feedback?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch feedback');
  }

  return response.json();
}

// Query options factory
export function feedbackQueryOptions(
  page: number,
  limit: number,
  type: FilterType,
) {
  return queryOptions({
    queryKey: ['feedback', 'messages', { page, limit, type }],
    queryFn: () => fetchFeedback(page, limit, type),
    staleTime: 1000 * 30, // 30 seconds - admin data changes frequently
  });
}

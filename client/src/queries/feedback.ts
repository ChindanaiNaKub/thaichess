import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

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

export interface SubmitFeedbackInput {
  type: string;
  message: string;
  page: string;
  userAgent: string;
}

// API function for fetching feedback
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

// API function for submitting feedback
async function submitFeedback(input: SubmitFeedbackInput): Promise<void> {
  const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : '';
  const response = await fetch(`${baseUrl}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }
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

// Mutation hook for submitting feedback
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

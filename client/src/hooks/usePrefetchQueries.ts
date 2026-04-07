import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { gamesQueryOptions } from '../queries/games';
import { leaderboardQueryOptions } from '../queries/leaderboard';
import { homeStatsQueryOptions, aboutStatsQueryOptions } from '../queries/stats';
import { fairPlayCasesQueryOptions } from '../queries/fairPlay';
import { feedbackQueryOptions } from '../queries/feedback';

export function usePrefetchQueries() {
  const queryClient = useQueryClient();

  const prefetchGames = useCallback(() => {
    queryClient.prefetchQuery(gamesQueryOptions(1, 10, 'all'));
  }, [queryClient]);

  const prefetchLeaderboard = useCallback(() => {
    queryClient.prefetchQuery(leaderboardQueryOptions(50));
  }, [queryClient]);

  const prefetchHomeStats = useCallback(() => {
    queryClient.prefetchQuery(homeStatsQueryOptions());
  }, [queryClient]);

  const prefetchAboutStats = useCallback(() => {
    queryClient.prefetchQuery(aboutStatsQueryOptions());
  }, [queryClient]);

  const prefetchFairPlayCases = useCallback(() => {
    queryClient.prefetchQuery(fairPlayCasesQueryOptions(1, 20, 'all'));
  }, [queryClient]);

  const prefetchFeedback = useCallback(() => {
    queryClient.prefetchQuery(feedbackQueryOptions(1, 20, 'all'));
  }, [queryClient]);

  return {
    prefetchGames,
    prefetchLeaderboard,
    prefetchHomeStats,
    prefetchAboutStats,
    prefetchFairPlayCases,
    prefetchFeedback,
  };
}

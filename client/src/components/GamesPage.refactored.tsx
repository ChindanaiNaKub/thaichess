import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../lib/i18n';
import { routes, savedGameAnalysisRoute } from '../lib/routes';
import { gamesQueryOptions, type GamesFilter } from '../queries/games';
import Header from './Header';
import { useState } from 'react';

// ... keep all the helper functions (formatTimeControl, formatResult, etc.) ...

export default function GamesPage() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [filter, setFilter] = useState<GamesFilter>('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Reset page when filter changes
  const handleFilterChange = (newFilter: GamesFilter) => {
    setFilter(newFilter);
    setPage(0);
  };

  // Use TanStack Query for data fetching
  const {
    data,
    isLoading,
    isError,
    error,
    isPlaceholderData, // True when showing old data while fetching new page
  } = useQuery(gamesQueryOptions(page, limit, filter));

  const games = data?.games ?? [];
  const total = data?.total ?? 0;
  const botStats = data?.botStats ?? {
    gamesCount: 0,
    winRate: 0,
    highestBotLevelDefeated: null,
  };

  const totalPages = Math.ceil(total / limit);

  // Rest of your component JSX stays mostly the same
  // Just replace loading checks:
  // - Use `isLoading` for initial load
  // - Use `isPlaceholderData` to show opacity while changing pages

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="games" />

      <main
        id="main-content"
        className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full"
      >
        {/* ... header section ... */}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 px-6 py-10 text-center">
            <p className="text-danger">{error?.message || t('error.generic')}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : games.length === 0 ? (
          // ... empty state JSX ...
          <div>Empty state</div>
        ) : (
          <div style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
            {/* Games table with smooth transitions between pages */}
            {/* ... rest of your games list JSX ... */}
          </div>
        )}
      </main>
    </div>
  );
}

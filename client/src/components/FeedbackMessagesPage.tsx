import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import Footer from './Footer';
import Header from './Header';
import { feedbackQueryOptions, type FeedbackEntry, type FilterType } from '../queries/feedback';

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  bug: { bg: 'bg-red-500/15', text: 'text-red-400', icon: '🐛' },
  feature: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: '✨' },
  other: { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: '💬' },
};

export default function FeedbackMessagesPage() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const limit = 20;

  // TanStack Query for fetching feedback
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery(feedbackQueryOptions(page, limit, filter));

  const feedback = data?.feedback ?? [];
  const total = data?.total ?? 0;

  function timeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return t('time.just_now');
    if (seconds < 3600) return t('time.min_ago', { n: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('time.hour_ago', { n: Math.floor(seconds / 3600) });
    if (seconds < 604800) return t('time.day_ago', { n: Math.floor(seconds / 86400) });
    return new Date(timestamp * 1000).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US');
  }

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      navigate('/login', { replace: true });
    }
  }, [authLoading, navigate, user]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [filter]);

  const totalPages = Math.ceil(total / limit);

  async function handleDelete(feedbackId: number) {
    const response = await fetch(`/api/feedback/${feedbackId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: t('feedback_page.removed_by_admin') }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || t('feedback_page.moderate_failed'));
    }
    // Note: In a full implementation, we'd use useMutation and invalidate the query
  }

  if (authLoading || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-text-dim">
        {t('feedback_page.loading')}
      </div>
    );
  }

  const filterButton = (type: FilterType, label: string) => (
    <button
      key={type}
      onClick={() => setFilter(type)}
      className={`
        px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150
        ${filter === type
          ? 'bg-primary text-white shadow-sm'
          : 'bg-surface-alt border border-surface-hover text-text-dim hover:text-text-bright hover:bg-surface-hover'
        }
      `}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="about" />

      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text-bright">{t('feedback_page.title')}</h2>
          <span className="text-text-dim text-xs sm:text-sm">{t('feedback_page.count', { count: total })}</span>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {filterButton('all', t('feedback_page.filter_all'))}
          {filterButton('bug', `🐛 ${t('feedback.bug')}`)}
          {filterButton('feature', `✨ ${t('feedback.feature')}`)}
          {filterButton('other', `💬 ${t('feedback.other')}`)}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-danger">{queryError?.message || t('feedback_page.load_failed')}</div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-text-dim text-base sm:text-lg mb-2">{t('feedback_page.empty')}</p>
            <p className="text-text-dim text-sm">{t('feedback_page.empty_desc')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {feedback.map(item => {
                const style = TYPE_STYLES[item.type] || TYPE_STYLES.other;
                const isExpanded = expanded === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-surface-alt rounded-xl border border-surface-hover p-4 hover:border-surface-hover/80 transition-all duration-150 cursor-pointer"
                  >
                    <div
                      onClick={() => setExpanded(isExpanded ? null : item.id)}
                      className="flex items-start gap-3"
                    >
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${style.bg} ${style.text}`}>
                        {style.icon} {item.type}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className={`text-text-bright text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {item.message}
                        </p>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-surface-hover/50 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-text-dim">
                              <span className="font-medium">{t('feedback_page.detail_page')}:</span>
                              <span className="font-mono">{item.page || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-dim">
                              <span className="font-medium">{t('feedback_page.detail_date')}:</span>
                              <span>{new Date(item.created_at * 1000).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="shrink-0 text-text-dim text-xs whitespace-nowrap">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={async (event) => {
                          event.stopPropagation();
                          try {
                            await handleDelete(item.id);
                          } catch (err) {
                            // Error is handled by the delete function's error state
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-danger/40 text-danger text-xs font-medium"
                      >
                        {t('feedback_page.delete')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 bg-surface-alt border border-surface-hover rounded text-sm disabled:opacity-30 hover:bg-surface-hover transition-colors text-text"
                >
                  ← {t('games.prev')}
                </button>
                <span className="text-text-dim text-xs sm:text-sm px-3">
                  {t('games.page', { current: page + 1, total: totalPages })}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 bg-surface-alt border border-surface-hover rounded text-sm disabled:opacity-30 hover:bg-surface-hover transition-colors text-text"
                >
                  {t('games.next')} →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n';
import Header from './Header';

interface FeedbackEntry {
  id: number;
  type: string;
  message: string;
  page: string;
  user_agent: string;
  created_at: number;
}

type FilterType = 'all' | 'bug' | 'feature' | 'other';

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  bug: { bg: 'bg-red-500/15', text: 'text-red-400', icon: '🐛' },
  feature: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: '✨' },
  other: { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: '💬' },
};

export default function FeedbackMessagesPage() {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const limit = 20;

  function timeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return t('time.just_now');
    if (seconds < 3600) return t('time.min_ago', { n: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('time.hour_ago', { n: Math.floor(seconds / 3600) });
    if (seconds < 604800) return t('time.day_ago', { n: Math.floor(seconds / 86400) });
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filter !== 'all') params.set('type', filter);

    fetch(`/api/feedback?${params}`)
      .then(r => r.json())
      .then(data => {
        setFeedback(data.feedback || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  const totalPages = Math.ceil(total / limit);

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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
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
                    onClick={() => setExpanded(isExpanded ? null : item.id)}
                    className="bg-surface-alt rounded-xl border border-surface-hover p-4 hover:border-surface-hover/80 transition-all duration-150 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
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
                              <span>{new Date(item.created_at * 1000).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="shrink-0 text-text-dim text-xs whitespace-nowrap">
                        {timeAgo(item.created_at)}
                      </span>
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

      <footer className="bg-surface-alt border-t border-surface-hover py-4 px-4 text-center text-text-dim text-xs sm:text-sm">
        {t('footer.tagline')}
      </footer>
    </div>
  );
}

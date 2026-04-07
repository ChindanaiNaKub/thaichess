import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from './Header';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { useToast } from '../lib/toast';
import { fairPlayCasesQueryOptions, useCaseActionMutation, type FairPlayCase, type FilterStatus } from '../queries/fairPlay';

const STATUS_STYLES: Record<FilterStatus | FairPlayCase['status'], string> = {
  all: 'bg-surface text-text-dim border border-surface-hover',
  open: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  reviewed: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  restricted: 'bg-red-500/15 text-red-300 border border-red-500/30',
  dismissed: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
};

function getDisplayName(item: FairPlayCase) {
  return item.user_username?.trim() || item.user_email;
}

export default function FairPlayCasesPage() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<FilterStatus>('open');

  const limit = 20;

  // TanStack Query for fetching cases
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery(fairPlayCasesQueryOptions(page, limit, filter));

  // TanStack Query mutation for case actions
  const caseActionMutation = useCaseActionMutation();

  const cases = data?.cases ?? [];
  const total = data?.total ?? 0;

  const formatDateTime = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US');

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

  // Optimistic updates: cases disappear immediately when action is clicked
  // The mutation handles rollback on error
  async function handleRestrict(item: FairPlayCase) {
    caseActionMutation.mutate(
      { action: 'restrict', caseId: item.id },
      {
        onError: (err) => {
          showToast(err instanceof Error ? err.message : t('fair_play.admin_action_failed'), 'error');
        },
      }
    );
  }

  async function handleDismiss(item: FairPlayCase) {
    caseActionMutation.mutate(
      { action: 'dismiss', caseId: item.id },
      {
        onError: (err) => {
          showToast(err instanceof Error ? err.message : t('fair_play.admin_action_failed'), 'error');
        },
      }
    );
  }

  async function handleClear(item: FairPlayCase) {
    caseActionMutation.mutate(
      { action: 'clear', caseId: item.id, userId: item.user_id },
      {
        onError: (err) => {
          showToast(err instanceof Error ? err.message : t('fair_play.admin_action_failed'), 'error');
        },
      }
    );
  }

  if (authLoading || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-text-dim">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="about" />

      <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-text-bright">{t('fair_play.admin_title')}</h1>
            <p className="mt-1 text-sm text-text-dim">{t('fair_play.admin_desc')}</p>
          </div>
          <span className="text-xs sm:text-sm text-text-dim">{t('fair_play.admin_count', { count: total })}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {(['open', 'restricted', 'dismissed', 'reviewed', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt border border-surface-hover text-text-dim hover:text-text-bright'
              }`}
            >
              {t(`fair_play.filter_${status}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{queryError?.message || t('fair_play.admin_load_failed')}</div>
        ) : cases.length === 0 ? (
          <div className="rounded-2xl border border-surface-hover bg-surface-alt px-6 py-12 text-center text-text-dim">
            {t('fair_play.admin_empty')}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cases.map((item) => {
                const isRestrictedUser = item.user_fair_play_status === 'restricted';

                return (
                  <article key={item.id} className="rounded-2xl border border-surface-hover bg-surface-alt p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATUS_STYLES[item.status]}`}>
                            {t(`fair_play.status.${item.status}`)}
                          </span>
                          <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                            {item.latest_event_type ? t(`fair_play.event.${item.latest_event_type}`) : t('fair_play.event.none')}
                          </span>
                          <span className="text-xs text-text-dim">
                            {t('fair_play.event_count', { count: item.event_count })}
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="text-lg font-semibold text-text-bright">{getDisplayName(item)}</div>
                          <div className="mt-1 text-xs text-text-dim">{item.user_email}</div>
                        </div>

                        <p className="mt-3 text-sm text-text-bright">{item.reason}</p>
                        {item.note && (
                          <p className="mt-2 text-sm text-text-dim">{item.note}</p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-dim">
                          <span>{t('fair_play.updated_at')} {formatDateTime(item.updated_at)}</span>
                          <span>{t('fair_play.case_id')} #{item.id}</span>
                          {isRestrictedUser && item.user_rated_restricted_at && (
                            <span>{t('fair_play.restricted_since')} {formatDateTime(item.user_rated_restricted_at)}</span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px]">
                        {!isRestrictedUser && item.status !== 'dismissed' && (
                          <button
                            onClick={() => void handleRestrict(item)}
                            className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/20 transition-colors"
                          >
                            {t('fair_play.action_restrict')}
                          </button>
                        )}
                        {isRestrictedUser && (
                          <button
                            onClick={() => void handleClear(item)}
                            className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-light hover:bg-primary/20 transition-colors"
                          >
                            {t('fair_play.action_clear')}
                          </button>
                        )}
                        {item.status !== 'dismissed' && (
                          <button
                            onClick={() => void handleDismiss(item)}
                            className="rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm font-semibold text-text-bright hover:bg-surface-hover transition-colors"
                          >
                            {t('fair_play.action_dismiss')}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-1.5 text-sm text-text disabled:opacity-30"
                >
                  ← {t('games.prev')}
                </button>
                <span className="px-3 text-sm text-text-dim">{t('games.page', { current: page + 1, total: totalPages })}</span>
                <button
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-1.5 text-sm text-text disabled:opacity-30"
                >
                  {t('games.next')} →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

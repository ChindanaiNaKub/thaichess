import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';

export function DeleteAccountSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showSection, setShowSection] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [deleted, setDeleted] = useState(false);
  const deletingRef = useRef(false);

  async function handleDeleteAccount() {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/user', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(t('account.delete_error'));
      }

      setDeleted(true);
      setTimeout(async () => {
        await logout();
        navigate(routes.home);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.delete_error'));
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  if (deleted) {
    return (
      <section className="rounded-xl border border-danger/30 bg-danger/5 p-5">
        <p className="text-sm font-medium text-danger">
          {t('account.delete_redirecting')}
        </p>
      </section>
    );
  }

  if (!showSection) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowSection(true)}
          className="text-sm font-semibold text-text-dim underline-offset-4 transition-colors hover:text-danger hover:underline"
        >
          {t('account.delete_show')}
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-danger/30 bg-danger/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-danger">
          {t('account.delete_title')}
        </h3>
        {!showConfirm ? (
          <button
            type="button"
            onClick={() => {
              setShowSection(false);
              setError('');
            }}
            className="shrink-0 text-xs font-semibold text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
          >
            {t('account.delete_hide')}
          </button>
        ) : null}
      </div>
      <p className="mt-2 mb-4 text-sm text-text-dim">
        {t('account.delete_desc')}
      </p>

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="w-full rounded-xl border border-danger/40 px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          {t('account.delete_action')}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-danger">
            {t('account.delete_warning')}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
              className="flex-1 rounded-xl border border-surface-hover/70 bg-surface px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60 disabled:opacity-60"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteAccount()}
              disabled={deleting}
              className="flex-1 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-danger-bright disabled:opacity-60"
            >
              {deleting ? t('account.delete_deleting') : t('account.delete_confirm')}
            </button>
          </div>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}

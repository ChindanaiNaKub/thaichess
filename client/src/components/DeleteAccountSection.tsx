import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';

export function DeleteAccountSection() {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [deleted, setDeleted] = useState(false);
  const deletingRef = useRef(false);

  const isThai = lang === 'th';

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
        throw new Error('Failed to delete account');
      }

      setDeleted(true);
      // Clear auth state and redirect
      setTimeout(async () => {
        await logout();
        navigate(routes.home);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : isThai ? 'ไม่สามารถลบบัญชีได้' : 'Could not delete account');
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  if (deleted) {
    return (
      <section className="rounded-[1.6rem] border border-danger/30 bg-danger/5 p-5">
        <p className="text-sm font-medium text-danger">
          {isThai ? 'บัญชีของคุณถูกลบแล้ว กำลังพากลับไปหน้าแรก...' : 'Your account has been deleted. Redirecting to home...'}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.6rem] border border-danger/30 bg-danger/5 p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-danger">
        {isThai ? 'ลบบัญชี' : 'Delete Account'}
      </p>
      <p className="mb-4 text-sm text-text-dim">
        {isThai
          ? 'การลบบัญชีจะลบข้อมูลทั้งหมดของคุณอย่างถาวร การกระทำนี้ไม่สามารถยกเลิกได้'
          : 'Deleting your account will permanently remove all your data. This action cannot be undone.'}
      </p>

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="w-full rounded-xl border border-danger/40 px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          {isThai ? 'ลบบัญชีของฉัน' : 'Delete My Account'}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-danger">
            {isThai
              ? 'คุณแน่ใจหรือไม่? บัญชี เรตติ้ง และประวัติเกมทั้งหมดจะถูกลบอย่างถาวร'
              : 'Are you sure? Your account, ratings, and all game history will be permanently deleted.'}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
              className="flex-1 rounded-xl border border-surface-hover/70 bg-surface px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60 disabled:opacity-60"
            >
              {isThai ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex-1 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-danger-bright disabled:opacity-60"
            >
              {deleting ? (isThai ? 'กำลังลบ...' : 'Deleting...') : (isThai ? 'ใช่ ลบบัญชี' : 'Yes, Delete Account')}
            </button>
          </div>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
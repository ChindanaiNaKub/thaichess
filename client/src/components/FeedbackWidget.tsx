import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';
import { useToast } from '../lib/toast';
import { useSubmitFeedbackMutation } from '../queries/feedback';

type FeedbackType = 'bug' | 'feature' | 'other';

export default function FeedbackWidget() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const location = useLocation();

  const submitMutation = useSubmitFeedbackMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitMutation.isPending) return;

    const submittedMessage = message;
    setMessage('');

    submitMutation.mutate(
      {
        type,
        message: submittedMessage.trim(),
        page: location.pathname,
        userAgent: navigator.userAgent,
      },
      {
        onError: (err) => {
          // Restore message on error
          setMessage(submittedMessage);
          showToast(err instanceof Error ? err.message : t('feedback.error'), 'error');
        },
        onSuccess: () => {
          // Show success toast and close modal
          showToast(t('feedback.thanks'), 'success');
          setIsOpen(false);
        },
      }
    );
  };

  const placeholderKey =
    type === 'bug'
      ? 'feedback.placeholder_bug'
      : type === 'feature'
      ? 'feedback.placeholder_feature'
      : 'feedback.placeholder_other';

  const pathname = location.pathname;
  const isPuzzleRoute = pathname === routes.puzzles || pathname.startsWith('/puzzle/');
  const isPlayOperateRoute =
    pathname === routes.bot
    || pathname === routes.quickPlay
    || pathname === routes.play
    || pathname === routes.local
    || pathname.startsWith('/game/')
    || pathname.startsWith('/spectate/');
  const shouldHideLauncher =
    pathname === routes.login
    || pathname === routes.feedback
    || isPuzzleRoute
    || isPlayOperateRoute;

  if (shouldHideLauncher) {
    return null;
  }

  return (
    <>
      <button type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t('feedback.title')}
        className="fixed bottom-3 right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-surface-hover bg-surface-alt text-text-dim shadow-lg transition-colors hover:bg-surface-hover hover:text-text-bright hover:shadow-xl sm:bottom-6 sm:right-6 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-4 sm:py-2"
        title={t('feedback.title')}
      >
        <span className="hidden sm:inline text-sm font-medium">{t('feedback.button')}</span>
        <span className="sm:hidden text-sm font-bold" aria-hidden>+</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fadeIn p-0 sm:p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-surface-alt border border-surface-hover rounded-t-2xl sm:rounded-xl p-4 sm:p-5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-text-bright">{t('feedback.title')}</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-text-dim hover:text-text-bright text-xl leading-none p-1">&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3 flex flex-wrap gap-2">
                {(['bug', 'feature', 'other'] as FeedbackType[]).map(fbType => (
                  <button
                    key={fbType}
                    type="button"
                    onClick={() => setType(fbType)}
                    className={`ui-choice rounded-lg px-3 py-1.5 text-sm font-medium ${
                      type === fbType ? 'ui-choice-selected' : 'bg-surface text-text-dim'
                    }`}
                  >
                    {fbType === 'bug' ? t('feedback.bug') : fbType === 'feature' ? t('feedback.feature') : t('feedback.other')}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t(placeholderKey)}
                className="w-full resize-none rounded-lg border border-surface-hover bg-surface px-4 py-3 text-sm text-text-bright outline-none transition-colors focus:border-accent"
                rows={4}
                maxLength={2000}
                autoFocus
              />

              <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-text-dim">{message.length}/2000</span>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-text-dim transition-colors hover:text-text-bright"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || submitMutation.isPending}
                    className="button-accent-contrast rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {submitMutation.isPending ? t('common.sending') : t('common.send')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

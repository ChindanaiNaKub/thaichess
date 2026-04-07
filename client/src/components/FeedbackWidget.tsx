import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';
import { useSubmitFeedbackMutation } from '../queries/feedback';

type FeedbackType = 'bug' | 'feature' | 'other';

export default function FeedbackWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const location = useLocation();

  const submitMutation = useSubmitFeedbackMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitMutation.isPending) return;

    // Optimistic update - show success immediately
    setIsSent(true);
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
        onError: () => {
          // On error, restore the message and show form again
          setIsSent(false);
          setMessage(submittedMessage);
        },
        onSuccess: () => {
          // Close after showing success for 2 seconds
          setTimeout(() => {
            setIsOpen(false);
            setIsSent(false);
          }, 2000);
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

  const shouldHideLauncher = location.pathname === routes.login || location.pathname === routes.feedback;

  if (shouldHideLauncher) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t('feedback.title')}
        className="fixed bottom-3 right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-surface-hover bg-surface-alt text-text-dim shadow-lg transition-all hover:bg-surface-hover hover:text-text-bright hover:shadow-xl sm:bottom-6 sm:right-6 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-4 sm:py-2"
        title={t('feedback.title')}
      >
        <span>💬</span>
        <span className="hidden sm:inline text-sm font-medium">{t('feedback.button')}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fadeIn p-0 sm:p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-surface-alt border border-surface-hover rounded-t-2xl sm:rounded-xl p-4 sm:p-5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-text-bright">{t('feedback.title')}</h3>
              <button onClick={() => setIsOpen(false)} className="text-text-dim hover:text-text-bright text-xl leading-none p-1">&times;</button>
            </div>

            {isSent ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-text-bright font-medium">{t('feedback.thanks')}</p>
                <p className="text-text-dim text-sm mt-1">{t('feedback.thanks_desc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(['bug', 'feature', 'other'] as FeedbackType[]).map(fbType => (
                    <button
                      key={fbType}
                      type="button"
                      onClick={() => setType(fbType)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        type === fbType
                          ? 'bg-primary text-white'
                          : 'bg-surface hover:bg-surface-hover text-text-dim border border-surface-hover'
                      }`}
                    >
                      {fbType === 'bug' ? `🐛 ${t('feedback.bug')}` : fbType === 'feature' ? `✨ ${t('feedback.feature')}` : `💬 ${t('feedback.other')}`}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t(placeholderKey)}
                  className="w-full bg-surface border border-surface-hover rounded-lg px-4 py-3 text-text-bright text-sm focus:outline-none focus:border-primary resize-none transition-colors"
                  rows={4}
                  maxLength={2000}
                  autoFocus
                />

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                  <span className="text-text-dim text-xs">{message.length}/2000</span>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-text-dim hover:text-text-bright text-sm transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={!message.trim() || submitMutation.isPending}
                      className="px-5 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors"
                    >
                      {submitMutation.isPending ? t('common.sending') : t('common.send')}
                    </button>
                  </div>
                </div>

                {submitMutation.isError && (
                  <p className="text-danger text-sm mt-2">{t('feedback.error')}</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

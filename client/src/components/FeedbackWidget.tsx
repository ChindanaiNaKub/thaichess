import { useState } from 'react';
import { useLocation } from 'react-router-dom';

type FeedbackType = 'bug' | 'feature' | 'other';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('sending');
    try {
      const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : '';
      const res = await fetch(`${baseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          page: location.pathname,
          userAgent: navigator.userAgent,
        }),
      });
      if (res.ok) {
        setStatus('sent');
        setMessage('');
        setTimeout(() => {
          setIsOpen(false);
          setStatus('idle');
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-surface-alt hover:bg-surface-hover border border-surface-hover text-text-dim hover:text-text-bright rounded-full px-4 py-2 text-sm shadow-lg transition-all hover:shadow-xl flex items-center gap-1.5"
        title="Send feedback or report a bug"
      >
        <span>💬</span>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fadeIn" onClick={() => setIsOpen(false)}>
          <div
            className="bg-surface-alt border border-surface-hover rounded-t-xl sm:rounded-xl p-5 w-full sm:max-w-md animate-slideUp shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-bright">Send Feedback</h3>
              <button onClick={() => setIsOpen(false)} className="text-text-dim hover:text-text-bright text-xl leading-none">&times;</button>
            </div>

            {status === 'sent' ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-text-bright font-medium">Thank you!</p>
                <p className="text-text-dim text-sm">Your feedback helps improve Makruk Online.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex gap-2 mb-3">
                  {(['bug', 'feature', 'other'] as FeedbackType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        type === t
                          ? 'bg-primary text-white'
                          : 'bg-surface hover:bg-surface-hover text-text-dim border border-surface-hover'
                      }`}
                    >
                      {t === 'bug' ? '🐛 Bug' : t === 'feature' ? '✨ Feature' : '💬 Other'}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={
                    type === 'bug'
                      ? "What happened? What did you expect?"
                      : type === 'feature'
                      ? "What feature would you like?"
                      : "Tell us anything..."
                  }
                  className="w-full bg-surface border border-surface-hover rounded-lg px-4 py-3 text-text-bright text-sm focus:outline-none focus:border-primary resize-none transition-colors"
                  rows={4}
                  maxLength={2000}
                  autoFocus
                />

                <div className="flex items-center justify-between mt-3">
                  <span className="text-text-dim text-xs">{message.length}/2000</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-text-dim hover:text-text-bright text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!message.trim() || status === 'sending'}
                      className="px-5 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors"
                    >
                      {status === 'sending' ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>

                {status === 'error' && (
                  <p className="text-danger text-sm mt-2">Failed to send. Please try again.</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';

// Google Icon Component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// Loading Spinner Component
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="31.416"
        opacity="0.3"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="31.416;0;31.416"
          dur="1.5s"
          repeatCount="indefinite"
          calcMode="easeInOut"
        />
      </circle>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="15.708"
        strokeDashoffset="15.708"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="15.708;0;15.708"
          dur="1.5s"
          repeatCount="indefinite"
          calcMode="easeInOut"
          begin="0.375s"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) {
      return message;
    }
  }

  return fallback;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { requestCode, verifyCode, signInWithGoogle, user } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/account" replace />;
  }

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await requestCode(email);
      setStep('code');
    } catch (err) {
      setError(getErrorMessage(err, t('auth.send_code_failed')));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyCode(email, code);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t('auth.sign_in_failed')));
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialSignIn() {
    setGoogleLoading(true);
    setError('');

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getErrorMessage(err, t('auth.sign_in_failed')));
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Simple Welcome */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-bright tracking-tight">
              {t('auth.sign_in')}
            </h1>
          </div>

          {/* Primary Action - Google Sign In */}
          <button
            type="button"
            onClick={() => void handleSocialSignIn()}
            disabled={googleLoading}
            className="group w-full rounded-xl bg-white px-6 py-4 text-base font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-lg hover:shadow-black/10 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none"
            aria-label={t('auth.continue_with_google')}
          >
            <span className="flex items-center justify-center gap-3">
              {googleLoading ? (
                <>
                  <LoadingSpinner className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-600">{t('auth.signing_in')}</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <span>{t('auth.continue_with_google')}</span>
                </>
              )}
            </span>
          </button>

          {/* Email Fallback - Minimal */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowEmailFallback((current) => !current)}
              className="text-sm text-text-dim hover:text-text transition-colors"
              aria-expanded={showEmailFallback}
            >
              {showEmailFallback ? t('auth.hide_email') : t('auth.or_email_fallback')}
            </button>
          </div>

          {/* Email Form - Collapsible */}
          {showEmailFallback && (
            <div className="mt-6 animate-slideUp">
              <div className="rounded-xl border border-surface-hover bg-surface-alt p-5">
                {step === 'email' ? (
                  <form onSubmit={handleRequestCode} className="space-y-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder={t('auth.email_placeholder')}
                      className="w-full rounded-lg border border-surface-hover bg-surface px-4 py-3 text-text-bright outline-none transition-all placeholder:text-text-dim/60 focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-light active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading && <LoadingSpinner className="w-4 h-4" />}
                      {loading ? t('auth.sending_code') : t('auth.send_code')}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="text-sm text-text-dim mb-2">
                      {t('auth.code_sent_to', { email })}
                    </div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      inputMode="numeric"
                      pattern="\d{6}"
                      placeholder={t('auth.code_placeholder')}
                      className="w-full rounded-lg border border-surface-hover bg-surface px-4 py-3 text-text-bright outline-none tracking-[0.3em] text-center font-mono text-lg transition-all placeholder:text-text-dim/60 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-light active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading && <LoadingSpinner className="w-4 h-4" />}
                      {loading ? t('auth.signing_in') : t('auth.verify_code')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setCode('');
                        setError('');
                      }}
                      className="w-full text-sm text-text-dim hover:text-text transition-colors"
                    >
                      {t('auth.use_another_email')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 animate-slideUp">
              <p className="text-sm text-danger text-center">{error}</p>
            </div>
          )}

          {/* Back Link */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate(routes.home)}
              className="text-sm text-text-dim hover:text-text transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t('auth.back_to_play')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

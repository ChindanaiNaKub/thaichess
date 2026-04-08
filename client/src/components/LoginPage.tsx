import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';

export default function LoginPage() {
  const navigate = useNavigate();
  const { requestCode, verifyCode, signInWithGoogle, user } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (user) {
    return <Navigate to="/account" replace />;
  }

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      await requestCode(email);
      setStep('code');
      setNotice(t('auth.code_sent_notice'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.send_code_failed'));
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
      setError(err instanceof Error ? err.message : t('auth.sign_in_failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialSignIn() {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.sign_in_failed'));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,28rem)] lg:items-start">
          <section className="rounded-3xl border border-surface-hover/60 bg-surface-alt/60 p-6 sm:p-8">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">
              {t('auth.sign_in')}
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-text-bright">
              {t('auth.hero_title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-7 text-text-dim">
              {t('auth.hero_desc')}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {(['auth.benefit_optional', 'auth.benefit_rated', 'auth.benefit_fast'] as const).map((key) => (
                <div key={key} className="rounded-2xl border border-surface-hover/60 bg-surface/70 px-4 py-4">
                  <p className="text-sm font-medium leading-6 text-text-bright">{t(key)}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate(routes.home)}
              className="mt-6 inline-flex items-center rounded-lg border border-surface-hover bg-surface px-4 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover"
            >
              {t('auth.back_to_play')}
            </button>
          </section>

          <section className="bg-surface-alt border border-surface-hover rounded-3xl p-6 sm:p-7 shadow-lg shadow-black/10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-text-bright">{t('auth.social_title')}</h2>
              <p className="mt-2 text-sm leading-6 text-text-dim">{t('auth.social_desc')}</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void handleSocialSignIn()}
                disabled={loading}
                className="w-full rounded-xl border border-surface-hover bg-surface px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover disabled:opacity-60"
              >
                {t('auth.continue_with_google')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailFallback((current) => !current);
                  setError('');
                  setNotice('');
                }}
                className="w-full rounded-xl border border-dashed border-surface-hover py-3 text-sm font-semibold text-text transition-colors hover:bg-surface"
              >
                {t('auth.or_email_fallback')}
              </button>
            </div>

            {showEmailFallback ? (
              <div className="mt-6 rounded-2xl border border-surface-hover/70 bg-surface/70 p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-dim">
                    <span className={step === 'email' ? 'text-primary-light' : ''}>{t('auth.step_email')}</span>
                    <span className="text-surface-hover">/</span>
                    <span className={step === 'code' ? 'text-primary-light' : ''}>{t('auth.step_code')}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-text-bright">{t('auth.email_fallback_title')}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-dim">{t('auth.email_fallback_desc')}</p>
                </div>

                {step === 'email' ? (
                  <form onSubmit={handleRequestCode} className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-text-bright">{t('auth.email')}</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder={t('auth.email_placeholder')}
                        className="w-full rounded-xl border border-surface-hover bg-surface px-3 py-3 text-text-bright outline-none transition-colors placeholder:text-text-dim/70 focus:border-primary"
                      />
                      <span className="mt-2 block text-xs leading-5 text-text-dim">{t('auth.email_hint')}</span>
                    </label>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
                    >
                      {loading ? t('auth.sending_code') : t('auth.send_code')}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-text-bright">
                      <div className="font-medium">{t('auth.code_sent_to', { email })}</div>
                      <div className="mt-1 text-xs leading-5 text-text-dim">{t('auth.code_hint')}</div>
                    </div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-text-bright">{t('auth.code')}</span>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        inputMode="numeric"
                        pattern="\d{6}"
                        placeholder={t('auth.code_placeholder')}
                        className="w-full rounded-xl border border-surface-hover bg-surface px-3 py-3 text-text-bright outline-none tracking-[0.35em] transition-colors placeholder:text-text-dim/70 focus:border-primary"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
                    >
                      {loading ? t('auth.signing_in') : t('auth.verify_code')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setCode('');
                        setError('');
                        setNotice('');
                      }}
                      className="w-full rounded-xl border border-surface-hover py-3 text-sm font-semibold text-text transition-colors hover:bg-surface"
                    >
                      {t('auth.use_another_email')}
                    </button>
                  </form>
                )}
              </div>
            ) : null}

            {notice && <p className="mt-4 text-sm text-primary">{notice}</p>}
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
          </section>
        </div>
      </main>
    </div>
  );
}

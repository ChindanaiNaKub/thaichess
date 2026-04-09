import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/authClient';
import { routes } from '../lib/routes';

type VerificationMode = 'totp' | 'backup';

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return 'Verification failed.';
}

export default function TwoFactorRoute() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<VerificationMode>('totp');
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = mode === 'totp'
        ? await authClient.twoFactor.verifyTotp({ code, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({ code, trustDevice });

      if (response.error) {
        throw response.error;
      }

      navigate(routes.account, { replace: true });
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === 'totp' ? 'Two-factor verification' : 'Backup code verification';
  const label = mode === 'totp' ? 'Authenticator code' : 'Backup code';
  const helper = mode === 'totp'
    ? 'Enter the 6-digit code from your authenticator app to finish signing in.'
    : 'Use one of your saved backup codes if your authenticator app is unavailable.';

  return (
    <main id="main-content" className="min-h-screen bg-surface px-4 py-12">
      <div className="mx-auto max-w-md rounded-3xl border border-surface-hover/60 bg-surface-alt p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-light">
          Account security
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-bright">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-dim">
          {helper}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-text-bright">{label}</span>
            <input
              autoComplete="one-time-code"
              className="w-full rounded-xl border border-surface-hover bg-surface px-4 py-3 text-text-bright outline-none transition-colors placeholder:text-text-dim/70 focus:border-primary"
              inputMode={mode === 'totp' ? 'numeric' : 'text'}
              onChange={(event) => setCode(event.target.value)}
              placeholder={mode === 'totp' ? '123456' : 'XXXX-XXXX'}
              value={code}
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-text-bright">
            <input
              checked={trustDevice}
              className="h-4 w-4 rounded border border-surface-hover bg-surface"
              onChange={(event) => setTrustDevice(event.target.checked)}
              type="checkbox"
            />
            Trust this device for 30 days
          </label>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
            disabled={submitting || code.trim().length === 0}
            type="submit"
          >
            {submitting ? 'Verifying...' : 'Verify and continue'}
          </button>
        </form>

        <button
          className="mt-4 text-sm font-semibold text-primary-light transition-colors hover:text-primary"
          onClick={() => {
            setMode((current) => current === 'totp' ? 'backup' : 'totp');
            setCode('');
            setError('');
          }}
          type="button"
        >
          {mode === 'totp' ? 'Use backup code instead' : 'Use authenticator code instead'}
        </button>
      </div>
    </main>
  );
}

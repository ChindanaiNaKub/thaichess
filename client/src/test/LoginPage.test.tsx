import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../components/LoginPage';
import { AuthProvider } from '../lib/auth';

const navigateMock = vi.hoisted(() => vi.fn());
const authClientMock = vi.hoisted(() => ({
  emailOtp: {
    sendVerificationOtp: vi.fn(),
  },
  signIn: {
    emailOtp: vi.fn(),
    social: vi.fn(),
  },
  signOut: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../components/Header', () => ({
  default: () => <div>Header</div>,
}));

vi.mock('../lib/authClient', () => ({
  authClient: authClientMock,
}));

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'auth.sign_in': 'Sign in',
        'auth.continue_with_google': 'Continue with Google',
        'auth.or_email_fallback': 'Use email instead',
        'auth.hide_email': 'Hide email',
        'auth.email_placeholder': 'you@example.com',
        'auth.code_placeholder': 'Enter 6-digit code',
        'auth.send_code': 'Send sign-in code',
        'auth.sending_code': 'Sending code',
        'auth.code_sent_to': `Code sent to ${params?.email ?? '{email}'}`,
        'auth.verify_code': 'Verify code',
        'auth.use_another_email': 'Use another email',
        'auth.signing_in': 'Signing in',
        'auth.back_to_play': 'Back to play',
      };
      return translations[key] ?? key;
    },
  }),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.history.pushState({}, '', '/login');
    navigateMock.mockReset();
    authClientMock.emailOtp.sendVerificationOtp.mockReset();
    authClientMock.signIn.emailOtp.mockReset();
    authClientMock.signIn.social.mockReset();
    authClientMock.signOut.mockReset();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (input === '/api/auth/me') {
        return {
          ok: true,
          json: async () => ({ user: null }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  it('keeps the current login copy and uses Better Auth for Google and email OTP sign-in', async () => {
    authClientMock.emailOtp.sendVerificationOtp.mockResolvedValue({
      data: { success: true },
      error: null,
    });
    authClientMock.signIn.emailOtp.mockResolvedValue({
      data: {
        token: 'session-token',
        user: {
          id: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          email: 'test@example.com',
          emailVerified: true,
          name: 'Test User',
          image: null,
        },
      },
      error: null,
    });
    authClientMock.signIn.social.mockResolvedValue({
      data: undefined,
      error: null,
    });

    const user = userEvent.setup();
    renderLoginPage();

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use email instead' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    await waitFor(() => {
      expect(authClientMock.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: `${window.location.origin}/account`,
      });
    });

    await user.click(screen.getByRole('button', { name: 'Use email instead' }));
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send sign-in code' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send sign-in code' }));

    await waitFor(() => {
      expect(authClientMock.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        type: 'sign-in',
      });
    });
    expect(screen.getByText('Code sent to test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verify code' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Enter 6-digit code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => {
      expect(authClientMock.signIn.emailOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
      });
    });
    expect(navigateMock).toHaveBeenCalledWith('/account', { replace: true });
  });
});

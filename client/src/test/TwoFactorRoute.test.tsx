import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import TwoFactorRoute from '../routes/TwoFactorRoute';

const { navigateMock, verifyTotpMock, verifyBackupCodeMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  verifyTotpMock: vi.fn(),
  verifyBackupCodeMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../lib/authClient', () => ({
  authClient: {
    twoFactor: {
      verifyTotp: verifyTotpMock,
      verifyBackupCode: verifyBackupCodeMock,
    },
  },
}));

vi.mock('../components/HomePage', () => ({
  default: () => <div>home-page</div>,
}));

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

vi.mock('../lib/seo', () => ({
  SeoHeadManager: () => null,
}));

vi.mock('../lib/perfDebug', () => ({
  logClientPerfEvent: vi.fn(),
}));

vi.mock('../components/FeedbackWidget', () => ({
  default: () => null,
}));

describe('TwoFactorRoute', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    verifyTotpMock.mockReset();
    verifyBackupCodeMock.mockReset();
    verifyTotpMock.mockResolvedValue({ error: null });
    verifyBackupCodeMock.mockResolvedValue({ error: null });
  });

  it('renders the two-factor verification route at /2fa', async () => {
    render(
      <MemoryRouter initialEntries={['/2fa']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Two-factor verification' })).toBeInTheDocument();
  });

  it('submits a TOTP code and redirects to the account page', async () => {
    render(
      <MemoryRouter>
        <TwoFactorRoute />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Authenticator code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByLabelText('Trust this device for 30 days'));
    fireEvent.click(screen.getByRole('button', { name: 'Verify and continue' }));

    await waitFor(() => {
      expect(verifyTotpMock).toHaveBeenCalledWith({
        code: '123456',
        trustDevice: true,
      });
    });
    expect(navigateMock).toHaveBeenCalledWith('/account', { replace: true });
  });

  it('can switch to backup code verification', async () => {
    render(
      <MemoryRouter>
        <TwoFactorRoute />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use backup code instead' }));
    fireEvent.change(screen.getByLabelText('Backup code'), {
      target: { value: 'BACKUP-0001' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and continue' }));

    await waitFor(() => {
      expect(verifyBackupCodeMock).toHaveBeenCalledWith({
        code: 'BACKUP-0001',
        trustDevice: false,
      });
    });
    expect(navigateMock).toHaveBeenCalledWith('/account', { replace: true });
  });
});

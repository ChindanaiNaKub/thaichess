import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '../components/LoginPage';

vi.mock('../components/Header', () => ({
  default: () => <div>Header</div>,
}));

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.sign_in': 'Sign in',
        'auth.hero_title': 'Keep your rated games and profile in one place.',
        'auth.hero_desc': 'Sign in with a trusted provider or use email if you need a fallback.',
        'auth.benefit_optional': 'Optional account',
        'auth.benefit_rated': 'Rated games',
        'auth.benefit_fast': 'Fast sign in',
        'auth.back_to_play': 'Back to play',
        'auth.social_title': 'Choose a sign-in method',
        'auth.social_desc': 'Google and Facebook are the fastest way to keep your account.',
        'auth.continue_with_google': 'Continue with Google',
        'auth.continue_with_facebook': 'Continue with Facebook',
        'auth.or_email_fallback': 'Use email instead',
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    requestCode: vi.fn(),
    verifyCode: vi.fn(),
    signInWithGoogle: vi.fn(),
    signInWithFacebook: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    updateProfile: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  it('renders social sign-in actions before the email fallback flow', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Facebook' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use email instead' })).toBeInTheDocument();
  });
});

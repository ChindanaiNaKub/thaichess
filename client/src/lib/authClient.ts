import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, twoFactorClient } from 'better-auth/client/plugins';
import { routes } from './routes';

export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [
    emailOTPClient(),
    twoFactorClient({
      twoFactorPage: routes.twoFactor,
    }),
  ],
});

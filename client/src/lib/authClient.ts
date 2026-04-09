import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';
import { routes } from './routes';

export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [
    twoFactorClient({
      twoFactorPage: routes.twoFactor,
    }),
  ],
});

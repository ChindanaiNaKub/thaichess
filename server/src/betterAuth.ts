import './env';
import type { Request } from 'express';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { twoFactor } from 'better-auth/plugins';
import { authSchema } from './authSchema';
import { getAllowedCorsOrigins } from './security';
import { getUserById, type AuthUser } from './database';
import { logWarn } from './logger';

function resolveBetterAuthUrl() {
  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.SITE_URL,
    process.env.PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.RENDER_EXTERNAL_URL,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().replace(/\/+$/, '');
    }
  }

  return 'http://localhost:3000';
}

function resolveBetterAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET or AUTH_SECRET must be set in production.');
  }

  return 'dev-insecure-better-auth-secret';
}

function createLibsqlClient() {
  const databaseUrl = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (databaseUrl) {
    return createClient({
      url: databaseUrl,
      authToken: authToken || undefined,
    });
  }

  const dataDir = process.env.DATA_DIR?.trim() || 'data';
  return createClient({
    url: `file:${dataDir}/thaichess.db`,
  });
}

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
  };
}

if (process.env.FACEBOOK_CLIENT_ID?.trim() && process.env.FACEBOOK_CLIENT_SECRET?.trim()) {
  socialProviders.facebook = {
    clientId: process.env.FACEBOOK_CLIENT_ID.trim(),
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET.trim(),
  };
}

const authDb = drizzle(createLibsqlClient());

export const auth = betterAuth({
  appName: 'ThaiChess',
  baseURL: resolveBetterAuthUrl(),
  basePath: '/api/auth',
  secret: resolveBetterAuthSecret(),
  database: drizzleAdapter(authDb, {
    provider: 'sqlite',
    schema: authSchema,
    transaction: true,
  }),
  socialProviders,
  trustedOrigins: getAllowedCorsOrigins(process.env),
  user: {
    modelName: 'users',
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    additionalFields: {
      username: {
        type: 'string',
        required: false,
      },
      role: {
        type: ['user', 'admin'],
        required: false,
        defaultValue: 'user',
        input: false,
      },
      fair_play_status: {
        type: ['clear', 'restricted'],
        required: false,
        defaultValue: 'clear',
        input: false,
      },
      rated_restricted_at: {
        type: 'number',
        required: false,
        input: false,
      },
      rated_restriction_note: {
        type: 'string',
        required: false,
        input: false,
      },
      rating: {
        type: 'number',
        required: false,
        defaultValue: 1500,
        input: false,
      },
      rated_games: {
        type: 'number',
        required: false,
        defaultValue: 0,
        input: false,
      },
      wins: {
        type: 'number',
        required: false,
        defaultValue: 0,
        input: false,
      },
      losses: {
        type: 'number',
        required: false,
        defaultValue: 0,
        input: false,
      },
      draws: {
        type: 'number',
        required: false,
        defaultValue: 0,
        input: false,
      },
      last_login_at: {
        type: 'number',
        required: false,
        input: false,
      },
    },
  },
  session: {
    modelName: 'auth_sessions',
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  account: {
    modelName: 'accounts',
    fields: {
      userId: 'user_id',
      accountId: 'account_id',
      providerId: 'provider_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      idToken: 'id_token',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    accountLinking: {
      enabled: true,
      trustedProviders: [],
      allowDifferentEmails: false,
      updateUserInfoOnLink: false,
    },
    encryptOAuthTokens: true,
  },
  verification: {
    modelName: 'verifications',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  plugins: [
    twoFactor({
      issuer: 'ThaiChess',
      allowPasswordless: true,
      totpOptions: {
        digits: 6,
        period: 30,
        allowPasswordless: true,
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        allowPasswordless: true,
      },
      twoFactorCookieMaxAge: 600,
      trustDeviceMaxAge: 60 * 60 * 24 * 30,
    }),
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});

export const betterAuthHandler = toNodeHandler(auth);

export async function getBetterAuthUserFromHeaders(headers: Headers): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({
      headers,
    });

    if (!session?.user?.id) {
      return null;
    }

    return await getUserById(session.user.id);
  } catch (error) {
    logWarn('better_auth_session_lookup_failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
}

export async function getBetterAuthUser(req: Request): Promise<AuthUser | null> {
  return getBetterAuthUserFromHeaders(fromNodeHeaders(req.headers));
}

export async function getBetterAuthUserFromCookieHeader(cookieHeader?: string): Promise<AuthUser | null> {
  const headers = new Headers();
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }
  return getBetterAuthUserFromHeaders(headers);
}

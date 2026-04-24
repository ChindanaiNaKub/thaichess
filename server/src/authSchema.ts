import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  email_verified: integer('email_verified', { mode: 'boolean' }).notNull(),
  twoFactorEnabled: integer('twoFactorEnabled', { mode: 'boolean' }).notNull(),
  image: text('image'),
  username: text('username'),
  username_updated_at: integer('username_updated_at', { mode: 'timestamp' }),
  role: text('role').notNull(),
  fair_play_status: text('fair_play_status').notNull(),
  rated_restricted_at: integer('rated_restricted_at', { mode: 'timestamp' }),
  rated_restriction_note: text('rated_restriction_note'),
  rating: integer('rating').notNull(),
  rated_games: integer('rated_games').notNull(),
  wins: integer('wins').notNull(),
  losses: integer('losses').notNull(),
  draws: integer('draws').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }),
  updated_at: integer('updated_at', { mode: 'timestamp' }),
  last_login_at: integer('last_login_at', { mode: 'timestamp' }),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  account_id: text('account_id').notNull(),
  provider_id: text('provider_id').notNull(),
  access_token: text('access_token'),
  refresh_token: text('refresh_token'),
  access_token_expires_at: integer('access_token_expires_at', { mode: 'timestamp' }),
  refresh_token_expires_at: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  id_token: text('id_token'),
  password: text('password'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const authSessions = sqliteTable('auth_sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  token: text('token').notNull(),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const twoFactor = sqliteTable('twoFactor', {
  id: text('id').primaryKey(),
  secret: text('secret').notNull(),
  backupCodes: text('backupCodes').notNull(),
  userId: text('userId').notNull(),
});

export const authSchema = {
  users,
  accounts,
  auth_sessions: authSessions,
  verifications,
  twoFactor,
};

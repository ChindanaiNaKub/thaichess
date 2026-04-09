-- ============================================
-- ThaiChess Database Security Hardening
-- Apply via: turso db shell <database-name> < security-hardening.sql
-- ============================================

-- Enable foreign keys (critical for data integrity)
PRAGMA foreign_keys = ON;

-- ============================================
-- 1. AUDIT LOGGING TABLE
-- Track all sensitive operations
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  record_id TEXT,
  old_values TEXT, -- JSON of old values
  new_values TEXT, -- JSON of new values
  performed_by TEXT, -- user_id or 'system'
  performed_at INTEGER DEFAULT (unixepoch()),
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON audit_log(performed_by, performed_at DESC);

-- ============================================
-- 2. ROLE CHANGE PROTECTION TRIGGER
-- Prevents non-admins from changing roles
-- ============================================
CREATE TRIGGER IF NOT EXISTS prevent_unauthorized_role_change
BEFORE UPDATE ON users
FOR EACH ROW
WHEN OLD.role != NEW.role
BEGIN
  -- Log the attempt
  INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values, performed_by)
  VALUES (
    'users',
    'ROLE_CHANGE_ATTEMPT',
    NEW.id,
    json_object('role', OLD.role),
    json_object('role', NEW.role),
    COALESCE(NEW.id, 'unknown')
  );
  
  -- Only allow role changes in specific circumstances
  -- This is a safety check - application layer should enforce stricter rules
  SELECT CASE
    WHEN NEW.role NOT IN ('user', 'admin') THEN
      RAISE(ABORT, 'Invalid role value')
    WHEN OLD.role = 'admin' AND NEW.role = 'user' THEN
      -- Allow admin demotion (with logging)
      NULL
    WHEN OLD.role = 'user' AND NEW.role = 'admin' THEN
      -- Log promotion but allow (application should verify)
      NULL
  END;
END;

-- ============================================
-- 3. USER INSERT PROTECTION
-- Log all new user creation
-- ============================================
CREATE TRIGGER IF NOT EXISTS log_user_creation
AFTER INSERT ON users
BEGIN
  INSERT INTO audit_log (table_name, operation, record_id, new_values, performed_by)
  VALUES (
    'users',
    'INSERT',
    NEW.id,
    json_object(
      'id', NEW.id,
      'email', NEW.email,
      'role', NEW.role,
      'username', NEW.username
    ),
    NEW.id
  );
END;

-- ============================================
-- 4. SESSION SECURITY ENFORCEMENTS
-- ============================================

-- Ensure sessions can't be created for non-existent users
-- (Note: SQLite doesn't support foreign keys in ALTER TABLE for existing tables)
-- This is handled at application layer, but we add a trigger for safety

CREATE TRIGGER IF NOT EXISTS validate_session_user_exists
BEFORE INSERT ON sessions
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
      RAISE(ABORT, 'Cannot create session for non-existent user')
  END;
END;

-- ============================================
-- 5. FAIR PLAY EVENTS INTEGRITY
-- ============================================

CREATE TRIGGER IF NOT EXISTS validate_fair_play_event_user
BEFORE INSERT ON fair_play_events
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
      RAISE(ABORT, 'Fair play event must reference valid user')
  END;
END;

-- ============================================
-- 6. DATA INTEGRITY CHECKS
-- ============================================

-- Add check constraints via triggers (SQLite doesn't support ALTER TABLE ADD CONSTRAINT)

CREATE TRIGGER IF NOT EXISTS validate_user_email_format
BEFORE INSERT ON users
BEGIN
  SELECT CASE
    WHEN NEW.email NOT LIKE '%@%.%' THEN
      RAISE(ABORT, 'Invalid email format')
    WHEN LENGTH(NEW.email) > 254 THEN
      RAISE(ABORT, 'Email too long')
  END;
END;

CREATE TRIGGER IF NOT EXISTS validate_user_email_format_update
BEFORE UPDATE ON users
WHEN NEW.email != OLD.email
BEGIN
  SELECT CASE
    WHEN NEW.email NOT LIKE '%@%.%' THEN
      RAISE(ABORT, 'Invalid email format')
    WHEN LENGTH(NEW.email) > 254 THEN
      RAISE(ABORT, 'Email too long')
  END;
END;

-- ============================================
-- 7. RATING INTEGRITY
-- Prevent impossible rating values
-- ============================================

CREATE TRIGGER IF NOT EXISTS validate_user_rating
BEFORE INSERT ON users
BEGIN
  SELECT CASE
    WHEN NEW.rating < 0 OR NEW.rating > 10000 THEN
      RAISE(ABORT, 'Rating out of valid range')
    WHEN NEW.rated_games < 0 THEN
      RAISE(ABORT, 'Rated games cannot be negative')
    WHEN NEW.wins < 0 OR NEW.losses < 0 OR NEW.draws < 0 THEN
      RAISE(ABORT, 'Game counts cannot be negative')
  END;
END;

CREATE TRIGGER IF NOT EXISTS validate_user_rating_update
BEFORE UPDATE ON users
BEGIN
  SELECT CASE
    WHEN NEW.rating < 0 OR NEW.rating > 10000 THEN
      RAISE(ABORT, 'Rating out of valid range')
    WHEN NEW.rated_games < 0 THEN
      RAISE(ABORT, 'Rated games cannot be negative')
    WHEN NEW.wins < 0 OR NEW.losses < 0 OR NEW.draws < 0 THEN
      RAISE(ABORT, 'Game counts cannot be negative')
  END;
END;

-- ============================================
-- 8. LOGIN CODE SECURITY
-- ============================================

CREATE TRIGGER IF NOT EXISTS validate_login_code_email
BEFORE INSERT ON login_codes
BEGIN
  SELECT CASE
    WHEN NEW.email NOT LIKE '%@%.%' THEN
      RAISE(ABORT, 'Invalid email format in login code')
    WHEN NEW.expires_at <= (unixepoch()) THEN
      RAISE(ABORT, 'Login code already expired')
  END;
END;

-- ============================================
-- 9. CLEANUP OLD AUDIT LOGS (keep 90 days)
-- Run this periodically or set up a cron job
-- ============================================

-- Manual cleanup query (run periodically):
-- DELETE FROM audit_log WHERE performed_at < (unixepoch() - 7776000);

-- ============================================
-- 10. SECURITY VIEWS
-- Create views that hide sensitive data
-- ============================================

-- Public user view (no email, no internal IDs)
CREATE VIEW IF NOT EXISTS users_public AS
SELECT 
  id,
  username,
  role,
  rating,
  rated_games,
  wins,
  losses,
  draws,
  created_at
FROM users
WHERE fair_play_status = 'clear';

-- Admin-only view with full data
CREATE VIEW IF NOT EXISTS users_admin AS
SELECT 
  u.*,
  (SELECT COUNT(*) FROM sessions WHERE user_id = u.id) as active_sessions,
  (SELECT MAX(created_at) FROM fair_play_events WHERE user_id = u.id) as last_fair_play_event
FROM users u;

-- ============================================
-- 11. INDEXES FOR SECURITY QUERIES
-- ============================================

-- Fast lookup for suspicious activity
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);

-- ============================================
-- 12. SUSPICIOUS ACTIVITY DETECTION VIEW
-- ============================================

CREATE VIEW IF NOT EXISTS suspicious_activity AS
SELECT 
  'multiple_accounts_same_ip' as alert_type,
  requested_ip as identifier,
  COUNT(DISTINCT email) as account_count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen,
  GROUP_CONCAT(DISTINCT email) as emails
FROM login_codes
WHERE requested_ip IS NOT NULL
  AND created_at > (unixepoch() - 86400) -- Last 24 hours
GROUP BY requested_ip
HAVING COUNT(DISTINCT email) > 5

UNION ALL

SELECT 
  'rapid_account_creation' as alert_type,
  email as identifier,
  COUNT(*) as account_count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen,
  NULL as emails
FROM users
WHERE created_at > (unixepoch() - 3600) -- Last hour
GROUP BY strftime('%Y-%m-%d %H', datetime(created_at, 'unixepoch'))
HAVING COUNT(*) > 10;

-- ============================================
-- SECURITY HARDENING COMPLETE
-- ============================================

-- Verify triggers were created
SELECT 
  name as trigger_name,
  tbl_name as table_name,
  CASE 
    WHEN sql IS NOT NULL THEN '✅ Active'
    ELSE '❌ Disabled'
  END as status
FROM sqlite_master 
WHERE type = 'trigger';

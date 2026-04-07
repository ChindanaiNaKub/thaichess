#!/bin/bash
# ============================================
# Apply Security Hardening to Turso Database
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔒 ThaiChess Database Security Hardening${NC}"
echo "=========================================="

# Check if turso CLI is installed
if ! command -v turso &> /dev/null; then
    echo -e "${RED}❌ Turso CLI not found${NC}"
    echo "Install from: https://docs.turso.tech/reference/turso-cli"
    exit 1
fi

# Get database name from environment or prompt
DB_NAME="${TURSO_DATABASE_NAME:-}"

if [ -z "$DB_NAME" ]; then
    # Try to extract from TURSO_DATABASE_URL
    if [ -n "$TURSO_DATABASE_URL" ]; then
        # Extract database name from URL like "libsql://dbname-username.turso.io"
        DB_NAME=$(echo "$TURSO_DATABASE_URL" | sed -n 's/.*libsql:\/\/\([^-]*\)-.*/\1/p')
    fi
fi

if [ -z "$DB_NAME" ]; then
    echo -e "${YELLOW}⚠️  Could not detect database name from environment${NC}"
    echo "Available databases:"
    turso db list
    echo ""
    read -p "Enter your database name: " DB_NAME
fi

echo -e "${YELLOW}📋 Database: $DB_NAME${NC}"
echo ""

# Check if SQL file exists
SQL_FILE="$(dirname "$0")/security-hardening.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Applying security hardening...${NC}"
echo "This will:"
echo "  ✅ Create audit logging table"
echo "  ✅ Add role change protection triggers"
echo "  ✅ Add user creation logging"
echo "  ✅ Add session validation"
echo "  ✅ Add data integrity checks"
echo "  ✅ Create security views"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Aborted${NC}"
    exit 0
fi

# Apply the SQL
echo -e "${YELLOW}⏳ Applying SQL hardening...${NC}"
if turso db shell "$DB_NAME" < "$SQL_FILE"; then
    echo ""
    echo -e "${GREEN}✅ Security hardening applied successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify triggers are active:"
    echo "     turso db shell $DB_NAME 'SELECT name FROM sqlite_master WHERE type = \"trigger\";'"
    echo ""
    echo "  2. Test role change protection (should fail):"
    echo "     turso db shell $DB_NAME 'UPDATE users SET role = \"admin\" WHERE email = \"test@example.com\";'"
    echo ""
    echo "  3. Check audit log:"
    echo "     turso db shell $DB_NAME 'SELECT * FROM audit_log ORDER BY performed_at DESC LIMIT 10;'"
    echo ""
    echo "  4. Review suspicious activity:"
    echo "     turso db shell $DB_NAME 'SELECT * FROM suspicious_activity;'"
else
    echo ""
    echo -e "${RED}❌ Failed to apply security hardening${NC}"
    exit 1
fi

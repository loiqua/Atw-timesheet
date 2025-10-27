#!/bin/bash

# ========================================
# Generate Secure Secrets for ATW Timesheet
# ========================================
# This script generates cryptographically secure secrets
# for use in production environments.
#
# Usage: ./scripts/generate-secrets.sh
# ========================================

set -e

echo "🔐 Generating secure secrets for ATW Timesheet..."
echo ""
echo "=========================================="
echo "COPY THESE VALUES TO YOUR .env FILE"
echo "=========================================="
echo ""

# Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo "# JWT Authentication"
echo "JWT_SECRET=\"$JWT_SECRET\""
echo ""

# Generate Refresh Token Secret
REFRESH_SECRET=$(openssl rand -base64 32)
echo "REFRESH_TOKEN_SECRET=\"$REFRESH_SECRET\""
echo ""

# Generate Admin Registration Key
ADMIN_KEY=$(openssl rand -base64 32)
echo "# Admin Registration"
echo "ADMIN_REGISTRATION_KEY=\"$ADMIN_KEY\""
echo ""

# Generate Database Password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
echo "# Database"
echo "DB_PASSWORD=\"$DB_PASSWORD\""
echo ""

echo "=========================================="
echo "✅ Secrets generated successfully!"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "1. Copy these values to your .env file immediately"
echo "2. NEVER commit these secrets to version control"
echo "3. Store them securely (password manager recommended)"
echo "4. Rotate secrets every 90 days for production"
echo "5. Use different secrets for dev/staging/production"
echo ""
echo "📝 Next steps:"
echo "1. cp .env.example .env"
echo "2. Update .env with the generated secrets above"
echo "3. Configure SMTP credentials manually"
echo "4. Test the application: npm run dev"
echo ""

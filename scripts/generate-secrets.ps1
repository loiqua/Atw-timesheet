# ========================================
# Generate Secure Secrets for ATW Timesheet
# ========================================
# This script generates cryptographically secure secrets
# for use in production environments.
#
# Usage: .\scripts\generate-secrets.ps1
# ========================================

Write-Host "🔐 Generating secure secrets for ATW Timesheet..." -ForegroundColor Cyan
Write-Host ""
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "COPY THESE VALUES TO YOUR .env FILE" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

# Function to generate random base64 string
function Generate-RandomBase64 {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Generate JWT Secret
$JWT_SECRET = Generate-RandomBase64
Write-Host "# JWT Authentication" -ForegroundColor Green
Write-Host "JWT_SECRET=`"$JWT_SECRET`""
Write-Host ""

# Generate Refresh Token Secret
$REFRESH_SECRET = Generate-RandomBase64
Write-Host "REFRESH_TOKEN_SECRET=`"$REFRESH_SECRET`""
Write-Host ""

# Generate Admin Registration Key
$ADMIN_KEY = Generate-RandomBase64
Write-Host "# Admin Registration" -ForegroundColor Green
Write-Host "ADMIN_REGISTRATION_KEY=`"$ADMIN_KEY`""
Write-Host ""

# Generate Database Password
$DB_PASSWORD = Generate-RandomBase64 -Length 24
$DB_PASSWORD = $DB_PASSWORD -replace '[=+/]', '' | Select-Object -First 20
Write-Host "# Database" -ForegroundColor Green
Write-Host "DB_PASSWORD=`"$DB_PASSWORD`""
Write-Host ""

Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "✅ Secrets generated successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT SECURITY NOTES:" -ForegroundColor Red
Write-Host "1. Copy these values to your .env file immediately"
Write-Host "2. NEVER commit these secrets to version control"
Write-Host "3. Store them securely (password manager recommended)"
Write-Host "4. Rotate secrets every 90 days for production"
Write-Host "5. Use different secrets for dev/staging/production"
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy-Item .env.example .env"
Write-Host "2. Update .env with the generated secrets above"
Write-Host "3. Configure SMTP credentials manually"
Write-Host "4. Test the application: npm run dev"
Write-Host ""

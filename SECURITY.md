# 🔒 Security Guidelines - ATW Timesheet

## 🚨 **CRITICAL: If you found exposed secrets**

If you discovered passwords, API keys, or tokens exposed in the repository history:

### **Immediate Actions Required**

1. **Revoke ALL exposed credentials immediately**
   - Change database passwords
   - Regenerate JWT secrets
   - Update SMTP passwords
   - Rotate all API keys

2. **Clean Git history** (if secrets were committed)
   ```bash
   # Remove sensitive files from history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env docker-compose.yml" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (coordinate with team first!)
   git push origin --force --all
   ```

3. **Verify .gitignore is working**
   ```bash
   git status
   # .env should NOT appear in untracked files
   ```

---

## 🔐 **Environment Variables Setup**

### **1. Initial Setup**

```bash
# Copy the example file
cp .env.example .env

# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For REFRESH_TOKEN_SECRET
openssl rand -base64 32  # For ADMIN_REGISTRATION_KEY
```

### **2. Required Variables**

| Variable | Description | Example | Security Level |
|----------|-------------|---------|----------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | 🔴 **CRITICAL** |
| `DB_PASSWORD` | Database password | Strong random password | 🔴 **CRITICAL** |
| `JWT_SECRET` | JWT signing key | Output of `openssl rand -base64 32` | 🔴 **CRITICAL** |
| `REFRESH_TOKEN_SECRET` | Refresh token key | Output of `openssl rand -base64 32` | 🔴 **CRITICAL** |
| `SMTP_PASS` | Email service password | Your SMTP password | 🔴 **CRITICAL** |
| `ADMIN_REGISTRATION_KEY` | Admin registration key | Output of `openssl rand -base64 32` | 🟡 **HIGH** |
| `SENTRY_DSN` | Sentry monitoring DSN | `https://...@sentry.io/...` | 🟢 **LOW** |

### **3. Never Commit These Files**

```
❌ .env
❌ .env.local
❌ .env.production
❌ .env.development
❌ *.pem
❌ *.key
❌ docker-compose.override.yml (if contains secrets)
```

✅ **Only commit:** `.env.example`

---

## 🛡️ **GitHub Secrets Configuration**

For CI/CD pipelines, configure these secrets in GitHub:

### **Repository Settings → Secrets and variables → Actions**

```
TEST_DB_PASSWORD          # For CI/CD testing
TEST_JWT_SECRET           # For CI/CD testing
TEST_REFRESH_SECRET       # For CI/CD testing
DOCKER_USERNAME           # For Docker Hub
DOCKER_PASSWORD           # For Docker Hub
DEPLOY_HOST               # Production server IP
DEPLOY_USER               # SSH username
DEPLOY_SSH_KEY            # SSH private key
SLACK_WEBHOOK             # Optional: Slack notifications
```

### **How to add secrets:**

```bash
# GitHub UI: Settings → Secrets → New repository secret

# Or using GitHub CLI:
gh secret set TEST_DB_PASSWORD
gh secret set JWT_SECRET
gh secret set DOCKER_USERNAME
```

---

## 🔍 **Security Scanning**

### **1. Install git-secrets (Recommended)**

```bash
# macOS
brew install git-secrets

# Linux
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# Configure in your repo
cd /path/to/atw-timesheet
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'password\s*=\s*.+'
git secrets --add '[A-Za-z0-9]{32,}'
git secrets --add 'smtp.*password'
```

### **2. Pre-commit Hook**

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Prevent committing sensitive files

if git diff --cached --name-only | grep -E '\.env$|\.env\..*$'; then
    echo "❌ ERROR: Attempting to commit .env file!"
    echo "Please remove it from staging: git reset HEAD .env"
    exit 1
fi

# Check for potential secrets
if git diff --cached | grep -iE 'password|secret|api[_-]?key|token'; then
    echo "⚠️  WARNING: Potential secret detected in commit!"
    echo "Please review your changes carefully."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

```bash
chmod +x .git/hooks/pre-commit
```

---

## 📋 **Security Checklist**

### **Before First Commit**
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has no real secrets
- [ ] All secrets use `CHANGE_ME_*` placeholders
- [ ] Pre-commit hooks are installed

### **Before Production Deployment**
- [ ] All environment variables are set
- [ ] Secrets are strong (32+ characters)
- [ ] Database password is complex
- [ ] JWT secrets are randomly generated
- [ ] SMTP credentials are valid
- [ ] GitHub Secrets are configured
- [ ] SSL/TLS certificates are installed
- [ ] Firewall rules are configured
- [ ] Backup strategy is in place

### **Regular Security Maintenance**
- [ ] Rotate secrets every 90 days
- [ ] Review access logs monthly
- [ ] Update dependencies weekly
- [ ] Scan for vulnerabilities with `npm audit`
- [ ] Monitor Sentry for security issues

---

## 🚨 **Incident Response**

### **If secrets are exposed:**

1. **Immediate Actions** (within 1 hour)
   - [ ] Revoke all exposed credentials
   - [ ] Change all related passwords
   - [ ] Notify team members
   - [ ] Check access logs for unauthorized access

2. **Short-term Actions** (within 24 hours)
   - [ ] Clean Git history
   - [ ] Force push cleaned repository
   - [ ] Update all deployment environments
   - [ ] Document the incident

3. **Long-term Actions** (within 1 week)
   - [ ] Review security procedures
   - [ ] Implement additional safeguards
   - [ ] Train team on security best practices
   - [ ] Set up automated secret scanning

---

## 📞 **Security Contacts**

- **Security Issues**: Create a private security advisory on GitHub
- **Urgent Security Matters**: Contact repository maintainers directly
- **General Questions**: Open an issue with `[SECURITY]` prefix

---

## 📚 **Additional Resources**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

**🔒 Security is everyone's responsibility. Stay vigilant!**

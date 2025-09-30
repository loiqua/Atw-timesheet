# 🔐 GitHub Secrets Configuration

## Required Secrets for CI/CD Pipeline

Configure these secrets in your GitHub repository settings:
**Settings → Secrets and variables → Actions → New repository secret**

### 🧪 Testing Secrets (Optional - defaults provided)

| Secret Name | Description | Default Value |
|------------|-------------|---------------|
| `TEST_DB_PASSWORD` | PostgreSQL password for CI tests | `postgres` |
| `TEST_JWT_SECRET` | JWT secret for tests | `test_jwt_secret` |
| `TEST_REFRESH_SECRET` | Refresh token secret for tests | `test_refresh_secret` |

### 🐳 Docker Hub Secrets (Required for deployment)

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `your-dockerhub-username` |
| `DOCKER_PASSWORD` | Docker Hub password or access token | `dckr_pat_xxxxx` |

### 🚀 Deployment Secrets (Required for production)

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DEPLOY_HOST` | Production server hostname/IP | `your-server.com` |
| `DEPLOY_USER` | SSH username for deployment | `deploy` |
| `DEPLOY_SSH_KEY` | Private SSH key for deployment | `-----BEGIN OPENSSH PRIVATE KEY-----` |

### 📢 Notification Secrets (Optional)

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SLACK_WEBHOOK` | Slack webhook URL for notifications | `https://hooks.slack.com/services/...` |

## 🔧 How to Generate Secrets

### SSH Key for Deployment
```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Copy private key to GitHub Secrets (DEPLOY_SSH_KEY)
cat ~/.ssh/github_deploy

# Copy public key to server's authorized_keys
ssh-copy-id -i ~/.ssh/github_deploy.pub deploy@your-server.com
```

### Docker Hub Access Token
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name: `github-actions-atw-timesheet`
4. Copy token to `DOCKER_PASSWORD` secret

### Slack Webhook
1. Go to https://api.slack.com/apps
2. Create new app → Incoming Webhooks
3. Add webhook to workspace
4. Copy webhook URL to `SLACK_WEBHOOK` secret

## ⚠️ Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate secrets regularly** (every 90 days minimum)
3. **Use separate secrets** for test/staging/production
4. **Limit secret access** to necessary workflows only
5. **Use GitHub Environments** for production secrets with approval gates

## 📚 References

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Hub Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [SSH Key Authentication](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

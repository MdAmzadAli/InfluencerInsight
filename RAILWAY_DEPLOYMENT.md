# InstaGenIdeas - Railway Deployment Guide

## Complete Step-by-Step Railway Deployment

### Prerequisites
- GitHub account
- Railway account (railway.app)
- Your own PostgreSQL database URL
- Required API keys

### Step 1: Prepare Repository

1. **Commit Docker Configuration**:
   ```bash
   git add .
   git commit -m "Add Railway deployment configuration"
   git push origin main
   ```

### Step 2: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub (recommended)
3. Verify your email address

### Step 3: Deploy on Railway

#### Option A: Railway CLI (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**:
   ```bash
   railway login
   railway init
   ```

3. **Deploy**:
   ```bash
   railway up
   ```

#### Option B: Web Dashboard

1. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your InstaGenIdeas repository

2. **Railway Auto-Detection**:
   - Railway detects Dockerfile automatically
   - Uses Docker build process

### Step 4: Configure Environment Variables

In Railway dashboard, go to your service → Variables:

```
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string_here
GEMINI_API_KEY=your_gemini_api_key_here
APIFY_API_TOKEN=your_apify_token_here
SESSION_SECRET=your_long_random_secret_string_here
BREVO_API_KEY=your_brevo_api_key_here
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME=InstaGenIdeas
PORT=5000
```

### Step 5: Database Configuration

**Using Your Own Database:**

1. **Ensure Accessibility**:
   - Database must accept connections from Railway's servers
   - Configure firewall if needed (Railway provides IP ranges)

2. **Connection String Format**:
   ```
   postgresql://username:password@host:port/database_name?sslmode=require
   ```

3. **SSL Requirements**:
   - Most cloud databases require SSL
   - Add `?sslmode=require` if your database requires it

### Step 6: Domain and Deployment

1. **Automatic Domain**:
   - Railway provides: `https://your-app-production.up.railway.app`

2. **Custom Domain** (Optional):
   - Go to Settings → Domains
   - Add your custom domain
   - Configure DNS records

### Step 7: Monitor Deployment

1. **Build Process**:
   - Monitor build logs in Railway dashboard
   - Typical build time: 3-5 minutes

2. **Health Check**:
   - Visit: `https://your-app.up.railway.app/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

3. **Application Status**:
   - Check: `https://your-app.up.railway.app/api/health`
   - Includes database connectivity status

### Railway CLI Commands

```bash
# View logs
railway logs

# Open app in browser
railway open

# View service status
railway status

# Set environment variable
railway variables set KEY=value

# Deploy specific branch
railway up --branch main
```

### Environment Variables Setup

#### Required API Keys:

**GEMINI_API_KEY**:
- Visit: https://ai.google.dev/
- Create project → Enable Gemini API → Generate key

**APIFY_API_TOKEN**:
- Sign up: https://apify.com/
- Settings → Integrations → Create API token

**BREVO_API_KEY**:
- Sign up: https://brevo.com/
- SMTP & API → API Keys → Create new key

**SESSION_SECRET**:
- Generate: `openssl rand -base64 32`
- Or any secure random string (32+ characters)

### Railway Advantages for InstaGenIdeas:

1. **Docker Native**: Perfect for your containerized app
2. **Auto-Deploy**: Git push triggers deployment
3. **Generous Free Tier**: $5 monthly credit
4. **PostgreSQL Option**: Can provide managed database if needed
5. **Global Edge**: Fast worldwide deployment
6. **Zero Config**: Works with your existing Docker setup

### Cost Structure:

- **Free Tier**: $5 credit monthly (usually sufficient for testing)
- **Usage-Based**: Pay only for what you use
- **Typical Cost**: $5-15/month for production app

### Troubleshooting:

**Build Failures**:
- Check Dockerfile syntax in Railway logs
- Verify all dependencies in package.json
- Ensure Node.js version compatibility

**Runtime Errors**:
- Check environment variables are set correctly
- Verify database connection string format
- Review application logs: `railway logs`

**Database Issues**:
- Test connection string locally first
- Ensure database accepts external connections
- Check SSL requirements

### Production Optimization:

1. **Scaling**: Railway auto-scales based on traffic
2. **Monitoring**: Built-in metrics and logging
3. **Backups**: Configure database backups separately
4. **CDN**: Consider CloudFlare for static assets
5. **Error Tracking**: Integrate Sentry or similar service

### Auto-Deployment Workflow:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Railway automatically:
# 1. Detects changes
# 2. Builds Docker image
# 3. Deploys new version
# 4. Provides new URL
```

Your InstaGenIdeas app will be live at: `https://your-app-production.up.railway.app`

Railway is ideal for your Docker-based full-stack application with seamless deployment and excellent developer experience!
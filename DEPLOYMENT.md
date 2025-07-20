# InstaGenIdeas - Render Deployment Guide

## Complete Step-by-Step Deployment to Render

### Prerequisites
- GitHub account
- Render account (render.com)
- Your own PostgreSQL database URL
- Required API keys

### Step 1: Prepare Your Repository

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Docker configuration for Render deployment"
   git push origin main
   ```

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Verify your email address

### Step 3: Deploy on Render

1. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select "instagendideas" repository

2. **Configure Deployment**:
   - **Name**: `instagendideas`
   - **Environment**: `Docker`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Dockerfile Path**: `./Dockerfile` (auto-detected)

3. **Configure Build Settings**:
   - **Build Command**: Leave empty (Docker handles this)
   - **Start Command**: Leave empty (Docker handles this)

### Step 4: Set Environment Variables

In Render dashboard, go to your service → Environment:

#### Required Variables:
```
NODE_ENV=production
PORT=5000
DATABASE_URL=your_postgresql_connection_string_here
GEMINI_API_KEY=your_gemini_api_key_here
APIFY_API_TOKEN=your_apify_token_here
SESSION_SECRET=your_long_random_secret_string_here
BREVO_API_KEY=your_brevo_api_key_here
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME=InstaGenIdeas
```

#### How to Get API Keys:

**GEMINI_API_KEY**:
- Go to https://ai.google.dev/
- Create project and enable Gemini API
- Generate API key

**APIFY_API_TOKEN**:
- Sign up at https://apify.com/
- Go to Settings → Integrations
- Create new API token

**BREVO_API_KEY**:
- Sign up at https://brevo.com/
- Go to SMTP & API → API Keys
- Create new API key

**SESSION_SECRET**:
- Generate random string: `openssl rand -base64 32`
- Or use any long random string

### Step 5: Database Setup

Since you're using your own database:

1. **Ensure Database Accessibility**:
   - Database must be accessible from Render's servers
   - Configure firewall to allow Render's IP ranges if needed

2. **Connection String Format**:
   ```
   postgresql://username:password@host:port/database_name
   ```

3. **SSL Configuration**:
   - Most cloud databases require SSL
   - Add `?sslmode=require` to connection string if needed

### Step 6: Deploy

1. **Start Deployment**:
   - Click "Create Web Service"
   - Render will automatically build and deploy

2. **Monitor Deployment**:
   - Watch build logs in Render dashboard
   - Build typically takes 3-5 minutes

3. **Check Health**:
   - Once deployed, visit: `https://your-app.onrender.com/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

### Step 7: Configure Domain (Optional)

1. **Custom Domain**:
   - Go to Settings → Custom Domains
   - Add your domain and configure DNS

2. **SSL Certificate**:
   - Render provides free SSL automatically

### Troubleshooting

#### Common Issues:

**Build Fails**:
- Check Dockerfile syntax
- Ensure all dependencies in package.json
- Review build logs for specific errors

**Database Connection Fails**:
- Verify DATABASE_URL format
- Check database accessibility
- Ensure SSL settings match your database

**App Starts But Crashes**:
- Check environment variables
- Review application logs
- Verify all API keys are valid

**Prisma Issues**:
- Database schema will be automatically pushed on startup
- Check logs for migration errors

#### Monitoring:

- **Health Check**: `https://your-app.onrender.com/api/health`
- **Logs**: Available in Render dashboard
- **Metrics**: View in Render dashboard

### Free Tier Limitations:

- **Sleep Mode**: App sleeps after 15 minutes of inactivity
- **Cold Start**: 30-60 seconds to wake up
- **Build Time**: Limited monthly build minutes
- **Bandwidth**: 100GB per month

### Production Considerations:

1. **Upgrade to Paid Plan**: For production use
2. **Database Backups**: Configure regular backups
3. **Monitoring**: Set up error tracking (Sentry, etc.)
4. **CDN**: Consider CloudFlare for static assets
5. **Environment Security**: Regularly rotate API keys

### Auto-Deployment:

- Render automatically deploys on every push to main branch
- Configure branch protection rules in GitHub for safety

### Cost Estimation:

- **Free Tier**: $0/month (with limitations)
- **Starter Plan**: $7/month (recommended for production)
- **Plus**: CPU and memory upgrades available

Your InstaGenIdeas app will be available at: `https://instagendideas.onrender.com`
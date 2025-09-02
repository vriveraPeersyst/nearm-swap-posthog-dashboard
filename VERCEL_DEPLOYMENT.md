# NEARM Swaps PostHog Dashboard - Vercel Deployment Guide

This guide will help you deploy your NEARM Swaps PostHog Dashboard to Vercel using a **monorepo approach with two separate projects**.

## 🏗️ Architecture Overview

Your deployment will consist of:
- **Frontend (Vite React SPA)**: Static site deployed to Vercel
- **API (Vercel Functions)**: Node.js serverless functions for data processing

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```
3. **GitHub Repository**: Your code should be in a GitHub repository

## 🚀 Deployment Methods

### Method 1: Automated Script (Recommended)

Use the provided deployment script:

```bash
./scripts/deploy-vercel.sh
```

The script will guide you through deploying both frontend and API.

### Method 2: Manual Deployment

#### Step 1: Deploy the API

1. **Navigate to API directory**:
   ```bash
   cd packages/api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

4. **Note the API domain** (e.g., `https://your-api-xyz.vercel.app`)

#### Step 2: Deploy the Frontend

1. **Navigate to frontend directory**:
   ```bash
   cd packages/frontend
   ```

2. **Update API endpoint** (if needed):
   Update any hardcoded API URLs in your frontend code to point to your deployed API domain.

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

### Method 3: GitHub Integration (Recommended for Production)

1. **Connect GitHub to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Connect your GitHub repository

2. **Create Two Projects**:

   **API Project:**
   - **Framework Preset**: Other
   - **Root Directory**: `packages/api`
   - **Build Command**: `npm run build` (optional)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

   **Frontend Project:**
   - **Framework Preset**: Vite
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

## ⚙️ Environment Variables

### API Environment Variables

Set these in your **API Vercel project** settings:

```bash
# PostHog Configuration
POSTHOG_API_KEY=your_posthog_api_key
POSTHOG_PROJECT_ID=your_project_id
POSTHOG_BASE_URL=https://app.posthog.com

# Prices API
PRICES_API_URL=your_prices_api_url

# Event Configuration
SWAP_EVENT_NAME=swap
NETWORK_FILTER=mainnet

# Batch Processing
BATCH_SIZE=10000
MAX_EVENTS=0
VOLUME_SIDE=in

# Token Properties
VOLUME_PROP_IN=intent_amount_in
VOLUME_PROP_OUT=intent_amount_out

# Account Filtering
EXCLUDE_ACCOUNT_ID_PATTERNS=
EXCLUDE_ACCOUNT_IDS=
```

### Frontend Environment Variables

Set these in your **Frontend Vercel project** settings:

```bash
# API Base URL (replace with your API domain)
VITE_API_BASE_URL=https://your-api-xyz.vercel.app

# Other frontend-specific variables
VITE_APP_NAME=NEARM Swaps Dashboard
```

## 🔧 Configuration Files

The following configuration files have been created for your deployment:

### Frontend (`packages/frontend/vercel.json`)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### API (`packages/api/vercel.json`)
```json
{
  "functions": {
    "api/health.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 10
    },
    "api/swap-metrics.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 60
    },
    "api/account-values.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 60
    }
  }
}
```

## 📡 API Endpoints

Your deployed API will have the following endpoints:

- `GET /api/health` - Health check endpoint
- `GET /api/swap-metrics` - Swap analytics data
- `GET /api/account-values` - Account value summaries

## 🔄 Frontend API Integration

Update your frontend to call the deployed API. If you need to update the API base URL, modify your frontend code:

```typescript
// In your frontend API calls
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://your-api-xyz.vercel.app';

// Example API call
const response = await fetch(`${API_BASE_URL}/api/swap-metrics`);
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: 
   - Make sure your API functions include proper CORS headers
   - The provided functions already include CORS support

2. **Environment Variables Not Working**:
   - Ensure variables are set in the correct Vercel project
   - Redeploy after adding new environment variables

3. **Build Failures**:
   - Check that all dependencies are listed in `package.json`
   - Ensure TypeScript configurations are correct

4. **Function Timeouts**:
   - API functions have a 60-second timeout limit
   - Consider optimizing queries for large datasets

### Checking Logs

View function logs in Vercel dashboard:
1. Go to your project dashboard
2. Click on "Functions" tab
3. Select a function to view its logs

## 🔧 Custom Domains (Optional)

To use custom domains:

1. **In Vercel Dashboard**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update CORS settings** if using custom domains

## 📊 Monitoring

- **Vercel Analytics**: Enable in project settings for usage metrics
- **Function Logs**: Monitor in Vercel dashboard
- **PostHog Integration**: Your existing PostHog setup will continue working

## 🔄 Continuous Deployment

With GitHub integration:
- **Automatic Deployments**: Pushes to `main` branch auto-deploy to production
- **Preview Deployments**: Pull requests get preview URLs
- **Branch Deployments**: Configure different branches for staging

## 🚀 Post-Deployment

After successful deployment:

1. **Test all endpoints** using the provided health check
2. **Verify environment variables** are working
3. **Check frontend-API integration**
4. **Set up monitoring and alerts** as needed
5. **Configure custom domains** if required

## 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints individually
4. Check network connectivity and CORS settings

Your NEARM Swaps PostHog Dashboard is now ready for production use on Vercel! 🎉

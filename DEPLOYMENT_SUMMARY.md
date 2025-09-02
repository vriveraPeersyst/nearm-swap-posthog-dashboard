# NEARM Swaps Dashboard - Vercel Deployment Summary

## 🏗️ Deployment Architecture

Based on your project structure, I've set up a **monorepo with two separate Vercel projects** approach:

```
Your Repository (GitHub)
├── Frontend Project (Vercel)
│   ├── Root Directory: packages/frontend
│   ├── Framework: Vite (React)
│   ├── Build Command: npm run build
│   └── Output Directory: dist
│
└── API Project (Vercel)
    ├── Root Directory: packages/api
    ├── Framework: Other (Vercel Functions)
    ├── Functions: api/*.ts
    └── Runtime: Node.js 20.x
```

## 📁 Created Files

### Configuration Files
- `packages/frontend/vercel.json` - Frontend SPA routing configuration
- `packages/api/vercel.json` - API functions configuration  
- `packages/frontend/.env.example` - Environment variables template

### API Functions (Vercel Serverless)
- `packages/api/api/health.ts` - Health check endpoint
- `packages/api/api/swap-metrics.ts` - Swap analytics API (converted from your handler)
- `packages/api/api/account-values.ts` - Account values API

### Deployment Tools
- `scripts/deploy-vercel.sh` - Automated deployment script
- `scripts/verify-deployment.sh` - Post-deployment verification
- `VERCEL_DEPLOYMENT.md` - Comprehensive deployment guide

### Frontend Updates
- `packages/frontend/src/utils/api.ts` - API utility for environment-aware calls
- Updated `App.tsx` to use environment variables for API endpoints

## 🚀 How to Deploy

### Option 1: Automated Script
```bash
./scripts/deploy-vercel.sh
```

### Option 2: Manual CLI Deployment
```bash
# Deploy API
cd packages/api && vercel --prod

# Deploy Frontend  
cd packages/frontend && vercel --prod
```

### Option 3: GitHub Integration (Recommended)
1. Connect your GitHub repo to Vercel
2. Create two projects with the root directories specified above
3. Set environment variables in each project

## 🔧 Environment Variables

### API Project (Required)
```bash
POSTHOG_API_KEY=your_posthog_api_key
POSTHOG_PROJECT_ID=your_project_id
POSTHOG_BASE_URL=https://app.posthog.com
PRICES_API_URL=your_prices_api_url
SWAP_EVENT_NAME=swap
NETWORK_FILTER=mainnet
# ... and other config variables
```

### Frontend Project  
```bash
VITE_API_BASE_URL=https://your-api-domain.vercel.app
```

## 🔄 API Function Mapping

Your Express.js routes have been converted to Vercel Functions:

| Original Route | Vercel Function | Description |
|----------------|----------------|-------------|
| `GET /health` | `/api/health` | Health check |
| `GET /api/swap-metrics` | `/api/swap-metrics` | Swap analytics |
| `GET /api/account-values` | `/api/account-values` | Account values |

## ✅ Verification

After deployment, test your API:
```bash
./scripts/verify-deployment.sh https://your-api-domain.vercel.app
```

## 🎯 Benefits of This Approach

1. **Scalable**: Each function scales independently
2. **Fast**: Edge deployment with global CDN
3. **Cost-effective**: Pay per function execution
4. **Simple**: No server management required
5. **Reliable**: Vercel's infrastructure handles uptime

## 📊 Function Specifications

- **Runtime**: Node.js 20.x
- **Timeout**: 60 seconds for data endpoints, 10 seconds for health
- **Memory**: Default (1024 MB)
- **Region**: Auto (deployed globally)

Your NEARM Swaps Dashboard is now ready for production deployment on Vercel! 🎉

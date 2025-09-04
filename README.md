# NEAR Swaps PostHog Analytics - Monorepo

A comprehensive analytics platform for tracking NEAR blockchain swap activities using PostHog data integration. Features real-time metrics, growth analytics, and an intuitive dashboard with persistent data caching.

## ✨ Key Features

- 📊 **Multi-timeframe Analytics**: 24h, 7d, 30d, and all-time metrics
- 📈 **Growth Tracking**: Period-over-period growth percentages for swaps and volume
- 🎯 **Trading Pairs Analysis**: Top trading pairs by volume and activity
- 💾 **Persistent Data**: localStorage caching for instant page loads
- 🎨 **Modern UI**: Responsive design with Tailwind CSS and Lucide icons
- 🔄 **Manual Refresh**: Load data only when needed, no auto-refresh on page reload
- 🏷️ **Smart Token Display**: Intent tokens formatted with "i" prefix (e.g., `intents:eth` → `iETH`)
- ☁️ **Vercel Deployment**: Ready-to-deploy configuration for Vercel hosting

## 🏗️ Project Structure

```
nearm-swaps-posthog/
├── packages/
│   ├── api/                    # PostHog metrics backend
│   │   ├── api/               # Vercel Functions
│   │   │   ├── health.ts      # Health check endpoint
│   │   │   ├── swap-metrics.ts # Swap analytics API
│   │   │   └── account-values.ts # Account values API
│   │   ├── src/
│   │   │   ├── index.ts        # Main metrics collection script
│   │   │   ├── posthog.ts      # PostHog API integration
│   │   │   ├── prices.ts       # Price data fetching
│   │   │   ├── config.ts       # Configuration management
│   │   │   └── tokenMapping.ts # Token ID mapping
│   │   ├── .env               # Environment variables
│   │   ├── vercel.json        # Vercel configuration
│   │   └── package.json
│   │
│   └── frontend/              # React dashboard
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── utils/         # Utility functions
│       │   ├── App.tsx        # Main app component
│       │   └── types.ts       # TypeScript definitions
│       ├── server.js          # Express API server (for local dev)
│       ├── vercel.json        # Vercel configuration
│       └── package.json
│
├── scripts/
│   └── deploy-vercel.sh       # Automated deployment script
├── package.json               # Root package.json with workspaces
├── VERCEL_DEPLOYMENT.md       # Detailed deployment guide
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostHog account with API access

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/vriveraPeersyst/nearm-swap-posthog-dashboard.git
   cd nearm-swaps-posthog
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp packages/api/.env.sample packages/api/.env
   # Edit packages/api/.env with your PostHog credentials
   ```

3. **Start the development environment:**
   ```bash
   npm run dev
   ```

   This will start:
   - PostHog metrics collection service (packages/api)
   - React frontend at `http://localhost:5173` (packages/frontend)
   - Express API server at `http://localhost:3001` (packages/frontend/server.js)

4. **First time usage:**
   - Navigate to `http://localhost:5173`
   - Click "Load Data" to fetch initial metrics from PostHog
   - Data will be cached for future visits
   - Use "Refresh Data" to get updated metrics
   - Use "Clear Cache" to reset stored data

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vriveraPeersyst/nearm-swap-posthog-dashboard&env=POSTHOG_PROJECT_ID,POSTHOG_API_KEY,POSTHOG_BASE_URL,PRICES_API_URL&envDescription=PostHog%20and%20API%20configuration%20required&envLink=https://github.com/vriveraPeersyst/nearm-swap-posthog-dashboard/blob/main/.env.vercel.template)

**Quick Vercel Setup:**

1. **Prepare for Vercel:**
   ```bash
   ./scripts/prepare-vercel.sh
   ```

2. **Deploy:**
   - Click the Vercel button above, or
   - Connect your GitHub repo to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy!

See [VERCEL.md](VERCEL.md) for detailed Vercel deployment instructions.

### Other Deployment Options

- **Docker:** See [PRODUCTION.md](PRODUCTION.md) for Docker deployment
- **Traditional servers:** Use PM2, systemd, or other process managers
- **Cloud platforms:** Deploy to Heroku, DigitalOcean, AWS, etc.

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Peersyst/nearm-swaps-posthog.git
   cd nearm-swaps-posthog
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp packages/api/.env.sample packages/api/.env
   # Edit packages/api/.env with your PostHog credentials
   ```

3. **Start the development environment:**
   ```bash
   npm run dev
   ```

   This will start:
   - PostHog metrics collection service (packages/api)
   - React frontend at `http://localhost:5173` (packages/frontend)
   - Express API server at `http://localhost:3001` (packages/frontend/server.js)

4. **First time usage:**
   - Navigate to `http://localhost:5173`
   - Click "Load Data" to fetch initial metrics from PostHog
   - Data will be cached for future visits
   - Use "Refresh Data" to get updated metrics
   - Use "Clear Cache" to reset stored data

## 🎯 Current Status

This project is **production-ready** with the following implemented features:

- ✅ **Complete PostHog Integration**: Fetches and processes swap event data
- ✅ **Growth Analytics**: 24h, 7d, and 30d period-over-period growth calculations  
- ✅ **Optimized UI**: Responsive dashboard with persistent data caching
- ✅ **Unified Monorepo**: npm workspaces for streamlined dependency management
- ✅ **TypeScript**: Full type safety across frontend and backend
- ✅ **Production Deployment**: Ready for deployment to any cloud platform

## 📦 Available Scripts

### Root Level Commands

- `npm run dev` - Start both frontend and API in development mode
- `npm run build` - Build both packages for production
- `npm run start` - Start the frontend application
- `npm run metrics` - Run metrics collection once
- `npm run check-data` - Check PostHog data availability
- `npm run clean` - Clean all node_modules and build artifacts

### Package-Specific Commands

#### API Package (`packages/api/`)
- `npm run dev --workspace=api` - Run metrics in watch mode
- `npm run run --workspace=api` - Run metrics collection once
- `npm run build --workspace=api` - Build TypeScript to JavaScript

#### Frontend Package (`packages/frontend/`)
- `npm run dev --workspace=frontend` - Start frontend development server
- `npm run build --workspace=frontend` - Build frontend for production
- `npm run preview --workspace=frontend` - Preview production build

## 🔧 Configuration

### API Configuration (`packages/api/.env`)

```env
# PostHog Configuration
POSTHOG_PROJECT_ID=your_project_id
POSTHOG_API_KEY=your_api_key
POSTHOG_HOST=https://app.posthog.com

# Query Configuration
BATCH_SIZE=1000
MAX_EVENTS=0
VOLUME_SIDE=in

# CoinGecko API (optional)
COINGECKO_API_KEY=your_coingecko_key
```

### Frontend Configuration

The frontend automatically connects to the API server running on port 3001. No additional configuration needed.

## 📊 Features

### PostHog Metrics Collection
- **Multi-Period Analytics**: Track swap counts and volumes across 24h, 7d, 30d, and all-time periods
- **Growth Metrics**: Period-over-period growth percentages for all timeframes (24h vs previous 24h, 7d vs previous 7d, etc.)
- **Trading Pairs Analysis**: Comprehensive trading pair metrics with volume and activity tracking
- **Intent Token Formatting**: Automatic "i" prefix for intent tokens (e.g., `intents:eth` → `iETH`)
- **Data Quality Monitoring**: Track unmapped tokens, missing prices, and validation issues

### Dashboard Features
- **Persistent Data Storage**: Uses localStorage to cache data across browser sessions
- **Manual Data Loading**: Users control when to load/refresh data - no automatic page reload fetching  
- **Real-time Updates**: Manual refresh button to fetch the latest metrics when needed
- **Responsive Design**: Mobile-friendly interface optimized for all screen sizes
- **Compact Tables**: Optimized column layouts ensuring all data is visible without horizontal scrolling
- **Growth Indicators**: Visual trending arrows and percentage displays for all time periods
- **Clear Cache Option**: Debug functionality to reset cached data

## 🏭 Production Deployment

### Build for Production

```bash
npm run build
```

### Deploy Frontend

The built frontend will be in `packages/frontend/dist/`. You can deploy this to any static hosting service like:

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

### Deploy API

The API can be deployed as a Node.js application to:

- Heroku
- AWS EC2/ECS
- Google Cloud Run
- DigitalOcean App Platform

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

```env
NODE_ENV=production
POSTHOG_PROJECT_ID=your_production_project_id
POSTHOG_API_KEY=your_production_api_key
POSTHOG_HOST=https://app.posthog.com
```

## 🔄 Data Flow

1. **PostHog Integration**: The API package connects to PostHog to fetch swap event data
2. **Price Integration**: Fetches token prices from internal APIs and CoinGecko as fallback  
3. **Growth Calculations**: Computes period-over-period growth metrics (24h vs previous 24h, 7d vs previous 7d, 30d vs previous 30d)
4. **Data Processing**: Calculates metrics, aggregates data by time periods and trading pairs
5. **API Serving**: Express server provides REST API endpoints for the frontend
6. **Dashboard Display**: React frontend fetches data on user request and caches to localStorage
7. **Persistent Storage**: Data persists across browser sessions for instant loading

## 📈 API Response Format

### GET /api/swap-metrics

Returns comprehensive swap analytics with the following structure:

```json
{
  "sideValued": "in",
  "allTime": {
    "totalSwaps": 3119,
    "totalVolumeUSD": 735113.95
  },
  "last24h": {
    "totalSwaps": 126,
    "totalVolumeUSD": 40078.72,
    "swapGrowthPercent": -0.79,
    "volumeGrowthPercent": 128.97
  },
  "last7d": {
    "totalSwaps": 1077,
    "totalVolumeUSD": 195596.95,
    "swapGrowthPercent": 85.37,
    "volumeGrowthPercent": 160.71
  },
  "last30d": {
    "totalSwaps": 2853,
    "totalVolumeUSD": 620515.28,
    "swapGrowthPercent": 972.56,
    "volumeGrowthPercent": 441.47
  },
  "topTradingPairs": {
    "allTime": [...],
    "last24h": [...]
  },
  "notes": {
    "unmappedIntentTokenIds": [],
    "priceIdMissing": [],
    "badAmounts": 0
  }
}
```

## 📈 API Endpoints

- `GET /api/swap-metrics` - Get comprehensive swap analytics
- `GET /health` - Health check endpoint

## 🛠️ Development

### Adding New Features

1. **Backend Changes**: Modify files in `packages/api/src/`
2. **Frontend Changes**: Update components in `packages/frontend/src/`
3. **Shared Types**: Update TypeScript interfaces in `packages/frontend/src/types.ts`

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier formatting (recommended)

### Testing

Run the data availability check to ensure PostHog connection:

```bash
npm run check-data
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

1. **PostHog Connection Failed**
   - Check your API credentials in `packages/api/.env`
   - Verify PostHog project ID and API key
   - Ensure network connectivity to PostHog

2. **Frontend Not Loading Data**
   - Check if the API server is running on port 3001
   - Verify CORS settings in `packages/frontend/server.js`
   - Check browser console for network errors
   - Try clicking "Load Data" button if no cached data exists

3. **Build Failures**
   - Clear all dependencies: `npm run clean && npm install`
   - Check TypeScript errors: `npm run build`
   - Ensure unified dependency management is working correctly

4. **Growth Percentages Not Showing**
   - Ensure sufficient historical data exists for comparison periods
   - Check API response includes growth percentage fields
   - Verify data is not null in the frontend components

5. **Table Columns Overlapping**
   - Clear browser cache and localStorage
   - Check responsive design at different screen sizes
   - Verify Tailwind CSS is loading correctly

### Getting Help

- Check the logs: Both API and frontend provide detailed console output
- Use the health check endpoint: `curl http://localhost:3001/health`
- Run data availability check: `npm run check-data`

## 🔮 Roadmap

- [x] ✅ Multi-timeframe growth analytics (24h, 7d, 30d)
- [x] ✅ Persistent data caching with localStorage
- [x] ✅ Intent token formatting (`intents:eth` → `iETH`)
- [x] ✅ Unified dependency management with npm workspaces
- [x] ✅ Responsive table layouts with optimized columns
- [x] ✅ Manual data loading (no auto-refresh on page reload)
- [ ] 📊 Historical data visualization with charts
- [ ] 🔄 Real-time WebSocket updates
- [ ] 🔍 Advanced filtering and search
- [ ] 📤 Export functionality (CSV, JSON)
- [ ] 🚨 Alert system for anomalies
- [ ] ⛓️ Multi-chain support
- [ ] 📱 Progressive Web App (PWA) support
- [ ] 🔐 Authentication and user management

## 🚀 Deployment

### Vercel Deployment (Recommended)

This project is optimized for Vercel deployment with separate frontend and API projects.

#### Quick Deploy
```bash
# Use the automated deployment script
./scripts/deploy-vercel.sh
```

#### Manual Deploy
1. **Deploy API**: `cd packages/api && vercel --prod`
2. **Deploy Frontend**: `cd packages/frontend && vercel --prod`
3. **Update API URL**: Set `VITE_API_BASE_URL` in frontend environment variables

For detailed deployment instructions, see **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)**

### Local Development
```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

## 🏗️ Technical Architecture

### Frontend (React + TypeScript)
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **localStorage**: Client-side data persistence
- **Vercel Functions**: Serverless API endpoints

### Backend (Node.js + TypeScript)
- **PostHog SDK**: Direct API integration
- **Decimal.js**: Precise decimal arithmetic for financial calculations
- **Zod**: Schema validation
- **Axios**: HTTP client for external APIs
- **CoinGecko**: Fallback price data source

### Monorepo Management
- **npm workspaces**: Unified dependency management
- **Concurrent execution**: Development server orchestration
- **Shared TypeScript**: Type safety across packages

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# NEAR Swaps Analytics Frontend

A React-based dashboard for visualizing PostHog swap metrics data from the NEAR ecosystem.

## Features

- **Time-based Metrics**: View swap counts and volumes across different time periods (24h, 7d, 30d, all-time)
- **Growth Tracking**: Monitor 24-hour growth percentages for swaps and volume
- **Trading Pairs Analysis**: Top 30 trading pairs with detailed volume metrics for each time period
- **Fee Swaps Analytics**: Separate view excluding deposits/withdrawals (native ↔ intent conversions)
- **Top Swappers Leaderboard**: Track top accounts by volume, swap count, and fee-generating activity
- **Real-time Data**: Refresh button to fetch the latest metrics from your PostHog backend
- **Persistent Cache**: localStorage caching for instant page loads
- **Clean UI**: Modern, responsive design with Tailwind CSS and Lucide icons

## Screenshots

The dashboard displays:

1. **Overview Cards**: Quick metrics for different time periods
2. **Summary Table**: Comprehensive time-based breakdown with growth indicators
3. **Trading Pairs Tables**: 
   - Top pairs by all-time volume
   - Most active pairs in the last 24 hours
   - Most active pairs in the last 7 days
   - Most active pairs in the last 30 days
4. **Fee Swaps Section**: 
   - Summary cards with fee swap metrics
   - Fee swap trading pairs by period
5. **Top Swappers Section**:
   - By all-time volume
   - By swap count
   - By fee-generating volume
   - Top swappers for 24h, 7d, 30d periods
6. **Data Quality Notes**: Information about unmapped tokens and data issues

## Project Structure

```
posthog-swaps-frontend/
├── src/
│   ├── components/
│   │   ├── MetricsCard.tsx        # Time period overview cards
│   │   ├── SummaryTable.tsx       # Time-based metrics table
│   │   ├── TradingPairsTable.tsx  # Trading pairs analysis
│   │   ├── TopSwappersTable.tsx   # Top swappers leaderboard
│   │   ├── TopAccountsTable.tsx   # Top accounts by value
│   │   └── AccountValuesCard.tsx  # Account values display
│   ├── utils/
│   │   └── api.ts                 # API client utilities
│   ├── types.ts                   # TypeScript interfaces
│   ├── App.tsx                    # Main application component
│   └── index.css                  # Tailwind CSS setup
├── server.js                      # Express API server
└── package.json
```

## Setup Instructions

### Prerequisites

Make sure you have the PostHog metrics backend running at `../posthog-swaps-metrics/` with:
- Valid `.env` file with PostHog credentials
- `npm install` completed
- `npm run run` working properly

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```
   
   This will start both:
   - Frontend dev server at `http://localhost:5173`
   - Backend API server at `http://localhost:3001`

### Alternative: Run separately

If you prefer to run the frontend and backend separately:

1. **Start the backend API:**
   ```bash
   npm run server
   ```

2. **In another terminal, start the frontend:**
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET http://localhost:3001/api/swap-metrics` - Fetch current swap metrics
- `GET http://localhost:3001/health` - Health check endpoint

## Data Flow

1. Frontend requests data from the Express API server
2. API server executes the PostHog metrics script in the sibling directory
3. Script output (JSON) is parsed and returned to the frontend
4. Frontend displays the data in various table and card formats

## Token Name Formatting

The frontend automatically formats token identifiers for better readability:

- `intents:usdc` → `USDC`
- `near-native` → `NEAR`
- `eth.bridge.near` → `ETH`
- Long contract addresses → Truncated format (`abc123...def456`)

## Development

### Adding New Components

Create new components in `src/components/` and import them in `App.tsx`.

### Modifying the API

Update `server.js` to add new endpoints or modify data processing.

### Styling

The project uses Tailwind CSS. Add utility classes directly to JSX elements.

## Production Build

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Preview the production build:**
   ```bash
   npm run preview
   ```

## Troubleshooting

### API Connection Issues

- Ensure the backend metrics script can run successfully: `cd ../posthog-swaps-metrics && npm run run`
- Check that the `.env` file exists in the metrics directory
- Verify PostHog credentials are correct

### Frontend Issues

- Clear browser cache and reload
- Check browser console for JavaScript errors
- Ensure all dependencies are installed: `npm install`

### CORS Issues

The Express server includes CORS middleware to allow frontend connections from `localhost:5173`.

## Future Enhancements

- Real-time updates with WebSocket connections
- Historical data charts and graphs
- Advanced filtering and search capabilities
- Export functionality for data analysis
- Mobile-responsive optimizations

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

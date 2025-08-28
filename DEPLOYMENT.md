# Deployment Guide

This guide covers how to deploy the NEAR Swaps PostHog Analytics monorepo to various platforms.

## 🚀 Single-Click Deployment Options

### Vercel (Recommended for Frontend + API)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Peersyst/nearm-swaps-posthog)

1. **Fork this repository** to your GitHub account
2. **Connect to Vercel** and import your forked repository
3. **Configure build settings:**
   ```
   Build Command: npm run build:frontend
   Output Directory: packages/frontend/dist
   Install Command: npm install
   ```
4. **Set environment variables:**
   ```
   POSTHOG_PROJECT_ID=your_project_id
   POSTHOG_API_KEY=your_api_key
   POSTHOG_HOST=https://app.posthog.com
   ```
5. **Deploy!**

### Netlify

1. **Connect your repository** to Netlify
2. **Configure build settings:**
   ```
   Build command: npm run build:frontend
   Publish directory: packages/frontend/dist
   ```
3. **Set environment variables** in Netlify dashboard
4. **Deploy!**

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/[template-id])

1. **Click the Railway button** above
2. **Set environment variables**
3. **Deploy!**

## 🛠️ Manual Deployment

### Prerequisites

- Node.js 18+ 
- npm 8+
- Environment variables configured

### Build for Production

```bash
# Install dependencies
npm install

# Build both packages
npm run build

# Test the production build
cd packages/frontend
npm run preview
```

### Deploy to VPS/Cloud Server

#### 1. Server Setup

```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/Peersyst/nearm-swaps-posthog.git
cd nearm-swaps-posthog

# Install dependencies
npm install

# Build for production
npm run build

# Create environment file
cp packages/api/.env.sample packages/api/.env
# Edit packages/api/.env with your values
```

#### 3. Process Management with PM2

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'nearm-swaps-frontend',
      cwd: 'packages/frontend',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 4. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Deployment

#### 1. Create Dockerfile

```dockerfile
# packages/frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/api/package*.json ./packages/api/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build:frontend

# Expose port
EXPOSE 3000 3001

# Start application
CMD ["npm", "run", "start"]
```

#### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - POSTHOG_PROJECT_ID=${POSTHOG_PROJECT_ID}
      - POSTHOG_API_KEY=${POSTHOG_API_KEY}
      - POSTHOG_HOST=${POSTHOG_HOST}
    restart: unless-stopped
```

#### 3. Deploy with Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

## ☁️ Cloud Platform Specific

### AWS

#### Using AWS App Runner

1. **Create App Runner service**
2. **Connect to your repository**
3. **Configure build settings:**
   ```
   Build command: npm run build
   Start command: npm run start
   Port: 3000
   ```
4. **Set environment variables**

#### Using AWS ECS + Fargate

1. **Build and push Docker image to ECR**
2. **Create ECS task definition**
3. **Create ECS service**
4. **Configure Application Load Balancer**

### Google Cloud

#### Using Cloud Run

```bash
# Build and deploy
gcloud run deploy nearm-swaps \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars POSTHOG_PROJECT_ID=your_id,POSTHOG_API_KEY=your_key
```

### Azure

#### Using Azure Container Instances

```bash
# Deploy container
az container create \
  --resource-group myResourceGroup \
  --name nearm-swaps \
  --image your-registry/nearm-swaps:latest \
  --ports 3000 3001 \
  --environment-variables \
    POSTHOG_PROJECT_ID=your_id \
    POSTHOG_API_KEY=your_key
```

## 🔧 Environment Variables

### Required Variables

```env
POSTHOG_PROJECT_ID=your_project_id
POSTHOG_API_KEY=your_api_key
POSTHOG_HOST=https://app.posthog.com
```

### Optional Variables

```env
# Query configuration
BATCH_SIZE=1000
MAX_EVENTS=0
VOLUME_SIDE=in

# CoinGecko API (for backup price data)
COINGECKO_API_KEY=your_coingecko_key

# Server configuration
PORT=3000
API_PORT=3001
NODE_ENV=production
```

## 📊 Monitoring and Logging

### Health Checks

The application provides health check endpoints:

- Frontend: `http://your-domain/`
- API: `http://your-domain:3001/health`

### Logging

Configure logging for production:

```javascript
// Add to server.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Metrics and Alerts

Set up monitoring for:

- Application uptime
- API response times
- Error rates
- PostHog connection status

## 🚨 Troubleshooting

### Common Issues

1. **Build failures**: Check Node.js version and clear npm cache
2. **API connection issues**: Verify PostHog credentials
3. **CORS errors**: Check server configuration
4. **Memory issues**: Increase container memory limits

### Support

- Check application logs
- Verify environment variables
- Test PostHog connection: `npm run check-data`
- Monitor health endpoints

## 📈 Performance Optimization

### Production Optimizations

1. **Enable gzip compression**
2. **Set up CDN for static assets**
3. **Configure caching headers**
4. **Use environment-specific configurations**
5. **Monitor and optimize bundle size**

### Scaling Considerations

1. **Horizontal scaling**: Multiple container instances
2. **Database caching**: Redis for frequently accessed data
3. **API rate limiting**: Prevent abuse
4. **Background jobs**: Queue system for heavy computations

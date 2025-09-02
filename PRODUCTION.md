# Production Deployment Guide

This guide provides comprehensive instructions for deploying the NEAR Swaps PostHog Analytics application to production.

## 🚀 Quick Production Deployment

### Option 1: Docker Deployment (Recommended)

1. **Build the Docker image:**
   ```bash
   npm run docker:build
   ```

2. **Create production environment file:**
   ```bash
   cp packages/api/.env.production.template packages/api/.env.production
   # Edit .env.production with your production values
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Option 2: Traditional Server Deployment

1. **Prepare production environment:**
   ```bash
   npm run prod:setup
   ```

2. **Start production server:**
   ```bash
   npm run start:prod
   ```

## 🛡️ Security Checklist

- [ ] ✅ Environment variables are properly configured
- [ ] ✅ `.env` files are not committed to version control
- [ ] ✅ Production API keys are different from development
- [ ] ✅ CORS is properly configured for your domain
- [ ] ✅ HTTPS is enabled (reverse proxy/load balancer level)
- [ ] ✅ Health check endpoint is accessible
- [ ] ✅ Error handling and logging are configured

## 🌐 Platform-Specific Deployments

### Vercel

1. **Configure build settings:**
   - Build Command: `npm run build:frontend`
   - Output Directory: `packages/frontend/dist`
   - Install Command: `npm install`

2. **Environment variables:**
   Set these in Vercel dashboard:
   ```
   NODE_ENV=production
   POSTHOG_PROJECT_ID=your_project_id
   POSTHOG_API_KEY=your_api_key
   POSTHOG_BASE_URL=https://app.posthog.com
   PRICES_API_URL=your_prices_api_url
   ```

3. **Deploy:**
   ```bash
   npx vercel --prod
   ```

### Heroku

1. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set POSTHOG_PROJECT_ID=your_project_id
   heroku config:set POSTHOG_API_KEY=your_api_key
   # ... other variables
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

### DigitalOcean App Platform

1. **Create app spec file:**
   ```yaml
   name: nearm-swaps-posthog
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/nearm-swaps-posthog
       branch: main
     run_command: npm run start:prod
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: POSTHOG_PROJECT_ID
       value: your_project_id
     # ... other environment variables
   ```

2. **Deploy via CLI:**
   ```bash
   doctl apps create --spec app.yaml
   ```

### AWS EC2 with PM2

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 ecosystem file:**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'nearm-swaps-posthog',
       script: 'packages/frontend/server.js',
       env: {
         NODE_ENV: 'development'
       },
       env_production: {
         NODE_ENV: 'production',
         PORT: 3001
       }
     }]
   };
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

### Google Cloud Run

1. **Build and push to Container Registry:**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/nearm-swaps-posthog
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy --image gcr.io/PROJECT_ID/nearm-swaps-posthog --platform managed
   ```

## 📊 Monitoring and Observability

### Health Checks

The application includes a health check endpoint at `/health`:

```bash
curl http://your-domain.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Logging

- All API requests are logged in production
- Errors are captured and logged with timestamps
- Use external logging services like Loggly, Papertrail, or CloudWatch for production

### Performance Monitoring

Consider integrating:
- **Sentry** for error tracking
- **New Relic** or **DataDog** for performance monitoring
- **Prometheus + Grafana** for custom metrics

## 🔧 Configuration Management

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production) | ✅ |
| `POSTHOG_PROJECT_ID` | PostHog project ID | ✅ |
| `POSTHOG_API_KEY` | PostHog API key | ✅ |
| `POSTHOG_BASE_URL` | PostHog instance URL | ✅ |
| `PRICES_API_URL` | Internal prices API URL | ✅ |
| `COINGECKO_API_KEY` | CoinGecko API key (fallback) | ⚠️ |
| `PORT` | Server port (default: 3001) | ❌ |

### Performance Tuning

For high-traffic production environments:

1. **Adjust batch sizes:**
   ```bash
   BATCH_SIZE=2000
   ```

2. **Enable connection pooling:**
   ```bash
   # Add to your environment
   UV_THREADPOOL_SIZE=16
   ```

3. **Configure memory limits:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096"
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. **Memory issues:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=8192" npm run start:prod
   ```

3. **PostHog connection failed:**
   - Verify API credentials
   - Check network connectivity
   - Ensure PostHog instance is accessible

4. **Build failures:**
   ```bash
   npm run clean
   npm install
   npm run build
   ```

### Debugging Production Issues

1. **Check logs:**
   ```bash
   # PM2
   pm2 logs nearm-swaps-posthog

   # Docker
   docker logs container_name

   # Heroku
   heroku logs --tail
   ```

2. **Test health endpoint:**
   ```bash
   curl -f http://localhost:3001/health || echo "Health check failed"
   ```

3. **Validate environment:**
   ```bash
   npm run check-data
   ```

## 🔄 Updates and Maintenance

### Zero-Downtime Deployment

1. **With PM2:**
   ```bash
   pm2 reload nearm-swaps-posthog
   ```

2. **With Docker:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --no-deps web
   ```

### Database Migrations

Currently, this application doesn't use a traditional database, but if you add one:

1. Run migrations before deployment
2. Use feature flags for breaking changes
3. Test migrations on staging first

### Backup Strategy

- Environment variables should be backed up securely
- Consider backing up cached data if using Redis
- PostHog data is handled by PostHog's infrastructure

## 📈 Scaling Considerations

### Horizontal Scaling

The application is stateless and can be horizontally scaled:

1. **Load balancer configuration:**
   ```nginx
   upstream nearm_app {
       server app1:3001;
       server app2:3001;
       server app3:3001;
   }
   ```

2. **Docker Swarm:**
   ```bash
   docker service create --replicas 3 nearm-swaps-posthog
   ```

3. **Kubernetes:**
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: nearm-swaps-posthog
   spec:
     replicas: 3
   ```

### Caching Strategy

Consider adding Redis for:
- API response caching
- Rate limiting
- Session storage (if adding auth)

### Database Considerations

If adding persistent storage:
- Use PostgreSQL for complex queries
- Consider read replicas for analytics
- Implement connection pooling

## 🔐 Security Best Practices

1. **Environment Security:**
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate API keys regularly
   - Use least-privilege principle

2. **Network Security:**
   - Enable HTTPS everywhere
   - Configure proper CORS policies
   - Use Web Application Firewall (WAF)

3. **Application Security:**
   - Keep dependencies updated
   - Run security audits regularly
   - Implement rate limiting

4. **Infrastructure Security:**
   - Keep OS and runtime updated
   - Use container scanning
   - Implement network segmentation

## 📞 Support

For production support:
1. Check this deployment guide
2. Review application logs
3. Test health endpoints
4. Run security audits
5. Contact the development team with specific error details

## 📚 Additional Resources

- [PostHog Documentation](https://posthog.com/docs)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [PM2 Production Guide](https://pm2.keymetrics.io/docs/usage/deployment/)

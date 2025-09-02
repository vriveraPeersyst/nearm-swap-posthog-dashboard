#!/bin/bash

# NEARM Swaps PostHog Dashboard - Vercel Deployment Script
# This script prepares and deploys both frontend and API to Vercel

set -e

echo "🚀 NEARM Swaps PostHog Dashboard - Vercel Deployment"
echo "=================================================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Function to deploy frontend
deploy_frontend() {
    echo "📱 Deploying Frontend to Vercel..."
    cd packages/frontend
    
    # Install dependencies
    echo "📦 Installing frontend dependencies..."
    npm install
    
    # Build the project
    echo "🔨 Building frontend..."
    npm run build
    
    # Deploy to Vercel
    echo "🚀 Deploying frontend..."
    vercel --prod
    
    cd ../..
    echo "✅ Frontend deployed successfully!"
}

# Function to deploy API
deploy_api() {
    echo "🔧 Deploying API to Vercel..."
    cd packages/api
    
    # Install dependencies
    echo "📦 Installing API dependencies..."
    npm install
    
    # Deploy to Vercel
    echo "🚀 Deploying API..."
    vercel --prod
    
    cd ../..
    echo "✅ API deployed successfully!"
}

# Main deployment flow
echo "📋 Choose deployment option:"
echo "1. Deploy Frontend only"
echo "2. Deploy API only"
echo "3. Deploy both Frontend and API"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        deploy_frontend
        ;;
    2)
        deploy_api
        ;;
    3)
        deploy_api
        echo ""
        deploy_frontend
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend Vercel deployment to point API calls to your API domain"
echo "2. Set up environment variables in both Vercel projects"
echo "3. Configure custom domains if needed"
echo ""
echo "🔧 Environment Variables needed for API:"
echo "- POSTHOG_API_KEY"
echo "- POSTHOG_PROJECT_ID"
echo "- POSTHOG_BASE_URL"
echo "- PRICES_API_URL"
echo "- SWAP_EVENT_NAME"
echo "- NETWORK_FILTER"
echo "- And other config variables from packages/api/src/config.ts"

#!/bin/bash

# Vercel Deployment Verification Script
# Tests the deployed API endpoints

set -e

echo "🔍 Vercel Deployment Verification"
echo "================================="

# Check if API URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your API base URL"
    echo "Usage: ./scripts/verify-deployment.sh https://your-api-domain.vercel.app"
    exit 1
fi

API_BASE_URL="$1"
echo "🌐 Testing API at: $API_BASE_URL"
echo ""

# Test health endpoint
echo "🩺 Testing health endpoint..."
health_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_BASE_URL/api/health")
health_status=$(echo $health_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
health_body=$(echo $health_response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$health_status" -eq 200 ]; then
    echo "✅ Health check passed"
    echo "   Response: $health_body"
else
    echo "❌ Health check failed (Status: $health_status)"
    echo "   Response: $health_body"
fi

echo ""

# Test swap-metrics endpoint (with timeout due to potential long processing)
echo "📊 Testing swap-metrics endpoint..."
echo "   ⏱️  This may take up to 60 seconds..."

swap_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -m 60 "$API_BASE_URL/api/swap-metrics")
swap_status=$(echo $swap_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
swap_body=$(echo $swap_response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$swap_status" -eq 200 ]; then
    echo "✅ Swap metrics endpoint working"
    echo "   Sample response: $(echo $swap_body | jq -r '.summary.totalSwaps // "N/A"') total swaps"
else
    echo "❌ Swap metrics endpoint failed (Status: $swap_status)"
    echo "   Response: $swap_body"
fi

echo ""

# Test account-values endpoint
echo "👥 Testing account-values endpoint..."
echo "   ⏱️  This may take up to 60 seconds..."

account_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -m 60 "$API_BASE_URL/api/account-values")
account_status=$(echo $account_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
account_body=$(echo $account_response | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$account_status" -eq 200 ]; then
    echo "✅ Account values endpoint working"
    echo "   Sample response: $(echo $account_body | jq -r '.total_unique_accounts // "N/A"') unique accounts"
else
    echo "❌ Account values endpoint failed (Status: $account_status)"
    echo "   Response: $account_body"
fi

echo ""
echo "🎉 Verification complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend's VITE_API_BASE_URL to: $API_BASE_URL"
echo "2. Redeploy your frontend if needed"
echo "3. Test the frontend dashboard in your browser"

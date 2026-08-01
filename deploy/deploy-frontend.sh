#!/usr/bin/env bash
# Build the frontend against the real API domain, sync it to S3, and invalidate CloudFront.
# Run from your local machine (Git Bash).
#
# Usage:
#   ./deploy-frontend.sh https://api.yourdomain.com
#
# Requires:
#   - AWS CLI configured
#   - S3 bucket already created (see AWS_DEPLOY_RUNBOOK.md step 7)
#   - CloudFront distribution already created, its ID set in DISTRIBUTION_ID below (or pass as $2)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

BUCKET="lotus-crm-frontend"
DISTRIBUTION_ID="${2:-}"   # fill in your CloudFront distribution ID here, or pass as 2nd arg

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <api-base-url e.g. https://api.yourdomain.com> [cloudfront-distribution-id]"
  exit 1
fi

API_BASE_URL="$1/api"

echo "==> Building frontend with VITE_API_BASE_URL=$API_BASE_URL"
(cd "$FRONTEND_DIR" && VITE_API_BASE_URL="$API_BASE_URL" npm run build)

echo "==> Syncing dist/ to s3://$BUCKET"
aws s3 sync "$FRONTEND_DIR/dist" "s3://$BUCKET" --delete

if [ -n "$DISTRIBUTION_ID" ]; then
  echo "==> Invalidating CloudFront cache ($DISTRIBUTION_ID)"
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths '/*'
else
  echo "==> No CloudFront distribution ID set — skipping cache invalidation."
  echo "    Set DISTRIBUTION_ID in this script or pass it as the 2nd argument."
fi

echo "==> Frontend deployed."

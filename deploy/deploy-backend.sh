#!/usr/bin/env bash
# Build the backend Docker image, push to ECR, and (re)deploy it on one or more backend EC2
# instances over SSH — one instance at a time, deregistering/re-registering it from the ALB
# target group around the restart so the app never actually goes down. Run this from your
# local machine (Git Bash), not on the EC2 instance.
#
# Usage:
#   TARGET_GROUP_ARN=arn:aws:elasticloadbalancing:...:targetgroup/lotus-backend-tg/xxxx \
#   ./deploy-backend.sh <ip>:<instance-id> [<ip>:<instance-id> ...]
#
# TARGET_GROUP_ARN is optional — omit it (and the ":<instance-id>" suffixes, plain IPs are
# fine) to just update every instance directly with no ALB draining, e.g. for a single-instance
# dev/test box.
#
# Requires:
#   - AWS CLI configured (aws sts get-caller-identity works)
#   - deploy/.env.production filled in (see .env.production.example)
#   - SSH key at ../lotus-key.pem (adjust SSH_KEY below if different)
#   - An ECR repo named lotus-crm-backend (created once via:
#       aws ecr create-repository --repository-name lotus-crm-backend)
#   - Each backend EC2 instance has an IAM instance profile with AmazonEC2ContainerRegistryReadOnly
#     attached, so `aws ecr get-login-password` works on the instance without stored credentials.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
ENV_FILE="$SCRIPT_DIR/.env.production"
SSH_KEY="$SCRIPT_DIR/../lotus-key.pem"
SSH_USER="ubuntu"
REPO_NAME="lotus-crm-backend"
TARGET_GROUP_ARN="${TARGET_GROUP_ARN:-}"

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <ip>[:<instance-id>] [<ip>[:<instance-id>] ...]"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — copy .env.production.example and fill in real values first."
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGION="$(aws configure get region)"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}"
# Tag with a timestamp (not just :latest) so a bad deploy can be rolled back to the previous
# tag immediately instead of needing a rebuild — see rollback note at the bottom.
TAG="$(date +%Y%m%d%H%M%S)"

echo "==> Logging in to ECR ($ECR_URI)"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "==> Building image (tag: $TAG)"
docker build -t "$REPO_NAME:$TAG" "$BACKEND_DIR"

echo "==> Tagging + pushing to ECR ($TAG and latest)"
docker tag "$REPO_NAME:$TAG" "$ECR_URI:$TAG"
docker tag "$REPO_NAME:$TAG" "$ECR_URI:latest"
docker push "$ECR_URI:$TAG"
docker push "$ECR_URI:latest"

wait_for_target_health() {
  local instance_id="$1" want_state="$2"
  echo "    waiting for target $instance_id to become $want_state in the target group..."
  for _ in $(seq 1 30); do
    state="$(aws elbv2 describe-target-health --target-group-arn "$TARGET_GROUP_ARN" \
      --targets "Id=$instance_id" --query 'TargetHealthDescriptions[0].TargetHealth.State' --output text 2>/dev/null || echo "unused")"
    if [ "$state" = "$want_state" ]; then
      echo "    $instance_id is $want_state"
      return 0
    fi
    sleep 5
  done
  echo "    WARNING: $instance_id did not reach $want_state within 150s (last state: $state)"
}

for ENTRY in "$@"; do
  HOST="${ENTRY%%:*}"
  INSTANCE_ID=""
  if [[ "$ENTRY" == *:* ]]; then
    INSTANCE_ID="${ENTRY##*:}"
  fi

  echo "==> Deploying to $HOST${INSTANCE_ID:+ ($INSTANCE_ID)}"

  if [ -n "$TARGET_GROUP_ARN" ] && [ -n "$INSTANCE_ID" ]; then
    echo "  -> deregistering from target group, waiting for connections to drain"
    aws elbv2 deregister-targets --target-group-arn "$TARGET_GROUP_ARN" --targets "Id=$INSTANCE_ID"
    wait_for_target_health "$INSTANCE_ID" "unused"
  fi

  # Copy the env file over (never bake secrets into the image).
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$ENV_FILE" "$SSH_USER@$HOST:/tmp/lotus-backend.env"

  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$SSH_USER@$HOST" bash -s <<REMOTE
    set -euo pipefail
    aws ecr get-login-password --region "$REGION" | sudo docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
    sudo docker pull "$ECR_URI:$TAG"
    sudo docker rm -f lotus-backend 2>/dev/null || true
    sudo docker run -d --name lotus-backend --restart always \
      --env-file /tmp/lotus-backend.env \
      -p 4000:4000 "$ECR_URI:$TAG"
    rm -f /tmp/lotus-backend.env
    sleep 3
    curl -sf http://localhost:4000/health && echo " -- health check OK" || { echo " -- health check FAILED"; exit 1; }
REMOTE

  if [ -n "$TARGET_GROUP_ARN" ] && [ -n "$INSTANCE_ID" ]; then
    echo "  -> re-registering with target group"
    aws elbv2 register-targets --target-group-arn "$TARGET_GROUP_ARN" --targets "Id=$INSTANCE_ID"
    wait_for_target_health "$INSTANCE_ID" "healthy"
  fi

  echo "==> $HOST done"
done

echo "==> All targets deployed on tag $TAG."
echo "    Rollback if needed: re-run each instance's docker run with :<previous-tag> instead of :$TAG."

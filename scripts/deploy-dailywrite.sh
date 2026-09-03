#!/usr/bin/env bash
#
# Builds DailyWrite locally and ships the result to the droplet, instead of
# building on the (RAM-constrained) droplet itself.
#
# Usage: run from anywhere, e.g. ~/web/daily-write/scripts/deploy-dailywrite.sh
#
# Requires a clean, committed, pushed working tree — this deploys whatever
# the droplet's `main` branch has after `git pull`, not your local diff.

set -euo pipefail

DROPLET_HOST="deploy@167.172.215.72"
REMOTE_DIR="/var/www/dailywrite"
LOCAL_REPO="$HOME/web/daily-write"

cd "$LOCAL_REPO"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit and push before deploying." >&2
  exit 1
fi

pnpm build

ssh "$DROPLET_HOST" "cd $REMOTE_DIR && git fetch --prune && git reset --hard origin/main && pnpm install --frozen-lockfile && sudo systemctl restart dailywrite"

rsync -avz --delete .next/ "$DROPLET_HOST:$REMOTE_DIR/.next/"

ssh "$DROPLET_HOST" "sudo systemctl restart dailywrite"

echo "Deployed. Restarted dailywrite before and after syncing .next/."

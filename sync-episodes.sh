#!/bin/bash

# Sync Episodes to GitHub
# Usage: ./sync-episodes.sh "Your commit message"
# Or just: ./sync-episodes.sh (will use default message)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get commit message from argument or use default
COMMIT_MSG="${1:-Update episode files}"

echo -e "${YELLOW}🔄 Syncing episodes to GitHub...${NC}\n"

# Check if there are any changes
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${YELLOW}ℹ️  No changes detected. Everything is up to date!${NC}"
    exit 0
fi

# Pull latest changes first to avoid conflicts
echo -e "${GREEN}📥 Pulling latest changes from GitHub...${NC}"
git pull origin main --rebase

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to pull changes. Please resolve conflicts manually.${NC}"
    exit 1
fi

# Stage all changes in public/ep/
echo -e "${GREEN}📝 Staging episode files...${NC}"
git add public/ep/

# Show what's being committed
echo -e "\n${YELLOW}Files to be committed:${NC}"
git status --short | grep "public/ep/"

# Commit with the provided message
echo -e "\n${GREEN}💾 Creating commit...${NC}"
git commit -m "$(cat <<EOF
$COMMIT_MSG

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Commit failed. No changes to commit or an error occurred.${NC}"
    exit 1
fi

# Push to GitHub
echo -e "${GREEN}🚀 Pushing to GitHub...${NC}"
git push origin master:main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Push failed. Please check your connection and try again.${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Successfully synced episodes to GitHub!${NC}"
echo -e "${YELLOW}⏳ Lovable will deploy automatically in a few minutes.${NC}"
echo -e "${YELLOW}📍 Check your changes at: https://revenueoptimization.io${NC}\n"

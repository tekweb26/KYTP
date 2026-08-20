#!/bin/bash

# GST Payment Platform - GitHub & Railway Setup Automation
# This script automates creating a GitHub repo and deploying to Railway
# Prerequisites: GitHub CLI (gh) and Git installed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   GST Payment Platform - GitHub & Railway Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not found. Install it:${NC}"
    echo "   macOS: brew install gh"
    echo "   Linux: https://github.com/cli/cli/releases"
    echo "   Windows: choco install gh"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found. Please install Git.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites found${NC}\n"

# Check GitHub authentication
echo -e "${YELLOW}Checking GitHub authentication...${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to GitHub. Opening login...${NC}"
    gh auth login
fi

echo -e "${GREEN}✓ GitHub authenticated${NC}\n"

# Get user inputs
echo -e "${YELLOW}Please provide the following information:${NC}\n"

read -p "GitHub username: " GITHUB_USER
read -p "Repository name (default: gst-payment-poc): " REPO_NAME
REPO_NAME=${REPO_NAME:-gst-payment-poc}

read -p "Repository description (default: GST-compliant payment platform for India): " REPO_DESC
REPO_DESC=${REPO_DESC:-GST-compliant payment platform for India}

read -p "Make repository public? (y/n, default: y): " REPO_VISIBILITY
REPO_VISIBILITY=${REPO_VISIBILITY:-y}

if [ "$REPO_VISIBILITY" = "y" ]; then
    VISIBILITY_FLAG=""
else
    VISIBILITY_FLAG="--private"
fi

echo ""

# Step 1: Create GitHub Repository
echo -e "${YELLOW}[1/5] Creating GitHub repository...${NC}"

if gh repo list "$GITHUB_USER" | grep -q "$REPO_NAME"; then
    echo -e "${RED}⚠️  Repository already exists: $GITHUB_USER/$REPO_NAME${NC}"
    read -p "Delete and recreate? (y/n): " RECREATE
    if [ "$RECREATE" = "y" ]; then
        echo -e "${YELLOW}Deleting existing repository...${NC}"
        gh repo delete "$GITHUB_USER/$REPO_NAME" --yes
    else
        echo -e "${YELLOW}Using existing repository${NC}"
    fi
fi

gh repo create "$REPO_NAME" \
    --description "$REPO_DESC" \
    --source=. \
    --remote=origin \
    --push \
    $VISIBILITY_FLAG

echo -e "${GREEN}✓ Repository created${NC}\n"
REPO_URL="https://github.com/$GITHUB_USER/$REPO_NAME"

# Step 2: Initialize local repo if needed
echo -e "${YELLOW}[2/5] Initializing local Git repository...${NC}"

if [ ! -d .git ]; then
    git init
    git add .
    git commit -m "Initial commit: GST Payment Platform POC"
    git branch -M main
else
    # Add any uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        git add .
        git commit -m "Update: GST Payment Platform deployment files"
    fi
fi

git push -u origin main

echo -e "${GREEN}✓ Code pushed to GitHub${NC}\n"

# Step 3: Get Railway token
echo -e "${YELLOW}[3/5] Setting up Railway deployment...${NC}"
echo ""
echo -e "${BLUE}You need a Railway API token. Get it here:${NC}"
echo -e "${BLUE}https://railway.app/account/tokens${NC}"
echo ""

read -sp "Paste your Railway API token (hidden): " RAILWAY_TOKEN
echo ""

# Verify Railway token
if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${RED}❌ Railway token is required${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Railway token received${NC}\n"

# Step 4: Create Railway project and connect to GitHub
echo -e "${YELLOW}[4/5] Connecting Railway to GitHub (manual step)...${NC}"
echo ""
echo -e "${BLUE}Complete these steps in Railway dashboard:${NC}"
echo ""
echo "1. Go to: https://railway.app"
echo "2. Click 'New Project'"
echo "3. Select 'GitHub Repo'"
echo "4. Authorize & select: $REPO_URL"
echo "5. Click 'Deploy'"
echo "6. Add PostgreSQL service"
echo "7. Set environment variables (see below)"
echo ""

read -p "Press Enter once you've completed the Railway setup in browser..."

echo -e "${GREEN}✓ Railway setup started${NC}\n"

# Step 5: Configuration guide
echo -e "${YELLOW}[5/5] Configuring environment variables...${NC}"
echo ""
echo -e "${BLUE}Add these environment variables in Railway dashboard:${NC}"
echo ""
echo "  PORT=3000"
echo "  NODE_ENV=production"
echo "  JWT_SECRET=$(openssl rand -base64 32)"
echo "  RAZORPAY_KEY=rzp_live_xxxxxx          ← Get from Razorpay"
echo "  RAZORPAY_SECRET=xxxxxx                ← Get from Razorpay"
echo "  GOOGLE_CLOUD_KEY_PATH=/app/google-cloud-key.json"
echo "  CORS_ORIGIN=https://your-app-name.railway.app"
echo ""

read -p "Press Enter once you've set the environment variables..."

echo ""
echo -e "${GREEN}✓ Configuration complete${NC}\n"

# Summary
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${BLUE}📊 Your Project Details:${NC}"
echo "  Repository:  $REPO_URL"
echo "  GitHub User: $GITHUB_USER"
echo "  Visibility:  $([ "$REPO_VISIBILITY" = "y" ] && echo 'Public' || echo 'Private')"
echo ""

echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Upload google-cloud-key.json to Railway"
echo "   Command: railway --token $RAILWAY_TOKEN upload-file google-cloud-key.json"
echo ""
echo "2. Run database schema migration"
echo "   In Railway Shell: psql \$DATABASE_URL < database/schema.sql"
echo ""
echo "3. Test your app"
echo "   curl https://your-app-name.railway.app/health"
echo ""
echo "4. Verify CI/CD works"
echo "   Make a change → git push → app auto-deploys!"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
echo "  • API Docs:     API_DOCUMENTATION.md"
echo "  • Setup Guide:  SETUP_GUIDE.md"
echo "  • Deployment:   DEPLOY_STEP_BY_STEP.md"
echo ""

echo -e "${BLUE}💰 Cost Estimate:${NC}"
echo "  Railway App:    $10-15/month"
echo "  PostgreSQL:     $5-10/month"
echo "  Total:          $15-25/month"
echo ""

echo -e "${BLUE}📞 Support:${NC}"
echo "  Railway Docs:   https://docs.railway.app"
echo "  Railway Discord: https://discord.gg/railway"
echo ""

echo -e "${GREEN}🎉 Your GST Payment Platform is ready to launch!${NC}\n"

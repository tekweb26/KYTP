# Deploy GST Payment Platform: Step-by-Step Guide

## ⚡ QUICKEST OPTION: Railway.app (5 Minutes)

### Prerequisites
- GitHub account with code pushed
- Railway.app free account

### Step 1: Create Railway Account
```bash
# Go to https://railway.app
# Click "Start Project"
# Sign up with GitHub
```

### Step 2: Create New Project
```
1. Click "New Project"
2. Click "GitHub Repo"
3. Authorize & select "gst-payment-poc"
4. Click "Deploy"
```

**That's it! Railway auto-deploys in 2 minutes**

### Step 3: Add PostgreSQL Service
```
1. In Railway dashboard, click "+ Add"
2. Select "Database"
3. Choose "PostgreSQL"
4. Click "Create"
5. Done! Database auto-created
```

### Step 4: Configure Environment Variables
```
1. Click your Backend service
2. Go to "Variables" tab
3. Railway auto-fills DATABASE_URL
4. Add these variables:
   - JWT_SECRET=your-random-secret-key
   - RAZORPAY_KEY=rzp_live_xxxxx
   - RAZORPAY_SECRET=xxxxx
   - GOOGLE_CLOUD_KEY_PATH=/app/google-cloud-key.json
5. Click "Save"
```

### Step 5: Upload Google Cloud Credentials
```bash
# In Railway dashboard, go to Deployments
# Click "Files" tab
# Upload google-cloud-key.json
```

### Step 6: Run Database Schema
```bash
# Click PostgreSQL service → Terminal
# Run:
psql $DATABASE_URL < database/schema.sql

# Or manually:
psql -U postgres -h localhost -d gst_payment_db -f database/schema.sql
```

### Step 7: Test Your App
```bash
# Your app is live at:
https://gst-payment-poc.railway.app

# Test it:
curl https://gst-payment-poc.railway.app/health
# Should return: {"status":"OK","timestamp":"..."}
```

### How It Updates
```
1. Push to GitHub: git push origin main
2. GitHub notifies Railway
3. Railway auto-builds Docker image
4. Deploys in ~2 minutes
5. Your app is updated!
```

### Cost
```
Free tier: $5/month credits
Typical usage: $20-30/month (1K-10K users)
```

---

## 🌍 BEST FOR INDIA: Fly.io (10 Minutes)

### Prerequisites
- GitHub account with code pushed
- Fly.io free account
- flyctl CLI installed

### Step 1: Install Flyctl
```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### Step 2: Login to Fly.io
```bash
fly auth login
# Opens browser to authenticate
```

### Step 3: Initialize App
```bash
cd gst-payment-poc
fly launch --no-deploy

# This creates fly.toml (already in repo)
# When asked:
# - App name: gst-payment-poc
# - Region: maa (Mumbai, India!)
# - PostgreSQL: Yes
```

### Step 4: Create PostgreSQL Database
```bash
fly postgres create \
  --name gst-payment-db \
  --region maa

# Other India regions: del (Delhi)
# Wait 2-3 minutes for database to be ready
```

### Step 5: Attach Database to App
```bash
fly postgres attach gst-payment-db \
  --app gst-payment-poc

# This auto-sets DATABASE_URL secret
```

### Step 6: Set Secrets
```bash
fly secrets set \
  JWT_SECRET="your-random-secret-key" \
  RAZORPAY_KEY="rzp_live_xxxxx" \
  RAZORPAY_SECRET="xxxxx" \
  GOOGLE_CLOUD_KEY_PATH="/app/google-cloud-key.json"
```

### Step 7: Deploy App
```bash
fly deploy

# Waits for build and deployment
# Takes 3-5 minutes first time
```

### Step 8: Run Database Schema
```bash
# Get PostgreSQL credentials
fly postgres connect -a gst-payment-db

# Inside psql:
\i database/schema.sql
\q

# Or from terminal:
fly ssh console --app gst-payment-db
psql $DATABASE_URL < database/schema.sql
exit
```

### Step 9: Test Your App
```bash
# Your app is live at:
https://gst-payment-poc.fly.dev

# Test it:
fly status
curl https://gst-payment-poc.fly.dev/health
```

### How It Updates (GitHub Actions)
```bash
# With workflow file (.github/workflows/deploy-flyio.yml):
1. Push to GitHub: git push origin main
2. GitHub Actions triggers
3. Builds & pushes Docker image
4. Deploys to Fly.io
5. App updated in ~5 minutes
```

### Cost
```
Compute (2 shared CPU, 512MB): $10/month
PostgreSQL (3GB storage): $15/month
────────────────────────────────
Total: $25/month
```

### Scale to Other Regions
```bash
# After India launch, add Singapore:
fly regions add sin

# Add US:
fly regions add ord  # Chicago

# View regions:
fly regions list
```

---

## 🎨 EASIEST GUI: Render.com (10 Minutes)

### Prerequisites
- GitHub account with code pushed
- Render.com account (no credit card required)

### Step 1: Create Render Account
```bash
# Go to https://render.com
# Click "Get Started"
# Sign up with GitHub
# Authorize Render
```

### Step 2: Create Web Service
```
1. Dashboard → "New +"
2. Select "Web Service"
3. Select your GitHub repo
4. Connect
```

### Step 3: Configure Web Service
```
Name: gst-payment-api
Environment: Node
Region: Oregon (closest to India, good performance)
Build Command: npm install
Start Command: npm start
Instance Type: Free (upgrade later if needed)
Environment: production
```

### Step 4: Add PostgreSQL Database
```
1. Dashboard → "New +"
2. Select "PostgreSQL"
3. Name: gst-payment-db
4. Region: (same as web service)
5. Plan: Standard Single Node ($15/mo)
6. Create Database
```

### Step 5: Connect Database to Web Service
```
1. Go to Web Service settings
2. Add Environment Variable:
   DATABASE_URL = [copy from PostgreSQL dashboard]
3. Add other variables:
   - JWT_SECRET
   - RAZORPAY_KEY
   - RAZORPAY_SECRET
4. Click "Save & Deploy"
```

### Step 6: Run Database Schema
```bash
# Get PostgreSQL connection string from Render dashboard
# In terminal:
psql <CONNECTION_STRING> < database/schema.sql

# Or use Render's PostgreSQL GUI (recommended):
# Dashboard → Database → Query Editor
# Paste schema.sql contents and run
```

### Step 7: Test Your App
```bash
# Your app is live at:
https://gst-payment-api.onrender.com

# Test it:
curl https://gst-payment-api.onrender.com/health
```

### How It Updates
```
1. Push to GitHub: git push origin main
2. GitHub notifies Render
3. Render auto-builds
4. Deploys in ~2-3 minutes
5. App is updated!
```

### Cost
```
Web Service (starter): $7/month
PostgreSQL (standard): $15/month
────────────────────────
Total: $22/month
```

---

## 🚀 ENTERPRISE OPTION: AWS ECS + CodePipeline (30 Minutes)

### Prerequisites
- AWS account with credit card
- GitHub account
- AWS CLI installed

### Step 1: Create ECR Repository
```bash
aws ecr create-repository \
  --repository-name gst-payment \
  --region ap-south-1

# Save: <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/gst-payment
```

### Step 2: Create RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier gst-payment-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username gst_user \
  --master-user-password YourSecurePassword123 \
  --allocated-storage 20 \
  --storage-type gp2 \
  --region ap-south-1

# Wait 5-10 minutes for database to be ready
```

### Step 3: Create ECS Cluster
```bash
aws ecs create-cluster \
  --cluster-name gst-payment \
  --region ap-south-1
```

### Step 4: Create IAM Role for CodeBuild
```bash
# Via AWS Console:
# IAM → Roles → Create Role
# Service: CodeBuild
# Add policies: 
#   - AmazonEC2ContainerRegistryPowerUser
#   - AmazonECSTaskExecutionRolePolicy
```

### Step 5: Create buildspec.yml (already provided in repo)
```bash
# File location: buildspec.yml
# Contains all build instructions
```

### Step 6: Create CodePipeline
```bash
# Via AWS Console:
# CodePipeline → Create Pipeline
# Pipeline name: gst-payment-pipeline
# 
# Source stage:
#   - GitHub (connect & select repo)
# 
# Build stage:
#   - CodeBuild (create new project)
#   - Use buildspec.yml from repo
# 
# Deploy stage:
#   - ECS
#   - Cluster: gst-payment
#   - Service: gst-payment-service
```

### Step 7: Test Deployment
```bash
# Push to GitHub:
git push origin main

# Pipeline automatically:
# 1. Pulls from GitHub
# 2. Builds Docker image
# 3. Pushes to ECR
# 4. Deploys to ECS
# 5. Updates running app

# Monitor in CodePipeline console
```

### Cost
```
ECS Fargate (2 vCPU, 4GB): $100-150/month
RDS t3.micro: $40-60/month
────────────────────────────────
Total: $140-210/month
```

---

## 📊 COMPARISON: Final Decision Table

| Platform | Cost | Setup Time | India Region | Ease | Best For |
|----------|------|---|---|---|---|
| **Railway** | $20/mo | 5 min | ⭐ Global | ⭐⭐⭐ | POC - Cheapest |
| **Fly.io** | $25/mo | 10 min | ✅ Delhi/Mumbai | ⭐⭐ | India Focus |
| **Render** | $22/mo | 10 min | ⭐ Global | ⭐⭐⭐ | Most Beginner-Friendly |
| **AWS** | $150/mo | 30 min | ✅ Mumbai | ⭐ Enterprise | Scale to 100K+ |

---

## 🎯 RECOMMENDED DEPLOYMENT PATH

### Now (Weeks 1-4): Launch POC
**Use: Railway.app**
```bash
# Deploy in 5 minutes
# Cost: $20/month
# Users: 10-100
```

### Growth Phase (Months 2-3): Monitor & Optimize
**Stay on Railway OR Move to Fly.io**
```bash
# Railway: Easy scale from $20 → $50/month
# Fly.io: Better India performance
# Users: 100-1K
```

### Scale Phase (Months 4-12): Production Ready
**Move to Fly.io or AWS**
```bash
# Fly.io: $25-50/month, India-friendly
# AWS: $150-300/month, Enterprise-grade
# Users: 1K-100K
```

### Enterprise Phase (Year 2+): Multi-Region
**AWS with Multi-Region Setup**
```bash
# India + Singapore + USA
# Cost: $500-2000/month
# Users: 100K+
```

---

## ✅ DEPLOYMENT CHECKLIST

### Before Deploying to ANY Platform:
- [ ] Code pushed to GitHub main branch
- [ ] package.json has correct dependencies
- [ ] .env.example file created
- [ ] Database schema tested locally
- [ ] Health endpoint working
- [ ] API endpoints tested with curl
- [ ] Docker image builds locally: `docker build -t gst-payment .`
- [ ] Docker compose works: `docker-compose up`

### After Deploying:
- [ ] App is accessible at public URL
- [ ] Health check passes: `curl https://your-app/health`
- [ ] Database connected
- [ ] Environment variables loaded
- [ ] Logs show no errors
- [ ] SSL certificate working (HTTPS)
- [ ] Can make API calls from frontend
- [ ] Deployment auto-triggers on Git push

---

## 🔄 CI/CD Pipeline Summary

### What CI/CD Does:
```
Your code → GitHub push
    ↓
Automated tests run
    ↓
Docker image builds
    ↓
Tests pass?
    ↓ Yes
Automatically deploy
    ↓
App updated live (No manual deployment!)
```

### Benefits:
✅ No manual deployment steps
✅ Consistent builds every time
✅ Quick rollback if something breaks
✅ Automated testing before deploy
✅ Team can deploy from anyone's push

---

## 📞 Support During Deployment

### Railway Support
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Email: support@railway.app

### Fly.io Support
- Docs: https://fly.io/docs
- Community: https://community.fly.io
- Slack: https://fly-io.slack.com

### Render Support
- Docs: https://render.com/docs
- Discord: https://discord.gg/r6Y9RrxWYv
- Email: support@render.com

### AWS Support
- Docs: https://docs.aws.amazon.com
- Console: https://console.aws.amazon.com
- Support Portal: AWS Support Plan (paid)

---

## 🎉 You're Ready to Deploy!

### Your Next 15 Minutes:
1. Push your code to GitHub
2. Go to Railway.app
3. Connect your GitHub repo
4. Add PostgreSQL
5. Deploy
6. Done! 🚀

**Choose Railway.app for fastest deployment. You'll be live in minutes!**

---

Questions? Check the platform docs linked above or join their communities!

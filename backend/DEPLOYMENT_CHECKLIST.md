# ✅ Complete Deployment Checklist - Copy & Paste Guide

This guide has all the commands you need to deploy to GitHub and Railway in one place.

---

## 📋 Phase 1: Prepare Local Repository (5 minutes)

### 1.1 Initialize Git Repository
```bash
cd gst-payment-poc

# Initialize git
git init

# Configure git (do this once on your computer)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify .gitignore exists (it should)
ls -la | grep gitignore
```

### 1.2 Create Initial Commit
```bash
# Stage all files
git add .

# Create commit
git commit -m "Initial commit: GST Payment Platform POC

Features:
- React frontend with 4-step payment flow
- Node.js Express backend with full APIs
- PostgreSQL database with schema
- Google Vision OCR integration
- Razorpay payment processing
- GST compliance calculations
- Complete API documentation
- Ready for production deployment"

# Verify commit
git log --oneline
```

### 1.3 Create Main Branch
```bash
# Rename to main (GitHub convention)
git branch -M main

# Verify
git branch -a
```

---

## 🐙 Phase 2: Create GitHub Repository (5 minutes)

### 2.1 Option A: Using GitHub CLI (Recommended)

**Install GitHub CLI:**
```bash
# macOS
brew install gh

# Linux
curl -sL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo apt-key add -
sudo apt install gh

# Windows (PowerShell)
choco install gh
```

**Create repository:**
```bash
# Login to GitHub
gh auth login

# Create repository
gh repo create gst-payment-poc \
  --description "GST-compliant payment platform for India" \
  --public \
  --source=. \
  --remote=origin \
  --push
```

### 2.2 Option B: Manual (via GitHub.com)

1. Go to: https://github.com/new
2. Fill in:
   - Repository name: `gst-payment-poc`
   - Description: `GST-compliant payment platform for India`
   - Public/Private: Choose preference
3. Click "Create repository"
4. Copy the commands GitHub shows you

**Then run locally:**
```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/gst-payment-poc.git

# Push to GitHub
git push -u origin main

# Verify
git remote -v
```

---

## 🚂 Phase 3: Deploy to Railway (10 minutes)

### 3.1 Create Railway Account & Project

**Step 1: Create account**
```
1. Go to: https://railway.app
2. Sign up (GitHub recommended)
3. Authorize Railway to access your GitHub
```

**Step 2: Create project**
```
1. Click "New Project"
2. Select "GitHub Repo"
3. Select your "gst-payment-poc" repository
4. Click "Deploy"

Wait 2-3 minutes for initial deployment...
```

### 3.2 Add PostgreSQL Database

**Step 1: Create database**
```
1. Go to Railway dashboard
2. Click "+ Add Service"
3. Select "Database"
4. Choose "PostgreSQL"
5. Click "Create"

Wait 2-3 minutes for database to be ready...
```

**Step 2: Verify connection**
```bash
# Railway auto-fills DATABASE_URL
# Verify in: Backend Service → Variables → DATABASE_URL

# Should look like: postgresql://username:password@hostname:5432/railway
```

### 3.3 Set Environment Variables

**Copy these variables into Railway Dashboard:**

Go to: Backend Service → Variables → Add Variable

```bash
# Copy each line into Railway

PORT=3000

NODE_ENV=production

# Generate random key:
JWT_SECRET=PASTE_OUTPUT_OF_THIS_COMMAND_BELOW
# Run in terminal: openssl rand -base64 32

# Get from Razorpay dashboard
RAZORPAY_KEY=rzp_live_YOUR_KEY_HERE

# Get from Razorpay dashboard
RAZORPAY_SECRET=YOUR_SECRET_HERE

GOOGLE_CLOUD_KEY_PATH=/app/google-cloud-key.json

# Use your actual Railway app URL
CORS_ORIGIN=https://gst-payment-poc-XXXXX.railway.app

# Optional: for debugging
LOG_LEVEL=info
```

**Generate JWT_SECRET:**
```bash
# Run this in your terminal:
openssl rand -base64 32

# Copy the output and paste into Railway
# Example: "aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6"
```

**Verify variables are set:**
```
1. Go to Railway Backend Service
2. Variables tab
3. Should see 8 variables listed
4. DATABASE_URL should be auto-filled
```

### 3.4 Upload Google Cloud Credentials

**Option A: Via Railway Shell**

```bash
# 1. Go to Railway Dashboard
# 2. Click on Backend Service
# 3. Go to "Deployments" tab
# 4. Click "Shell" button
# 5. Run these commands:

cd /app
ls -la google-cloud-key.json  # Verify it's there

# If not there, you need to upload it
# Go to Deployments → File Upload (if available)
```

**Option B: Using Railway CLI**

```bash
# First, get your Railway API token
# Go to: https://railway.app/account/tokens
# Copy your token

# Then upload file:
railway --token YOUR_TOKEN upload-file google-cloud-key.json
```

### 3.5 Initialize Database Schema

**Option A: Via Railway Shell (Recommended)**

```bash
# 1. Go to Railway Dashboard
# 2. Click Backend Service → Deployments → Shell
# 3. Run:

cd /app
psql $DATABASE_URL < database/schema.sql

# Verify tables created:
psql $DATABASE_URL -c "\dt"
```

**Option B: Via PostgreSQL Console**

```bash
# 1. Click PostgreSQL service → Deployments → Shell
# 2. Run:

psql

# Then:
\c gst_payment_db
\i /app/database/schema.sql
\dt  # List tables
\q  # Quit
```

**Option C: Manually Run SQL**

```bash
# 1. Click PostgreSQL → Deployments → Shell
# 2. Copy entire schema.sql content
# 3. Paste into psql and run
```

### 3.6 Verify Deployment

**Check app is running:**
```bash
# Get your Railway app URL from dashboard
# Should be in URL field: https://gst-payment-poc-XXXXX.railway.app

curl https://gst-payment-poc-XXXXX.railway.app/health

# Should return:
# {"status":"OK","timestamp":"2024-01-15T12:34:56.789Z"}
```

**Check logs:**
```
1. Railway Dashboard
2. Backend Service
3. Deployments → Click latest
4. View logs (should see: "Server running on port 3000")
```

**Check database:**
```bash
# In Railway PostgreSQL Shell:
psql $DATABASE_URL

# Then:
SELECT * FROM users;
SELECT COUNT(*) FROM invoices;
\q
```

---

## 🔄 Phase 4: Set Up CI/CD (5 minutes)

### 4.1 Verify GitHub Actions Workflow

```bash
# Check that workflow file exists:
ls -la .github/workflows/

# Should see: deploy-railway.yml or deploy-flyio.yml
```

### 4.2 Get Your Railway Token

```
1. Go to: https://railway.app/account/tokens
2. Copy your API token
3. Keep it safe (don't share)
```

### 4.3 Add Token to GitHub Secrets

```
1. Go to: https://github.com/YOUR_USERNAME/gst-payment-poc
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: RAILWAY_TOKEN
5. Value: Paste your Railway API token
6. Click "Add secret"
```

### 4.4 Test CI/CD

**Make a test change:**
```bash
# Edit a file (e.g., README.md)
echo "# GST Payment Platform - Production Ready!" > README.md

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin main

# Railway should auto-deploy in 2-3 minutes
# Check status at: https://railway.app/dashboard
```

**Verify auto-deployment:**
```
1. Go to Railway Dashboard
2. Click Deployments
3. Should see new deployment in progress
4. Wait for "Success" status
5. Check app at: https://your-app.railway.app/health
```

---

## 🧪 Phase 5: Test Your Deployment (5 minutes)

### 5.1 Health Check
```bash
RAILWAY_URL="https://your-app-name.railway.app"

curl $RAILWAY_URL/health
# Expected: {"status":"OK",...}
```

### 5.2 Test Registration
```bash
RAILWAY_URL="https://your-app-name.railway.app"

curl -X POST $RAILWAY_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "userType": "individual"
  }'

# Expected: {"success":true,"message":"...",...}
```

### 5.3 Test Login
```bash
RAILWAY_URL="https://your-app-name.railway.app"
EMAIL="test@example.com"
PASSWORD="Test@123"

TOKEN=$(curl -s -X POST $RAILWAY_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### 5.4 Test Invoice Upload
```bash
RAILWAY_URL="https://your-app-name.railway.app"
TOKEN="YOUR_TOKEN_FROM_ABOVE"

# Need a test image file
curl -X POST $RAILWAY_URL/api/invoices/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-invoice.jpg" \
  -F "vendorGSTIN=07ABCDE1234F1Z5" \
  -F "invoiceDate=2024-01-15"
```

---

## 📊 Phase 6: Verify Everything Works

### Checklist Items

```bash
# GitHub
☐ Repository exists: https://github.com/YOUR_USERNAME/gst-payment-poc
☐ All files uploaded
☐ Latest commit shows your changes
☐ Secrets configured (RAILWAY_TOKEN)

# Railway
☐ Backend service running
☐ PostgreSQL database connected
☐ Environment variables set (8 variables)
☐ Google Cloud key uploaded
☐ Database tables created
☐ Health check returns 200

# CI/CD
☐ GitHub Actions workflow exists
☐ Workflow triggered on git push
☐ Railway auto-deploys on push

# API Testing
☐ Health endpoint works
☐ Auth endpoints work
☐ Invoice endpoints work
☐ Error handling works
```

---

## 🔧 Common Commands Reference

### Git Commands
```bash
# Check status
git status

# View commit history
git log --oneline

# Make changes
git add .
git commit -m "Your message"
git push origin main

# View branches
git branch -a

# Switch branch
git checkout main
```

### Railway CLI (Optional)
```bash
# Install
npm install -g @railway/cli

# Login
railway login --token YOUR_TOKEN

# View project
railway project

# View logs
railway logs

# Restart app
railway restart

# Update environment variable
railway variables set JWT_SECRET "new-value"
```

### PostgreSQL Commands
```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# Describe table
\d users

# Run query
SELECT * FROM users;

# Count records
SELECT COUNT(*) FROM invoices;

# Quit
\q
```

---

## 📞 Troubleshooting Commands

### App not starting
```bash
# Check logs
# Railway Dashboard → Deployments → Click latest → Logs

# Restart app
# Railway Dashboard → Backend Service → Click restart button

# Check Node.js version
npm --version
node --version
```

### Database connection error
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check if tables exist
psql $DATABASE_URL -c "\dt"
```

### Environment variables not loaded
```bash
# In Railway Shell:
env | grep JWT_SECRET
env | grep DATABASE_URL

# If missing, add them manually in Railway Dashboard
```

### Port already in use
```bash
# Check port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 📈 After Deployment Checklist

```
☐ Share app URL with friends/colleagues
☐ Test on mobile and desktop
☐ Gather feedback
☐ Monitor error logs daily
☐ Monitor database size
☐ Track API performance
☐ Plan next features
☐ Set up monitoring alerts
☐ Document any issues
☐ Plan scaling strategy
```

---

## 🎉 Success Checklist (Final)

When everything is complete, you should have:

```
✅ GitHub repository with all code
✅ Railway deployment (live URL)
✅ PostgreSQL database connected
✅ Environment variables configured
✅ CI/CD auto-deploying on git push
✅ HTTPS/SSL enabled (Railway provides)
✅ Database schema migrated
✅ API endpoints responding
✅ Auth system working
✅ Payment integration ready
✅ OCR system configured
✅ GST calculations functional
✅ Error logging working
✅ Monitoring in place
✅ Backup strategy planned
```

---

## 💬 Need Help?

If you get stuck on any command:

1. **Error message** → Google it or ask Claude
2. **Railway issue** → Check https://docs.railway.app
3. **GitHub issue** → Check https://docs.github.com
4. **Git issue** → Check https://git-scm.com/book
5. **Database issue** → Check postgresql.org

---

## 🎯 Your Deployment Timeline

```
Now:        Follow this checklist (30 minutes)
           Deploy to Railway (works!)
           
Today:      Share app with friends
            Get feedback
            Test payment flow
            
This week:  Fix bugs found
            Add features
            Monitor logs
            
Next month: Evaluate performance
            Decide: stay on Railway or upgrade to Fly.io?
            Plan next version
```

---

## 🚀 Final Command (To Start Everything)

If you have all prerequisites, run this to get started:

```bash
cd gst-payment-poc
git init
git add .
git commit -m "Initial: GST Payment Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gst-payment-poc.git
git push -u origin main

echo "✅ Code pushed to GitHub!"
echo "Now go to https://railway.app to deploy"
```

---

**That's it! You're all set to deploy!** 🎉

**Next step: Go to railway.app and click "New Project → GitHub Repo"** 🚀

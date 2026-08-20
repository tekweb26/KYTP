# 🚀 Deploy to Your KYTP Repository & Railway (10 Minutes)

Your repository: https://github.com/vedakarvir/KYTP

Follow these exact commands in order.

---

## Step 1: Configure Git (One-Time Setup - 2 minutes)

Run these commands in your terminal:

```bash
# Configure your Git identity (if not already done)
git config --global user.name "Veda Karvir"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global user.name
git config --global user.email
```

**Expected output:**
```
Veda Karvir
your.email@example.com
```

---

## Step 2: Initialize Local Repository (1 minute)

Navigate to your project folder and initialize Git:

```bash
# Go to your project directory
cd gst-payment-poc

# OR if in a different location, navigate there
cd /path/to/your/gst-payment-poc

# Initialize Git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: GST Payment Platform POC

Features:
- React frontend with payment flow
- Node.js Express backend
- PostgreSQL database
- Google Vision OCR
- Razorpay payments
- GST calculations
- Complete API documentation"

# Verify commit
git log --oneline
# Should show: Initial commit message
```

---

## Step 3: Connect to Your Repository (1 minute)

```bash
# Add remote pointing to your KYTP repository
git remote add origin https://github.com/vedakarvir/KYTP.git

# Set main branch
git branch -M main

# Verify remote
git remote -v
# Should show:
# origin  https://github.com/vedakarvir/KYTP.git (fetch)
# origin  https://github.com/vedakarvir/KYTP.git (push)
```

---

## Step 4: Push Code to GitHub (2 minutes)

```bash
# Push code to your repository
git push -u origin main

# You'll be asked to authenticate:
# Option A: Personal Access Token
#   - Go to: https://github.com/settings/tokens
#   - Create new token with 'repo' scope
#   - Paste when prompted
#
# Option B: SSH Key
#   - If you have SSH set up, it will work automatically

# Verify push succeeded
git log --oneline
git remote -v
```

**Success if you see:**
```
Your branch is up to date with 'origin/main'.
```

---

## Step 5: Verify on GitHub (30 seconds)

Open: https://github.com/vedakarvir/KYTP

You should see:
- ✅ All your files uploaded
- ✅ README.md visible
- ✅ Commit history showing
- ✅ Green checkmark next to latest commit

---

## Step 6: Deploy to Railway (3 minutes)

### 6a. Go to Railway Dashboard

```
1. Open: https://railway.app
2. Click "New Project"
3. Select "GitHub Repo"
4. Authorize Railway to access GitHub
5. Select: vedakarvir/KYTP
6. Click "Deploy"
```

Wait 2-3 minutes for initial build...

### 6b. Add PostgreSQL Database

```
1. In Railway dashboard
2. Click "+ Add Service"
3. Select "Database"
4. Choose "PostgreSQL"
5. Click "Create"
```

Wait 2-3 minutes for database creation...

### 6c. Set Environment Variables

In Railway Dashboard → Backend Service → Variables

**Copy these exactly:**

```
PORT=3000
NODE_ENV=production
DATABASE_URL=[Auto-filled from PostgreSQL, don't change]
JWT_SECRET=PASTE_OUTPUT_BELOW

RAZORPAY_KEY=rzp_live_xxxxxx
RAZORPAY_SECRET=xxxxxx

GOOGLE_CLOUD_KEY_PATH=/app/google-cloud-key.json
CORS_ORIGIN=https://your-railway-app-url.railway.app
```

**Generate JWT_SECRET:**

Run this in your terminal:
```bash
openssl rand -base64 32
# Copy the output (e.g., "aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6=")
# Paste into Railway JWT_SECRET field
```

**For Razorpay Keys:**
- Go to: https://dashboard.razorpay.com/app/keys
- Copy Live Key ID → RAZORPAY_KEY
- Copy Live Secret → RAZORPAY_SECRET

### 6d. Run Database Schema

In Railway Dashboard → PostgreSQL Service → Deployments → Shell

```bash
psql $DATABASE_URL < database/schema.sql

# Verify tables created:
psql $DATABASE_URL -c "\dt"
```

Or manually:
```bash
# In Railway Shell:
psql $DATABASE_URL

# Then:
CREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR, ...);
# etc.
```

---

## Step 7: Test Your Deployment (1 minute)

Get your Railway app URL from dashboard (should be like `https://kytp-xxxx.railway.app`)

```bash
# Test health endpoint
curl https://kytp-xxxx.railway.app/health

# Should return:
# {"status":"OK","timestamp":"2024-01-15T...","uptime":123}

# If error, check:
# - Railway dashboard logs (Deployments tab)
# - Environment variables are set
# - Database is attached
```

---

## 🎉 SUCCESS!

If you see the health check response, your app is live! 🚀

Your live URL: `https://kytp-xxxx.railway.app`

---

## Next: Update GitHub After Each Change

Whenever you make code changes:

```bash
# Make your changes in code...

# Stage changes
git add .

# Commit
git commit -m "Your change description"

# Push to GitHub
git push origin main

# Railway auto-deploys! (watch Deployments tab)
# App updates in 2-3 minutes with no manual step!
```

---

## 🆘 Troubleshooting

### Issue: "Repository not found"
**Fix:** Check you're using correct URL
```bash
git remote set-url origin https://github.com/vedakarvir/KYTP.git
```

### Issue: "Permission denied (publickey)"
**Fix:** Use HTTPS instead of SSH
```bash
git remote set-url origin https://github.com/vedakarvir/KYTP.git
```

### Issue: "Database connection error"
**Fix:** Check DATABASE_URL is in Railway variables
```bash
# In Railway Shell:
echo $DATABASE_URL
# Should show: postgresql://user:pass@host:port/dbname
```

### Issue: "502 Bad Gateway"
**Fix:** Backend crashed, check logs
```
Railway Dashboard → Deployments → Latest → Logs
```

### Issue: "Health check failing"
**Fix:** Wait longer, Railway might still be starting
```bash
# Retry after 30 seconds
curl https://kytp-xxxx.railway.app/health
```

---

## 📊 What Just Happened

```
Your Computer:
  ├─ Git initialized
  ├─ Code staged & committed
  └─ Pushed to GitHub

GitHub:
  ├─ Repository updated
  └─ Webhook sent to Railway

Railway:
  ├─ Received webhook
  ├─ Built Docker image
  ├─ Deployed to server
  ├─ Created database
  ├─ Set environment variables
  └─ App LIVE! ✅

Your App:
  └─ Available at: https://kytp-xxxx.railway.app
```

---

## ✅ Quick Verification Checklist

After deployment:

- [ ] GitHub repository shows your code at https://github.com/vedakarvir/KYTP
- [ ] Railway shows "Deployment successful"
- [ ] Backend service is running (green status)
- [ ] PostgreSQL database is created
- [ ] Environment variables show 8 entries
- [ ] Health check returns 200: `curl https://kytp-xxxx.railway.app/health`
- [ ] Can see logs without errors

**If all checked ✅ → Your app is live!** 🎉

---

## 🚀 Next Steps

### Immediate (Today):
1. ✅ Test your app endpoints
2. ✅ Share URL with friends for feedback
3. ✅ Check error logs for any issues

### This Week:
1. Gather user feedback
2. Fix any bugs found
3. Monitor performance

### Make Updates (Going Forward):
```bash
# Every time you change code:
git add .
git commit -m "Your change"
git push origin main
# App auto-updates in 2-3 min! ✨
```

---

## 📞 Need Help?

- **Railway Status:** https://status.railway.app
- **GitHub Status:** https://www.githubstatus.com
- **Railway Docs:** https://docs.railway.app
- **GitHub Docs:** https://docs.github.com

---

**Your GST Payment Platform is now LIVE!** 🎊

Repository: https://github.com/vedakarvir/KYTP
Live App: https://kytp-xxxx.railway.app (get actual URL from Railway dashboard)

Enjoy! 🚀

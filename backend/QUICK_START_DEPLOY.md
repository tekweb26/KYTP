# ⚡ Quick Start: GitHub & Railway Deployment (5-10 Minutes)

**Goal:** Get your app live on Railway with GitHub integration in under 10 minutes.

---

## 🎯 What You'll Have After This Guide

✅ Code on GitHub (version control)
✅ App deployed to Railway (live URL)
✅ PostgreSQL database connected
✅ CI/CD set up (auto-deploy on Git push)

---

## 📋 Checklist

Before starting:
- [ ] GitHub account (free at github.com)
- [ ] Railway account (free at railway.app)
- [ ] Git installed
- [ ] This project folder locally
- [ ] Your Razorpay API keys ready
- [ ] Google Cloud JSON key file ready

---

## 🚀 5-Minute Express Setup

### Step 1: GitHub (2 minutes)

**1a. Create repository on GitHub**
```bash
# Go to: https://github.com/new
# - Name: gst-payment-poc
# - Public or Private
# - Click "Create repository"
```

**1b. Push code to GitHub**
```bash
cd gst-payment-poc

git init
git add .
git commit -m "Initial: GST Payment Platform POC"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gst-payment-poc.git
git push -u origin main
```

✅ Your code is now on GitHub!

---

### Step 2: Railway (3 minutes)

**2a. Create Railway project**
```bash
# Go to: https://railway.app
# Click "New Project"
# Select "GitHub Repo"
# Authorize & select "gst-payment-poc"
# Click "Deploy"

# Wait 2-3 minutes...
```

**2b. Add PostgreSQL**
```bash
# In Railway dashboard
# Click "+ Add"
# Select "PostgreSQL"
# Click "Create"

# Wait 2-3 minutes...
```

**2c. Set environment variables**
```bash
# In Railway: Backend service → Variables

PORT=3000
NODE_ENV=production
JWT_SECRET=generate-random-secret-key-here
RAZORPAY_KEY=rzp_live_xxxxx
RAZORPAY_SECRET=xxxxx
GOOGLE_CLOUD_KEY_PATH=/app/google-cloud-key.json
CORS_ORIGIN=https://your-app-name.railway.app
```

Generate JWT_SECRET:
```bash
openssl rand -base64 32
```

**2d. Run database schema**
```bash
# In Railway: PostgreSQL → Shell (or Deployments → Shell)

psql $DATABASE_URL < database/schema.sql

# Or manually:
CREATE TABLE users (...);
CREATE TABLE invoices (...);
# etc.
```

---

### Step 3: Test (1 minute)

```bash
# Get your Railway app URL from dashboard
# Should look like: https://gst-payment-poc-xxxx.railway.app

curl https://gst-payment-poc-xxxx.railway.app/health

# Should return: {"status":"OK","timestamp":"..."}
```

✅ **YOUR APP IS LIVE!** 🎉

---

## 🎯 Just 3 Commands Away

Don't want to manually do this? Use the automated script:

```bash
cd gst-payment-poc
chmod +x setup-github-railway.sh
./setup-github-railway.sh
```

It will guide you through everything interactively.

---

## 📱 Test Your Deployed App

### Health Check
```bash
curl https://your-app.railway.app/health
```

### Register a User
```bash
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "userType": "individual"
  }'
```

### Upload Invoice
```bash
curl -X POST https://your-app.railway.app/api/invoices/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

---

## 🔄 How CI/CD Works

Now that you have GitHub + Railway:

```
You make code changes
       ↓
git add .
git commit -m "Fix bug"
git push origin main
       ↓
GitHub receives push
       ↓
Railway auto-builds & deploys
       ↓
App updated (2-3 minutes)
       ↓
Changes LIVE! ✨
```

**No manual deployment steps!**

---

## 📊 Your Architecture

```
┌─────────────────┐
│   Your Laptop   │
│   VS Code       │
│   (Local Dev)   │
└────────┬────────┘
         │ git push
         ↓
┌─────────────────┐
│   GitHub.com    │
│ Repository      │
│ (Version Ctrl)  │
└────────┬────────┘
         │ Webhook
         ↓
┌─────────────────┐
│   Railway.app   │
│ Auto-Deploy     │
│ (Live App)      │
└─────────────────┘
     Frontend ← → Backend
                   ↓
             PostgreSQL
```

---

## 🎯 Common Issues & Quick Fixes

### Issue: "502 Bad Gateway"
**Fix:** Backend crashed
```bash
# Check logs in Railway Dashboard
# Deployments → Click latest → Logs

# Restart app:
# Click "Restart" in Railway
```

### Issue: "Database connection error"
**Fix:** DATABASE_URL not set
```bash
# In Railway, check if PostgreSQL is attached
# Go to Backend → Variables
# DATABASE_URL should be auto-filled

# If not, add it manually from PostgreSQL → Copy Connection String
```

### Issue: "Cannot find module 'xyz'"
**Fix:** Dependencies not installed
```bash
# In Railway Shell:
npm install

# Or check package.json for typos
```

### Issue: "Google Cloud key not found"
**Fix:** Upload credentials file
```bash
# Option 1: Railway Shell
cd /app
ls -la  # Should see google-cloud-key.json

# Option 2: Upload via Railway CLI
railway --token YOUR_TOKEN upload-file google-cloud-key.json
```

---

## ✅ After Deployment

### 1. Share Your App
Send your Railway URL to friends/colleagues for feedback:
```
https://your-app-name.railway.app
```

### 2. Monitor Performance
- Check Railway Dashboard daily
- Watch error logs
- Monitor database queries

### 3. Make Updates
Every time you update code:
```bash
git add .
git commit -m "Add feature X"
git push origin main
# App auto-deploys! ✨
```

### 4. Scale When Needed
- First 1K users: Railway works great
- Month 3-6: Consider Fly.io (India region)
- Year 1+: Migrate to AWS if 100K+ users

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `API_DOCUMENTATION.md` | All API endpoints |
| `SETUP_GUIDE.md` | Local development setup |
| `GITHUB_RAILWAY_SETUP.md` | Detailed deployment guide |
| `CI_CD_HOSTING_OPTIONS.md` | Compare hosting platforms |
| `DEPLOY_STEP_BY_STEP.md` | Step-by-step for each platform |

---

## 🎉 Success Checklist

After completing this guide:

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL attached
- [ ] Environment variables set
- [ ] Database schema migrated
- [ ] Health check passes
- [ ] App is live and accessible
- [ ] CI/CD works (tested with Git push)

**If all checked → Your app is production-ready!** 🚀

---

## 💰 Cost Summary

| Item | Cost |
|------|------|
| Railway App | $10-15/month |
| PostgreSQL | $5-10/month |
| GitHub | Free |
| API costs | Varies |
| **Total** | **$15-25/month** |

---

## 🆘 Get Help

### If Stuck:
1. Check `GITHUB_RAILWAY_SETUP.md` for detailed guide
2. Railway Docs: https://docs.railway.app
3. Railway Discord: https://discord.gg/railway
4. GitHub Docs: https://docs.github.com

### If Tests Fail:
1. Check Railway logs: Deployments → Logs
2. Verify environment variables are set
3. Make sure PostgreSQL is running
4. Test database connection

---

## 🎯 Next Steps

1. **Immediate (Next 5 minutes)**
   - Follow this guide
   - Get app deployed
   - Test endpoints

2. **Today (Next few hours)**
   - Share with friends
   - Gather feedback
   - Test payment flow

3. **This Week**
   - Fix bugs found
   - Add features
   - Monitor performance

4. **Next Month**
   - Scale if needed
   - Plan next version
   - Consider migration to Fly.io

---

## ✨ You're All Set!

**Your GST Payment Platform is live!** 🚀

- ✅ Code on GitHub
- ✅ Deployed to Railway
- ✅ Database connected
- ✅ CI/CD working
- ✅ HTTPS enabled
- ✅ Auto-scaling ready

**Next: Share your app URL and start getting user feedback!** 💬

---

**Questions? Check the detailed guides or Railway Discord community!**

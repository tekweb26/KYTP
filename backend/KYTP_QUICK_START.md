# ⚡ KYTP Deployment - 10 Minute Ultra-Quick Reference

**Your Repo:** https://github.com/vedakarvir/KYTP

---

## 🎯 Copy-Paste Commands (In Order)

### 1. Configure Git (One-time only)
```bash
git config --global user.name "Veda Karvir"
git config --global user.email "your.email@example.com"
```

### 2. Initialize & Push Code
```bash
cd gst-payment-poc

git init
git add .
git commit -m "Initial: GST Payment Platform POC"
git branch -M main
git remote add origin https://github.com/vedakarvir/KYTP.git
git push -u origin main
```

**When prompted for authentication:**
- Option 1: Use Personal Access Token from https://github.com/settings/tokens
- Option 2: Use SSH key (if configured)

### 3. Verify on GitHub
Open: https://github.com/vedakarvir/KYTP
Should see all files ✅

---

## 🚂 Deploy to Railway (No Code Needed!)

### Step 1: Create Railway Project
```
1. Go to: https://railway.app
2. Click "New Project"
3. Select "GitHub Repo"
4. Select: vedakarvir/KYTP
5. Click "Deploy"
```

Wait 2-3 minutes...

### Step 2: Add PostgreSQL
```
1. Click "+ Add Service"
2. Select "Database" → "PostgreSQL"
3. Click "Create"
```

Wait 2-3 minutes...

### Step 3: Set 8 Environment Variables

In Railway: Backend Service → Variables → Add these:

```
PORT=3000

NODE_ENV=production

JWT_SECRET=
(Run in terminal: openssl rand -base64 32, copy output)

RAZORPAY_KEY=rzp_live_xxxxxx
(Get from: https://dashboard.razorpay.com/app/keys)

RAZORPAY_SECRET=xxxxxx
(Get from: https://dashboard.razorpay.com/app/keys)

GOOGLE_CLOUD_KEY_PATH=/app/google-cloud-key.json

CORS_ORIGIN=https://your-app-name.railway.app

DATABASE_URL=
(Auto-filled, don't change)
```

### Step 4: Run Database Schema

In Railway: PostgreSQL → Deployments → Shell

```bash
psql $DATABASE_URL < database/schema.sql
```

### Step 5: Test

```bash
# Get URL from Railway dashboard (look for: kytp-xxxx.railway.app)

curl https://kytp-xxxx.railway.app/health

# Should return: {"status":"OK",...}
```

---

## 🎉 DONE!

Your app is live at: https://kytp-xxxx.railway.app

---

## 📋 Troubleshooting Quick Links

| Issue | Fix |
|-------|-----|
| GitHub auth fails | Use Personal Access Token: https://github.com/settings/tokens |
| Repository not found | Check URL is correct: https://github.com/vedakarvir/KYTP.git |
| Railway deploy failed | Check logs: Deployments → Latest → Logs |
| Database error | Verify DATABASE_URL in variables |
| 502 Bad Gateway | Wait 30 sec, check logs, restart if needed |
| Health check fails | Verify all 8 env vars are set, Database attached |

---

## 🔄 For Future Updates

Every time you change code:

```bash
git add .
git commit -m "Your change description"
git push origin main

# Railway auto-deploys in 2-3 minutes! ✨
```

**No manual deployment needed!**

---

## 📞 Support

- Railway: https://docs.railway.app
- GitHub: https://docs.github.com
- Status: https://status.railway.app

---

**That's it! Your app is live.** 🚀

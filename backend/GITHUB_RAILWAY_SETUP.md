# 🚀 Create GitHub Repo & Deploy to Railway - Manual Guide

## Prerequisites

You'll need:
- [ ] GitHub account (free at github.com)
- [ ] Railway account (free at railway.app)
- [ ] Git installed on your computer
- [ ] This project files locally

---

## ⚡ OPTION 1: Automated Setup (Recommended - 10 minutes)

### Step 1: Install GitHub CLI
```bash
# macOS
brew install gh

# Linux
curl -sL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo apt-key add -
sudo apt install gh

# Windows (PowerShell)
choco install gh
```

### Step 2: Run the Setup Script
```bash
cd gst-payment-poc

# Make script executable
chmod +x setup-github-railway.sh

# Run it
./setup-github-railway.sh
```

**That's it!** The script will:
1. Create GitHub repository
2. Push code to GitHub
3. Guide you through Railway setup
4. Configure environment variables

---

## 📝 OPTION 2: Manual Setup (20 minutes)

### Step 1: Create GitHub Repository

#### Via GitHub Website:
```
1. Go to https://github.com/new
2. Repository name: gst-payment-poc
3. Description: GST-compliant payment platform for India
4. Public or Private? (your choice)
5. Click "Create repository"
```

You'll see instructions like:
```
git remote add origin https://github.com/YOUR_USERNAME/gst-payment-poc.git
git branch -M main
git push -u origin main
```

### Step 2: Initialize Local Repository

```bash
cd gst-payment-poc

# Initialize git if not already done
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: GST Payment Platform POC

- React frontend with 4-step payment flow
- Node.js Express backend
- PostgreSQL database
- OCR integration with Google Vision
- Razorpay payment processing
- GST compliance calculations
- Complete API documentation"

# Set branch to main
git branch -M main

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/gst-payment-poc.git

# Push to GitHub
git push -u origin main
```

### Step 3: Verify on GitHub

Open: https://github.com/YOUR_USERNAME/gst-payment-poc

You should see all files uploaded ✅

---

### Step 4: Create Railway Project

#### Via Railway Dashboard:
```
1. Go to https://railway.app
2. Sign up (with GitHub recommended)
3. Click "New Project"
4. Select "GitHub Repo"
5. Authorize Railway to access GitHub
6. Select your "gst-payment-poc" repository
7. Click "Deploy"

Wait 2-3 minutes for first deployment...
```

#### Add PostgreSQL Database:

```
1. In Railway dashboard
2. Click "+ Add"
3. Select "Database"
4. Choose "PostgreSQL"
5. Click "Create"

Wait 2-3 minutes for database setup...
```

#### Configure Environment Variables:

In Railway dashboard, go to your Backend service → Variables

Add these:
```
PORT=3000
NODE_ENV=production
DATABASE_URL=[Auto-filled from PostgreSQL]
JWT_SECRET=your-random-secret-key-min-32-chars
RAZORPAY_KEY=rzp_live_xxxxxx
RAZORPAY_SECRET=xxxxxx
GOOGLE_CLOUD_KEY_PATH=/app/google-cloud-key.json
CORS_ORIGIN=https://your-app-name.railway.app
```

Generate JWT_SECRET:
```bash
openssl rand -base64 32
# Copy the output to JWT_SECRET
```

#### Upload Google Cloud Credentials:

```bash
# In Railway Shell (via dashboard):
# 1. Go to Deployments → Click "Shell"
# 2. Run:
cd /app
ls  # verify files are there
```

Or use Railway CLI:
```bash
railway --token YOUR_RAILWAY_TOKEN upload-file google-cloud-key.json
```

### Step 5: Run Database Schema

```bash
# In Railway PostgreSQL console (via dashboard):
psql $DATABASE_URL

# Inside psql:
\i /app/database/schema.sql
\q
```

Or via Railway Shell:
```bash
psql $DATABASE_URL < database/schema.sql
```

### Step 6: Test Your App

```bash
# Get your Railway app URL from dashboard
# Should be: https://gst-payment-poc-XXXX.railway.app

curl https://gst-payment-poc-XXXX.railway.app/health

# Should return:
# {"status":"OK","timestamp":"2024-01-15T...","uptime":123}
```

---

## ✅ Verification Checklist

After deployment, verify everything works:

### GitHub Repository
- [ ] Repository exists at github.com/YOUR_USERNAME/gst-payment-poc
- [ ] All files are uploaded
- [ ] README.md is visible
- [ ] Commits show your history

### Railway Deployment
- [ ] App is live (URL shown in Railway dashboard)
- [ ] PostgreSQL database created
- [ ] Environment variables set
- [ ] Health check passes
- [ ] Logs show no errors
- [ ] Database tables created

### CI/CD (Automatic)
- [ ] Make a small change to code
- [ ] Run: `git push origin main`
- [ ] Railway auto-deploys (watch logs)
- [ ] Changes live in 2-3 minutes

---

## 🔄 How to Update Your App (Going Forward)

Every time you make changes:

```bash
# 1. Make your code changes

# 2. Stage and commit
git add .
git commit -m "Your change description"

# 3. Push to GitHub
git push origin main

# 4. Railway auto-deploys!
# Watch it in Railway dashboard → Deployments
```

**No manual deployment needed!** ✨

---

## 📊 What Your Setup Looks Like

```
┌─────────────────────────────────────┐
│      Your Laptop/Computer           │
├─────────────────────────────────────┤
│  VS Code                            │
│  ↓ (git push)                       │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│      GitHub Repository              │
│  (gst-payment-poc)                  │
├─────────────────────────────────────┤
│  Files stored, version controlled   │
│  ↓ (webhook trigger)                │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│      Railway Dashboard              │
├─────────────────────────────────────┤
│  ✓ Node.js App (Live)               │
│  ✓ PostgreSQL Database              │
│  ✓ SSL Certificate                  │
│  ✓ Auto-scaling                     │
│                                     │
│  URL: app-name.railway.app          │
└─────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### GitHub Authentication Failed
```bash
# Re-authenticate with GitHub
gh auth logout
gh auth login

# Or use personal access token:
git clone https://github.com/YOUR_USERNAME/gst-payment-poc.git
cd gst-payment-poc
```

### Railway Deployment Failed
Check logs in Railway Dashboard:
```
Deployments → Click failed deployment → Logs
```

Common issues:
- Missing environment variables → Add them
- Google Cloud key missing → Upload file
- Database not connected → Check DATABASE_URL
- Port mismatch → Ensure PORT=3000

### App Shows 502 Bad Gateway
```bash
# Backend crashed
# In Railway Shell:
npm start

# Check for errors
tail -f logs
```

### Database Connection Error
```bash
# Verify DATABASE_URL is set
# In Railway Shell:
echo $DATABASE_URL

# Should output: postgresql://user:pass@host:port/dbname

# Test connection:
psql $DATABASE_URL -c "SELECT 1"
```

---

## 📚 Next Steps

After deployment:

1. **Test Endpoints**
   ```bash
   curl -X POST https://your-app.railway.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

2. **Monitor Performance**
   - Check Railway Dashboard daily
   - Monitor error logs
   - Track database performance

3. **Add Features**
   - Make code changes locally
   - Test on your machine
   - Push to GitHub
   - Railway auto-deploys

4. **Scale When Needed**
   - Monitor resource usage
   - Increase Railway instance size
   - Move to Fly.io if India region needed
   - Migrate to AWS for 100K+ users

---

## 💰 Current Costs

| Component | Cost/Month |
|-----------|-----------|
| Railway App | $10-15 |
| PostgreSQL | $5-10 |
| Domain (optional) | $1-2 |
| APIs (Razorpay, Google Vision) | $5-50 |
| **Total** | **$20-75** |

---

## 🎉 You're Done!

Your app is now:
✅ On GitHub (version control)
✅ Deployed to Railway (live)
✅ Running with PostgreSQL (database)
✅ Auto-scaling (handles traffic)
✅ CI/CD ready (auto-deploys on push)

**Share your Railway URL with friends to get feedback!** 🚀

---

## 📞 Support Resources

### GitHub
- Docs: https://docs.github.com
- Help: https://support.github.com
- Community: https://github.community

### Railway
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Git
- Guide: https://git-scm.com/book
- Cheat Sheet: https://github.github.io/training-kit/

---

**Questions? Check the documentation files in your repository!** 📚

# Hosting GST Payment Platform on Hostinger

## Hostinger Hosting Options Comparison

| Feature | Shared Hosting | WordPress Hosting | VPS Hosting | Cloud Hosting |
|---------|---|---|---|---|
| **Node.js Support** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **PostgreSQL** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Monthly Cost** | $2-5 | $2-10 | $3.99-8/mo | $8-15/mo |
| **Scalability** | ❌ Limited | ❌ Limited | ✅ Good | ✅ Excellent |
| **Recommended** | ❌ Not suitable | ❌ Not suitable | ⭐ GOOD for POC | ⭐ BEST for production |

---

## ✅ BEST OPTION: Hostinger VPS Hosting

### Why VPS is Best for Your App:
- Full root access (can install anything)
- Can run Node.js server
- Can install PostgreSQL database
- Sufficient resources for 10K-100K users
- Affordable (starts at ₹1,999/month)

---

## 📋 Hostinger VPS Setup Guide

### Step 1: Purchase VPS Hosting on Hostinger

1. Go to **hostinger.in** → Click "VPS Hosting"
2. Choose **KVM VPS** plan (recommended: 2GB RAM / 2 vCPU)
   - **₹1,999/month** for 1GB RAM (POC stage)
   - **₹2,999/month** for 2GB RAM (production)
   - **₹4,999/month** for 4GB RAM (scaling)

3. Select:
   - OS: **Ubuntu 20.04 LTS** (recommended for Node.js)
   - Billing: Monthly or Annual (Annual gives 30-40% discount)

4. Complete purchase → Get server IP address & login credentials

---

### Step 2: Connect via SSH

```bash
# On your computer (Mac/Linux/Windows PowerShell)
ssh root@YOUR_SERVER_IP

# You'll be asked for password (from Hostinger email)
# First time: you'll be asked to change password
```

**Windows users:** Use PuTTY or Windows PowerShell (v7+)

---

### Step 3: Update Server & Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js v16 LTS
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version    # Should show v16.x.x
npm --version     # Should show 8.x.x

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL
sudo -u postgres psql --version
```

---

### Step 4: Setup PostgreSQL Database

```bash
# Connect as postgres user
sudo -u postgres psql

# Inside PostgreSQL:
CREATE DATABASE gst_payment_db;
CREATE USER gst_user WITH PASSWORD 'Your_Strong_Password_123';
ALTER ROLE gst_user SET client_encoding TO 'utf8';
ALTER ROLE gst_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE gst_user SET default_transaction_deferrable TO on;
ALTER ROLE gst_user SET default_transaction_read_committed TO on;
GRANT ALL PRIVILEGES ON DATABASE gst_payment_db TO gst_user;
\q
```

**Now create tables:**
```bash
# Download schema from your local machine and upload
scp database/schema.sql root@YOUR_SERVER_IP:/home/schema.sql

# Back on server:
sudo -u postgres psql gst_payment_db < /home/schema.sql

# Verify tables created
sudo -u postgres psql gst_payment_db -c "\dt"
```

---

### Step 5: Clone & Setup Application

```bash
# Install Git
sudo apt install -y git curl

# Create app directory
mkdir -p /var/www/gst-payment-poc
cd /var/www/gst-payment-poc

# Clone repository
git clone <your-repo-url> .

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Paste this in .env (press Ctrl+X → Y → Enter to save):**
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://gst_user:Your_Strong_Password_123@localhost:5432/gst_payment_db
JWT_SECRET=generate-random-secret-key-here-min-32-chars
RAZORPAY_KEY=rzp_live_xxxxxx
RAZORPAY_SECRET=xxxxxx
GOOGLE_CLOUD_KEY_PATH=/var/www/gst-payment-poc/google-cloud-key.json
```

---

### Step 6: Upload Google Cloud Credentials

```bash
# On your computer:
scp google-cloud-key.json root@YOUR_SERVER_IP:/var/www/gst-payment-poc/

# Set permissions:
# (on server)
chmod 600 /var/www/gst-payment-poc/google-cloud-key.json
```

---

### Step 7: Setup Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/gst-payment
```

**Paste this config:**
```nginx
upstream gst_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Logging
    access_log /var/log/nginx/gst-payment-access.log;
    error_log /var/log/nginx/gst-payment-error.log;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req zone=general burst=20 nodelay;

    location / {
        proxy_pass http://gst_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Large file uploads (for receipts)
    client_max_body_size 50M;
}
```

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/gst-payment /etc/nginx/sites-enabled/
sudo nginx -t    # Test config
sudo systemctl restart nginx
```

---

### Step 8: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (automatic with Nginx plugin)
sudo systemctl enable certbot.timer
```

---

### Step 9: Setup PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start app with PM2
cd /var/www/gst-payment-poc
pm2 start server.js --name "gst-payment-api"

# Auto-start on server reboot
pm2 startup
pm2 save

# Monitor app
pm2 logs gst-payment-api
pm2 status
```

---

### Step 10: Setup Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-gst-db.sh
```

**Paste this:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/gst-payment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
sudo -u postgres pg_dump gst_payment_db | gzip > $BACKUP_DIR/gst_payment_db_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/gst_payment_db_$TIMESTAMP.sql.gz"
```

**Make executable & schedule:**
```bash
sudo chmod +x /usr/local/bin/backup-gst-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-gst-db.sh
```

---

### Step 11: Verify Everything Works

```bash
# Check if app is running
pm2 status

# Check logs
pm2 logs gst-payment-api

# Test API
curl https://your-domain.com/health

# Should return:
# {"status":"OK","timestamp":"2024-01-15T..."}
```

---

## 🔒 Security Hardening for Hostinger VPS

### Firewall Setup
```bash
# Install UFW firewall
sudo apt install -y ufw

# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# Verify
sudo ufw status
```

### SSH Security
```bash
# Create SSH key-based auth (more secure than password)
ssh-keygen -t rsa -b 4096

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub root@YOUR_SERVER_IP

# Disable password login
sudo nano /etc/ssh/sshd_config
# Change: PasswordAuthentication yes → no
# Uncomment: PubkeyAuthentication yes

sudo systemctl restart sshd
```

### Monitoring & Alerts
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor in real-time
htop

# Check disk usage
df -h

# Check database size
sudo -u postgres psql gst_payment_db -c "SELECT pg_size_pretty(pg_database_size('gst_payment_db'));"
```

---

## 📊 Performance Tuning for Hostinger VPS

### PostgreSQL Optimization
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/12/main/postgresql.conf
```

**Update these values:**
```
shared_buffers = 256MB           # For 2GB RAM, use 512MB
effective_cache_size = 1GB       # For 2GB RAM, use 1.5GB
maintenance_work_mem = 64MB
work_mem = 16MB
random_page_cost = 1.1
max_connections = 200
```

```bash
sudo systemctl restart postgresql
```

### Node.js Clustering (use more CPU cores)
```bash
# Edit server.js to use cluster module
npm install cluster
```

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
```

---

## 📈 Scaling as You Grow

### Stage 1: POC (Current - Hostinger VPS 1GB)
- Expected users: 100-500
- Cost: ₹1,999/month
- Sufficient for: Testing, MVP feedback

### Stage 2: Growth (Hostinger VPS 2GB)
- Expected users: 1,000-5,000
- Cost: ₹2,999/month
- Upgrade when: CPU usage > 70% consistently

### Stage 3: Production Scale (Hostinger Cloud / AWS)
- Expected users: 10,000+
- Cost: ₹10,000-50,000+/month
- Why migrate: Need load balancing, auto-scaling, CDN

**Migration path when scaling:**
```
Hostinger VPS → Hostinger Cloud → AWS/Digital Ocean
(1 server)      (2-3 servers)      (Auto-scaling)
```

---

## ✅ Post-Deployment Checklist

- [ ] Domain registered & pointing to Hostinger nameservers
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Nginx reverse proxy configured
- [ ] PostgreSQL database created with tables
- [ ] Google Cloud credentials uploaded
- [ ] Razorpay API keys configured
- [ ] PM2 process manager running
- [ ] Backups scheduled (daily)
- [ ] Firewall enabled (UFW)
- [ ] SSH key-based auth configured
- [ ] Health check passing: `curl https://your-domain.com/health`
- [ ] Frontend & API endpoints tested
- [ ] Error monitoring setup (optional but recommended)

---

## 🆘 Troubleshooting on Hostinger

### Node.js App Not Starting
```bash
pm2 logs gst-payment-api        # Check error logs
pm2 restart gst-payment-api     # Restart app
pm2 delete gst-payment-api      # Delete and restart clean
```

### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U gst_user -d gst_payment_db

# Verify .env DATABASE_URL has correct password
cat .env | grep DATABASE_URL
```

### High CPU/Memory Usage
```bash
# Check what's consuming resources
htop

# Kill stuck Node process
pm2 delete gst-payment-api
pm2 start server.js --name "gst-payment-api"

# Check PostgreSQL cache
sudo -u postgres psql gst_payment_db -c "ANALYZE;"
```

### Nginx 502 Bad Gateway
```bash
# Means Node.js server is down
pm2 status gst-payment-api

# Restart everything
pm2 restart gst-payment-api
sudo systemctl restart nginx
```

### SSL Certificate Issues
```bash
# Check certificate expiration
sudo certbot certificates

# Renew manually if needed
sudo certbot renew --force-renewal
```

---

## 💰 Cost Breakdown (Monthly)

| Component | Cost | Notes |
|-----------|------|-------|
| Hostinger VPS (1GB) | ₹1,999 | Escalate to 2GB (₹2,999) after 500 users |
| Domain | ₹200-500 | .com on Hostinger (₹400/year) |
| Google Cloud Vision API | ₹200-1000 | Based on API calls (free tier: 1000 calls/month) |
| Razorpay Transaction Fee | 1.5-2% | No fixed cost, payment-based |
| S3 File Storage (optional) | ₹100-500 | For storing receipt images (first 1GB free on AWS) |
| **Total** | **₹2,400-3,500** | + transaction fees |

---

## 🚀 Alternative: Simpler Approach (Recommended for First 3 Months)

If you want to **minimize ops overhead**, consider:

1. **Keep backend on Hostinger VPS** (₹1,999/month)
2. **Use Firebase/Supabase for database** instead of PostgreSQL
   - Easier to maintain
   - Auto-scaling included
   - Cost: ₹0-2000/month (pay-as-you-go)
3. **Use Vercel for frontend** (free-$20/month)
4. **Use Filebase for S3 alternative** (₹0-500/month)

**This reduces your DevOps work by 80%** and focuses you on building features.

---

## 📞 Support Resources

- **Hostinger Support:** Contact via panel → Support
- **Node.js Issues:** Stack Overflow, GitHub Issues
- **PostgreSQL Help:** postgresql.org/docs
- **PM2 Documentation:** pm2.io/docs

---

## ⏰ Expected Timeline

- **Day 1:** Purchase VPS, receive credentials
- **Day 1-2:** SSH setup, dependencies installation (2-3 hours of work)
- **Day 2-3:** Deploy app, configure Nginx, SSL setup (4-5 hours)
- **Day 3:** Testing, monitoring setup (2-3 hours)
- **Total:** ~8-10 hours of setup work

**After setup:** Minimal maintenance needed (just monitor PM2 & backups)

---

This setup will handle 10,000+ users comfortably on a ₹3,000/month VPS!

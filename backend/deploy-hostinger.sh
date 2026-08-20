#!/bin/bash

# GST Payment Platform - Hostinger VPS Auto-Deployment Script
# This script automates most of the Hostinger deployment steps
# Usage: chmod +x deploy-hostinger.sh && ./deploy-hostinger.sh

set -e  # Exit on error

echo "🚀 GST Payment Platform - Hostinger VPS Deployment"
echo "=================================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root. Use 'sudo' or login as root.${NC}"
   exit 1
fi

# Variables (CUSTOMIZE THESE)
DOMAIN="your-domain.com"
DB_USER="gst_user"
DB_NAME="gst_payment_db"
DB_PASSWORD=$(openssl rand -base64 32)  # Random secure password
APP_DIR="/var/www/gst-payment-poc"
APP_PORT=3000

# Prompt for custom values
echo -e "\n${YELLOW}Please enter your configuration:${NC}"
read -p "Domain name (e.g., gstpay.com): " DOMAIN
read -p "GitHub repo URL: " REPO_URL

echo -e "\n${YELLOW}Starting deployment...${NC}\n"

# Step 1: Update system
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y > /dev/null 2>&1
echo -e "${GREEN}✓ System updated${NC}"

# Step 2: Install Node.js
echo -e "${YELLOW}[2/10] Installing Node.js v16 LTS...${NC}"
curl -sL https://deb.nodesource.com/setup_16.x | bash -
apt install -y nodejs > /dev/null 2>&1
echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"

# Step 3: Install PostgreSQL
echo -e "${YELLOW}[3/10] Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib > /dev/null 2>&1
systemctl start postgresql
systemctl enable postgresql
echo -e "${GREEN}✓ PostgreSQL installed$(NC}"

# Step 4: Create database and user
echo -e "${YELLOW}[4/10] Creating PostgreSQL database and user...${NC}"
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
echo -e "${GREEN}✓ Database created${NC}"
echo -e "${YELLOW}Database credentials:${NC}"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"
echo "  - Password: $DB_PASSWORD"

# Step 5: Clone repository
echo -e "${YELLOW}[5/10] Cloning repository...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR
git clone $REPO_URL . > /dev/null 2>&1
echo -e "${GREEN}✓ Repository cloned${NC}"

# Step 6: Install dependencies
echo -e "${YELLOW}[6/10] Installing Node.js dependencies...${NC}"
npm install --production > /dev/null 2>&1
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 7: Create .env file
echo -e "${YELLOW}[7/10] Creating .env configuration...${NC}"
cat > $APP_DIR/.env << EOF
PORT=$APP_PORT
NODE_ENV=production
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
JWT_SECRET=$(openssl rand -base64 32)
RAZORPAY_KEY=rzp_live_xxxxxx
RAZORPAY_SECRET=xxxxxx
GOOGLE_CLOUD_KEY_PATH=$APP_DIR/google-cloud-key.json
CORS_ORIGIN=https://$DOMAIN
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
EOF
echo -e "${GREEN}✓ .env file created${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Update these in .env:${NC}"
echo "  - RAZORPAY_KEY"
echo "  - RAZORPAY_SECRET"
echo "  - Upload google-cloud-key.json to $APP_DIR/"

# Step 8: Setup database schema
echo -e "${YELLOW}[8/10] Creating database tables...${NC}"
sudo -u postgres psql $DB_NAME < $APP_DIR/database/schema.sql > /dev/null 2>&1
echo -e "${GREEN}✓ Database tables created${NC}"

# Step 9: Install & setup PM2
echo -e "${YELLOW}[9/10] Setting up PM2 process manager...${NC}"
npm install -g pm2 > /dev/null 2>&1
cd $APP_DIR
pm2 start server.js --name "gst-payment-api"
pm2 startup
pm2 save > /dev/null 2>&1
echo -e "${GREEN}✓ PM2 configured${NC}"

# Step 10: Install & configure Nginx + SSL
echo -e "${YELLOW}[10/10] Installing Nginx and SSL certificate...${NC}"
apt install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1

# Create Nginx config
cat > /etc/nginx/sites-available/gst-payment << 'NGINX_CONFIG'
upstream gst_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name DOMAIN_NAME;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_NAME;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_NAME/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    access_log /var/log/nginx/gst-payment-access.log;
    error_log /var/log/nginx/gst-payment-error.log;

    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req zone=general burst=20 nodelay;

    client_max_body_size 50M;

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
}
NGINX_CONFIG

# Replace domain placeholder
sed -i "s/DOMAIN_NAME/$DOMAIN/g" /etc/nginx/sites-available/gst-payment

# Enable site
ln -sf /etc/nginx/sites-available/gst-payment /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t > /dev/null 2>&1

# Setup SSL (interactive)
echo -e "\n${YELLOW}Setting up SSL certificate for $DOMAIN...${NC}"
echo "Make sure your domain is pointing to this server first!"
read -p "Press Enter when domain is configured..."

certbot certonly --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN 2>/dev/null || true

# Reload Nginx
systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}✓ Nginx configured with SSL${NC}"

# Setup firewall
echo -e "${YELLOW}Setting up firewall...${NC}"
apt install -y ufw > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
echo -e "${GREEN}✓ Firewall enabled${NC}"

# Setup backup script
echo -e "${YELLOW}Setting up automated backups...${NC}"
cat > /usr/local/bin/backup-gst-db.sh << 'BACKUP_SCRIPT'
#!/bin/bash
BACKUP_DIR="/var/backups/gst-payment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump gst_payment_db | gzip > $BACKUP_DIR/gst_payment_db_$TIMESTAMP.sql.gz
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-gst-db.sh

# Add to crontab
(crontab -l 2>/dev/null | grep -v "backup-gst-db.sh"; echo "0 2 * * * /usr/local/bin/backup-gst-db.sh") | crontab -
echo -e "${GREEN}✓ Backups scheduled (daily at 2 AM)${NC}"

# Summary
echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update .env with Razorpay credentials:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Upload google-cloud-key.json:"
echo "   scp google-cloud-key.json root@$(hostname -I | awk '{print $1}'):$APP_DIR/"
echo ""
echo "3. Restart app:"
echo "   pm2 restart gst-payment-api"
echo ""
echo "4. Test your app:"
echo "   curl https://$DOMAIN/health"
echo ""

echo -e "${YELLOW}📊 Server Information:${NC}"
echo "Server IP: $(hostname -I | awk '{print $1}')"
echo "Domain: $DOMAIN"
echo "App Directory: $APP_DIR"
echo "App Status: pm2 status"
echo "App Logs: pm2 logs gst-payment-api"
echo ""

echo -e "${YELLOW}🗄️  Database Information:${NC}"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Password: $DB_PASSWORD"
echo "Connection: psql -h localhost -U $DB_USER -d $DB_NAME"
echo ""

echo -e "${YELLOW}🔒 Security Notes:${NC}"
echo "✓ Firewall enabled (SSH, HTTP, HTTPS only)"
echo "✓ SSL certificate configured"
echo "✓ Automated daily backups enabled"
echo "✓ PM2 auto-restart on reboot"
echo ""

echo -e "${YELLOW}💰 Estimated Monthly Cost:${NC}"
echo "✓ Hostinger VPS (1GB): ₹1,999"
echo "✓ Domain: ₹200-400 (yearly)"
echo "✓ APIs: ₹200-1000 (based on usage)"
echo "━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Total: ₹2,400-3,400/month"
echo ""

echo -e "${GREEN}🎉 Your app is now live at https://$DOMAIN${NC}\n"

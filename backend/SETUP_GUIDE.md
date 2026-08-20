# GST Payment Platform - POC Setup Guide

## Overview
This is a Proof of Concept for a GST-compliant payment app in India that allows users to:
1. Scan receipts and extract vendor/tax details via OCR
2. Process UPI payments
3. Automatically calculate GST and track input tax credit
4. Generate GSTR reports for government filing

---

## Prerequisites

### Required Software
- **Node.js** v16+ (LTS recommended)
- **PostgreSQL** v12+
- **Docker** (optional, for containerization)
- **Git**

### Required API Credentials
1. **Google Cloud Vision API** - For OCR receipt scanning
2. **Razorpay** - For UPI payment processing (free test account available)
3. **AWS S3** - For storing receipt images (free tier available)

---

## Installation Steps

### Step 1: Clone & Setup Project
```bash
git clone <repository-url> gst-payment-poc
cd gst-payment-poc

npm install
```

### Step 2: Setup PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Create database
createdb gst_payment_db

# Run schema
psql gst_payment_db < database/schema.sql

# Verify tables
psql gst_payment_db -c "\dt"
```

#### Option B: Docker PostgreSQL
```bash
docker run --name postgres-gst \
  -e POSTGRES_DB=gst_payment_db \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Wait for container to start (5-10 seconds)
docker exec postgres-gst psql -U postgres -d gst_payment_db -f database/schema.sql
```

### Step 3: Configure Environment Variables

```bash
# Copy example config
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Critical settings to update:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/gst_payment_db
JWT_SECRET=your-random-secret-key-here

# Get these from respective dashboards
RAZORPAY_KEY=rzp_test_xxxxxxx
RAZORPAY_SECRET=xxxxxxx
GOOGLE_CLOUD_KEY_PATH=./google-cloud-key.json
```

### Step 4: Setup Google Cloud Vision (For OCR)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "GST Payment POC"
3. Enable "Cloud Vision API"
4. Create Service Account
5. Download JSON key file
6. Save to project root: `google-cloud-key.json`

```bash
# Verify connection
npm run test:ocr
```

### Step 5: Setup Razorpay (For Payments)

1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Switch to **Test Mode** (default)
3. Copy Test Key ID and Test Secret
4. Paste into `.env` file

**Test UPI Credentials:**
- Test UPI: `success@razorpay`
- Test Amount: Any amount (will be auto-captured in test mode)

### Step 6: Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm run start
```

**Expected output:**
```
GST Payment API running on port 3000
Database connected successfully
✓ Server ready at http://localhost:3000
```

---

## Frontend Setup (Optional - for full stack testing)

### Install React Frontend
```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

---

## API Endpoints Reference

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
```

### Invoices
```
POST /api/invoices/upload          → Upload receipt & OCR extraction
POST /api/invoices                 → Create invoice manually
GET  /api/invoices                 → List user's invoices
GET  /api/invoices/:invoiceId      → Get invoice details
PUT  /api/invoices/:invoiceId      → Update invoice
```

### Payments
```
POST /api/payments/initiate         → Start UPI payment
POST /api/payments/verify           → Verify payment after transaction
GET  /api/payments/:invoiceId       → Get payment status
GET  /api/payments                  → List payments
```

### GST Reports
```
GET  /api/gst/monthly-summary/:month    → Get GST summary for month
GET  /api/gst/gstr-2a/:month            → Generate GSTR-2A XML
GET  /api/gst/gstr-3b/:month            → Generate GSTR-3B XML
POST /api/gst/validate/:month           → Validate GSTR data
POST /api/gst/submit/:month             → Submit GSTR to portal (when available)
```

---

## Testing the POC

### Test Workflow

**1. Upload Receipt & Extract Data**
```bash
curl -X POST http://localhost:3000/api/invoices/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "receipt=@sample-receipt.jpg" \
  -F "payer_gstin=27AABCT0045A1Z0"
```

**2. Create Invoice Manually**
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "ABC Electronics",
    "vendor_gstin": "18AABCT0045A1Z0",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-01-15",
    "subtotal_amount": 75000,
    "tax_rate": 18,
    "transaction_type": "B2B",
    "payer_gstin": "27AABCT0045A1Z0"
  }'
```

**3. Initiate Payment**
```bash
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "uuid-from-previous-response",
    "amount": 88500
  }'
```

**Response includes:**
```json
{
  "razorpay_order_id": "order_...",
  "key": "rzp_test_...",
  "amount": 88500
}
```

**4. Generate GST Report**
```bash
curl -X GET "http://localhost:3000/api/gst/monthly-summary/2024-01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Project Structure

```
gst-payment-poc/
├── server.js                      # Entry point
├── database/
│   └── schema.sql                 # PostgreSQL schema
├── services/
│   ├── invoiceService.js          # OCR & invoice processing
│   ├── paymentService.js          # UPI payment handling
│   ├── gstService.js              # GST calculations & reporting
│   └── emailService.js            # Notifications
├── routes/
│   ├── auth.js                    # Authentication
│   ├── invoices.js                # Invoice endpoints
│   ├── payments.js                # Payment endpoints
│   └── gst.js                     # GST report endpoints
├── middleware/
│   ├── auth.js                    # JWT verification
│   └── errorHandler.js            # Error handling
├── utils/
│   ├── validators.js              # Input validation
│   └── logger.js                  # Logging
└── tests/
    ├── invoices.test.js
    ├── payments.test.js
    └── gst.test.js
```

---

## Deployment Guide

### Local Development
```bash
npm run dev
```

### Docker Container
```bash
# Build image
docker build -t gst-payment-poc .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://host.docker.internal:5432/gst_payment_db \
  -e JWT_SECRET=your-secret \
  -e RAZORPAY_KEY=rzp_test_xxx \
  gst-payment-poc
```

### AWS EC2 Deployment
```bash
# Connect to EC2
ssh -i key.pem ubuntu@your-instance-ip

# Install dependencies
sudo apt update && sudo apt install nodejs npm postgresql

# Clone repo & setup
git clone <repo>
cd gst-payment-poc
npm install

# Setup PM2 for process management
npm install -g pm2
pm2 start server.js --name "gst-api"
pm2 startup
pm2 save
```

### Heroku Deployment
```bash
heroku login
heroku create gst-payment-poc
heroku addons:create heroku-postgresql:hobby-dev

git push heroku main

heroku logs --tail
```

---

## Important Configuration Notes

### Database Backup (6-year retention requirement)
```bash
# Daily backup script
*/0 * * * * pg_dump gst_payment_db > /backups/gst_payment_$(date +\%Y\%m\%d).sql

# Monthly archive to S3
aws s3 cp /backups/ s3://gst-backups/ --recursive --storage-class GLACIER
```

### Security Checklist
- [ ] Change JWT_SECRET to random 32+ char string
- [ ] Use HTTPS in production (update CORS_ORIGIN)
- [ ] Enable database encryption at rest
- [ ] Implement rate limiting (99 req/min per user)
- [ ] Enable audit logging for all transactions
- [ ] Set up PCI-DSS compliance (use tokenization, avoid storing card data)
- [ ] Implement CSRF protection
- [ ] Add input validation on all endpoints

### Performance Tuning
```sql
-- Add more indices for high-volume queries
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_invoices_vendor_gstin ON invoices(vendor_id);
CREATE INDEX idx_gst_summary_filed ON gst_monthly_summary(gstr_status);

-- Enable connection pooling
-- In .env: DATABASE_URL=postgresql://...?pool=10
```

---

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Ensure PostgreSQL is running
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Docker
docker start postgres-gst
```

### OCR Not Working
```
Error: Google Cloud credentials not found
```
**Solution:** Verify `google-cloud-key.json` exists and path is correct in `.env`

### Payment Gateway Failing
```
Error: Razorpay authentication failed
```
**Solution:** 
1. Verify you're using TEST keys (not LIVE)
2. Check keys don't have extra spaces
3. Ensure Razorpay account is activated

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

## Next Steps for Production

1. **GSTIN Verification API Access** - Apply to GST department for official API
2. **E-signing Integration** - Implement for GSTR submission
3. **Multi-currency Support** - Add INR conversion handling
4. **Advanced Analytics** - Build dashboards for government oversight
5. **Mobile App** - Build native iOS/Android apps
6. **White-label** - Package as SaaS for tax consultants

---

## Support & Documentation

- **API Docs**: Run `npm run docs` → Opens Swagger UI
- **Test Cases**: `npm test`
- **Performance Report**: `npm run perf`

---

## License
Proprietary - GST Payment Platform POC

---

## Contact
For issues or questions, contact: poc@gstpaymentplatform.dev

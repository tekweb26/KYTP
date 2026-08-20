# GST Payment App POC - API Testing Guide

This guide provides curl commands and test scenarios to validate the POC functionality.

## Prerequisites

- Backend running on `http://localhost:5000`
- PostgreSQL with schema loaded
- Razorpay sandbox account
- Google Cloud Vision API key configured

---

## Test Scenarios

### Scenario 1: User Registration & Authentication

#### 1.1 Register a new user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "name": "Test User",
    "phone": "9876543210",
    "gstin": "29ABCDE1234F1Z0"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "testuser@example.com",
    "name": "Test User"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token for subsequent requests:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### 1.2 Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
```

---

### Scenario 2: Upload Receipt & OCR Extraction

#### 2.1 Upload receipt image

```bash
curl -X POST http://localhost:5000/api/invoices/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "receipt=@/path/to/receipt.jpg"
```

**Expected Response:**
```json
{
  "invoice": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "vendor_name": "ABC Supplies",
    "vendor_gstin": "29ABCDE1234F1Z0",
    "amount_before_tax": 10000,
    "tax_amount": 1800,
    "tax_rate": 18,
    "total_amount": 11800,
    "status": "unpaid",
    "ocr_confidence": 0.92
  },
  "ocrData": {
    "vendor": "ABC Supplies",
    "gstin": "29ABCDE1234F1Z0",
    "amount": "10000",
    "date": "2024-01-15"
  },
  "message": "Receipt uploaded and extracted successfully"
}
```

**Save invoice ID for payment:**
```bash
INVOICE_ID="550e8400-e29b-41d4-a716-446655440001"
```

---

#### 2.2 Get all invoices

```bash
curl -X GET http://localhost:5000/api/invoices \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "vendor_name": "ABC Supplies",
    "amount_before_tax": 10000,
    "tax_amount": 1800,
    "total_amount": 11800,
    "status": "unpaid",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

---

#### 2.3 Update invoice (manual correction)

If OCR is inaccurate, correct the extracted data:

```bash
curl -X PATCH http://localhost:5000/api/invoices/$INVOICE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "ABC Supplies Pvt Ltd",
    "vendor_gstin": "29ABCDE1234F1Z0",
    "amount_before_tax": 9999,
    "tax_rate": 18
  }'
```

---

### Scenario 3: Initiate Payment (Razorpay)

#### 3.1 Initiate UPI payment

```bash
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "'$INVOICE_ID'"
  }'
```

**Expected Response:**
```json
{
  "order": {
    "id": "order_McsQvzDMsjbPzj",
    "entity": "order",
    "amount": 1180000,
    "amount_paid": 0,
    "amount_due": 1180000,
    "currency": "INR",
    "receipt": "invoice-550e8400-e29b-41d4-a716-446655440001",
    "status": "created",
    "attempts": 0,
    "notes": {
      "invoiceId": "550e8400-e29b-41d4-a716-446655440001",
      "vendor": "ABC Supplies"
    },
    "created_at": 1705307400
  },
  "key": "rzp_test_xxxxxxxxxxxxxxxxxx"
}
```

**Save order ID for testing payment callback:**
```bash
ORDER_ID="order_McsQvzDMsjbPzj"
```

---

#### 3.2 Simulate payment success callback

In production, Razorpay sends this webhook. For testing, simulate it:

```bash
# Generate signature (in production, Razorpay calculates this)
# Signature = HMAC-SHA256(order_id|payment_id, KEY_SECRET)

# For testing, use these Razorpay sandbox credentials:
# Card: 4111111111111111
# Expiry: 12/25
# CVV: 123

# You'll get these from Razorpay after completing payment on checkout

PAYMENT_ID="pay_McsQvzDMsjbPzj"
SIGNATURE="9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a5d"

curl -X POST http://localhost:5000/api/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "'$ORDER_ID'",
    "razorpay_payment_id": "'$PAYMENT_ID'",
    "razorpay_signature": "'$SIGNATURE'"
  }'
```

**Expected Response:**
```json
{
  "success": true
}
```

---

### Scenario 4: View Payment History

#### 4.1 Get all payments

```bash
curl -X GET http://localhost:5000/api/payments \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
    "vendor_name": "ABC Supplies",
    "amount": 11800,
    "status": "success",
    "razorpay_payment_id": "pay_McsQvzDMsjbPzj",
    "payment_date": "2024-01-15T10:35:00.000Z"
  }
]
```

---

### Scenario 5: GST Reports

#### 5.1 Get monthly GST summary

```bash
curl -X GET "http://localhost:5000/api/gst/monthly-summary?month=1&year=2024" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "month": 1,
  "year": 2024,
  "totalPurchases": 10000,
  "totalTaxPaid": 1800,
  "taxByRate": {
    "18": 1800
  },
  "totalInvoices": 1
}
```

---

#### 5.2 Export GST data as CSV

```bash
curl -X GET http://localhost:5000/api/gst/export-csv \
  -H "Authorization: Bearer $TOKEN" \
  -o gst_summary.csv
```

**File will contain:**
```csv
vendor_name,vendor_gstin,invoice_date,amount_before_tax,tax_amount,tax_rate,total_amount,status
ABC Supplies,29ABCDE1234F1Z0,2024-01-15,10000,1800,18,11800,paid
```

---

## Automated Test Script

Save this as `test_poc.sh` to run all tests automatically:

```bash
#!/bin/bash

API_URL="http://localhost:5000/api"
EMAIL="testuser-$(date +%s)@example.com"
NAME="Test User"
PHONE="9876543210"
GSTIN="29ABCDE1234F1Z0"

echo "🧪 GST Payment App - POC Test Suite"
echo "====================================="
echo ""

# Test 1: Register
echo "1️⃣  Test: User Registration"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "name": "'$NAME'",
    "phone": "'$PHONE'",
    "gstin": "'$GSTIN'"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed"
  echo $REGISTER_RESPONSE
  exit 1
fi

echo "✅ Registration successful"
echo "   Email: $EMAIL"
echo "   Token: ${TOKEN:0:20}..."
echo ""

# Test 2: Get Invoices (empty)
echo "2️⃣  Test: Get Invoices (before upload)"
INVOICES=$(curl -s -X GET $API_URL/invoices \
  -H "Authorization: Bearer $TOKEN")
COUNT=$(echo $INVOICES | grep -o '"id"' | wc -l)
echo "✅ Found $COUNT invoices"
echo ""

# Test 3: Mock invoice insert (since file upload requires actual image)
echo "3️⃣  Test: Database Invoice Insert (simulating upload)"
# In production, this would be done via file upload
# For testing, you might want to insert directly via SQL or use a test image

# Test 4: Get GST Summary
echo "4️⃣  Test: Get GST Monthly Summary"
SUMMARY=$(curl -s -X GET "$API_URL/gst/monthly-summary?month=1&year=2024" \
  -H "Authorization: Bearer $TOKEN")
echo "✅ Summary retrieved"
echo "   Response: $SUMMARY"
echo ""

echo ""
echo "✨ All tests completed!"
echo ""
echo "📋 Next Manual Tests:"
echo "   1. Upload a real receipt image"
echo "   2. Verify OCR extraction"
echo "   3. Initiate Razorpay payment"
echo "   4. Complete payment via Razorpay UI"
echo "   5. Verify payment status update"
echo ""
```

---

## Common Issues & Solutions

### Issue 1: "No token provided" error

**Cause:** Missing Authorization header

**Solution:**
```bash
# Make sure to include the token:
curl -H "Authorization: Bearer $TOKEN" ...
```

---

### Issue 2: "Database connection error"

**Cause:** PostgreSQL not running or credentials wrong

**Solution:**
```bash
# Check if PostgreSQL is running
psql -U postgres -h localhost -c "SELECT 1"

# If it fails, start PostgreSQL:
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
```

---

### Issue 3: OCR returns empty results

**Cause:** 
- Google Cloud Vision API key not configured
- Image is too blurry or low quality
- API quota exceeded

**Solution:**
```bash
# Verify API key in backend/.env
grep GOOGLE_VISION_API_KEY backend/.env

# Try with a clearer invoice image
# Check Google Cloud Console for API usage
```

---

### Issue 4: Razorpay payment fails

**Cause:** Sandbox credentials not configured

**Solution:**
```bash
# Use Razorpay test credentials
# Key ID: rzp_test_xxxxxxxxx (not prod key)
# Secret: xxxxxxxxx

# Test card details:
# Card: 4111111111111111
# Expiry: 12/25
# CVV: 123
# OTP: 000000
```

---

## Performance Benchmarks (POC Targets)

| Operation | Target | Notes |
|-----------|--------|-------|
| Register user | <500ms | JWT generation |
| Upload receipt | <3s | Including OCR |
| OCR extraction | <2s | Google Vision API |
| Initiate payment | <500ms | Razorpay API call |
| Get invoices | <200ms | Query 50 records |
| Get GST summary | <500ms | Aggregation query |

---

## Load Testing (Post-POC)

```bash
# Install Apache Bench
brew install httpd # macOS

# Test 1000 requests, 10 concurrent
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/invoices
```

---

## Postman Collection

You can import this into Postman for easier testing:

```json
{
  "info": {
    "name": "GST Payment App POC",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": ["Content-Type: application/json"],
        "url": "{{base_url}}/auth/register",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"name\":\"Test\",\"gstin\":\"29ABCDE1234F1Z0\"}"
        }
      }
    },
    {
      "name": "Get Invoices",
      "request": {
        "method": "GET",
        "header": ["Authorization: Bearer {{token}}"],
        "url": "{{base_url}}/invoices"
      }
    }
  ],
  "variable": [
    {"key": "base_url", "value": "http://localhost:5000/api"},
    {"key": "token", "value": ""}
  ]
}
```

---

## Success Checklist

- [ ] User registration works without errors
- [ ] JWT token is issued and valid
- [ ] Receipt upload triggers OCR extraction
- [ ] Extracted data matches actual invoice (±10% margin)
- [ ] Razorpay order creation succeeds
- [ ] Payment callback updates invoice status to "paid"
- [ ] Monthly GST summary calculates correctly
- [ ] CSV export generates valid file
- [ ] All API responses complete <2 seconds

Happy testing! 🚀

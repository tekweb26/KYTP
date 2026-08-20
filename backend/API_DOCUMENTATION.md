# GST Payment Platform - API Documentation

## Base URL
```
Development: http://localhost:3000
Production: https://api.gstpayment.dev
```

## Authentication
All endpoints (except `/auth`) require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "user_type": "business",           // or "individual"
  "phone_number": "9876543210",
  "business_name": "ABC Enterprises", // Required if user_type=business
  "pan_number": "ABCDE1234F"
}
```

**Response (201):**
```json
{
  "success": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 604800
}
```

---

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "user_type": "business",
    "gstin": null,
    "kyc_status": "pending"
  },
  "expires_in": 604800
}
```

---

### 3. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Invoice Endpoints

### 1. Upload Receipt & Extract via OCR
```http
POST /api/invoices/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

--form
receipt: @/path/to/receipt.jpg
payer_gstin: 27AABCT0045A1Z0
transaction_type: B2B
```

**Response (200):**
```json
{
  "success": true,
  "extracted_data": {
    "vendor_name": "ABC Electronics Pvt Ltd",
    "vendor_gstin": "18AABCT0045A1Z0",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-01-15",
    "subtotal_amount": 75000,
    "line_items": [
      {
        "description": "Laptop (Dell XPS 13)",
        "quantity": 1,
        "unit_price": 85000,
        "line_total": 85000
      },
      {
        "description": "Mouse (Logitech)",
        "quantity": 2,
        "unit_price": 2500,
        "line_total": 5000
      }
    ],
    "ocr_confidence": 92.5,
    "gstin_verified": true,
    "gstin_status": "Active",
    "gst_details": {
      "subtotal": 75000,
      "tax_rate": 18,
      "sgst": 6750,
      "cgst": 6750,
      "igst": 0,
      "total_tax": 13500,
      "invoice_total": 88500
    }
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid vendor GSTIN",
  "details": "GSTIN verification failed - not found in database"
}
```

---

### 2. Create Invoice (Manual Entry)
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendor_name": "ABC Electronics Pvt Ltd",
  "vendor_gstin": "18AABCT0045A1Z0",
  "invoice_number": "INV-2024-001",
  "invoice_date": "2024-01-15",
  "subtotal_amount": 75000,
  "tax_rate": 18,
  "transaction_type": "B2B",
  "payer_gstin": "27AABCT0045A1Z0",
  "line_items": [
    {
      "description": "Product A",
      "quantity": 1,
      "unit_price": 50000,
      "line_total": 50000,
      "hsn_code": "847920"
    },
    {
      "description": "Product B",
      "quantity": 1,
      "unit_price": 25000,
      "line_total": 25000,
      "hsn_code": "847130"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
  "gst_details": {
    "subtotal": 75000,
    "tax_rate": 18,
    "sgst": 6750,
    "cgst": 6750,
    "igst": 0,
    "total_tax": 13500,
    "invoice_total": 88500
  },
  "total_amount": 88500
}
```

---

### 3. Get Invoice Details
```http
GET /api/invoices/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "invoice": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-01-15",
    "vendor_name": "ABC Electronics Pvt Ltd",
    "vendor_gstin": "18AABCT0045A1Z0",
    "subtotal_amount": 75000,
    "tax_amount": 13500,
    "total_amount": 88500,
    "sgst_amount": 6750,
    "cgst_amount": 6750,
    "igst_amount": 0,
    "status": "pending",
    "line_items": [
      {
        "description": "Laptop (Dell XPS 13)",
        "quantity": 1,
        "unit_price": 85000,
        "line_total": 85000
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4. List Invoices
```http
GET /api/invoices?status=pending&limit=20&offset=0
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: pending, fully_paid, partial_paid, cancelled (optional)
- `limit`: Results per page (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "invoices": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "invoice_number": "INV-2024-001",
      "vendor_name": "ABC Electronics",
      "total_amount": 88500,
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

### 5. Update Invoice
```http
PUT /api/invoices/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendor_name": "ABC Electronics Updated",
  "subtotal_amount": 80000,
  "tax_rate": 18
}
```

**Response (200):**
```json
{
  "success": true,
  "invoice": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "invoice_number": "INV-2024-001",
    "subtotal_amount": 80000,
    "tax_amount": 14400,
    "total_amount": 94400,
    "sgst_amount": 7200,
    "cgst_amount": 7200,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

---

## Payment Endpoints

### 1. Initiate UPI Payment
```http
POST /api/payments/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
  "amount": 88500,
  "vendor_gstin": "18AABCT0045A1Z0"
}
```

**Response (200):**
```json
{
  "success": true,
  "payment_id": "pay_550e8400e29b",
  "razorpay_order_id": "order_1A2B3C4D5E6F",
  "amount": 88500,
  "currency": "INR",
  "key": "rzp_test_xxxxxxxxxxxxxxxx",
  "invoice_number": "INV-2024-001",
  "vendor_name": "ABC Electronics Pvt Ltd"
}
```

**How to use in frontend:**
```javascript
const options = {
  key: response.key,
  amount: response.amount * 100, // Convert to paise
  currency: 'INR',
  order_id: response.razorpay_order_id,
  handler: function(response) {
    // Verify payment on backend
    verifyPayment(response);
  },
  prefill: {
    email: 'user@example.com'
  }
};
const rzp = new Razorpay(options);
rzp.open();
```

---

### 2. Verify Payment
```http
POST /api/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_1A2B3C4D5E6F",
  "razorpay_payment_id": "pay_1A2B3C4D5E6F",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d",
  "invoice_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response (200):**
```json
{
  "success": true,
  "payment_id": "pay_550e8400e29b",
  "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
  "amount": 88500,
  "status": "success",
  "upi_ref": "UPI202401150001",
  "message": "Payment successful. Transaction recorded for GST compliance."
}
```

---

### 3. Get Payment Status
```http
GET /api/payments/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "payment": {
    "id": "pay_550e8400e29b",
    "invoice_id": "550e8400-e29b-41d4-a716-446655440001",
    "amount_paid": 88500,
    "status": "success",
    "upi_transaction_id": "UPI202401150001",
    "payment_date": "2024-01-15T10:35:00Z"
  }
}
```

---

## GST Reporting Endpoints

### 1. Get Monthly GST Summary
```http
GET /api/gst/monthly-summary/2024-01
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "summary": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "year_month": "2024-01",
    "b2b_purchases_count": 3,
    "b2b_purchase_amount": 250000,
    "b2b_sgst": 22500,
    "b2b_cgst": 22500,
    "b2b_igst": 0,
    "b2c_purchases_count": 2,
    "b2c_purchase_amount": 50000,
    "b2c_tax": 9000,
    "total_itc": 54000,
    "gstr_status": "draft"
  }
}
```

---

### 2. Generate GSTR-2A (Purchase Register)
```http
GET /api/gst/gstr-2a/2024-01
Authorization: Bearer <token>
Accept: application/xml
```

**Response (200):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<GSTR2A>
  <Header>
    <gstin>27AABCT0045A1Z0</gstin>
    <period>2024-01</period>
  </Header>
  <Summary>
    <total_purchases>5</total_purchases>
    <total_amount>300000</total_amount>
    <total_itc>54000</total_itc>
  </Summary>
  <B2B>
    <Record>
      <inv_no>INV-2024-001</inv_no>
      <inv_date>2024-01-15</inv_date>
      <supplier_gstin>18AABCT0045A1Z0</supplier_gstin>
      <invoice_value>88500</invoice_value>
      <sgst>6750</sgst>
      <cgst>6750</cgst>
    </Record>
  </B2B>
</GSTR2A>
```

---

### 3. Generate GSTR-3B (Monthly Return)
```http
GET /api/gst/gstr-3b/2024-01
Authorization: Bearer <token>
Accept: application/json
```

**Response (200):**
```json
{
  "success": true,
  "gstr_3b": {
    "gstin": "27AABCT0045A1Z0",
    "month": "2024-01",
    "purchases": {
      "b2b_value": 250000,
      "b2b_sgst": 22500,
      "b2b_cgst": 22500,
      "b2b_igst": 0,
      "reverse_charge": {
        "value": 0,
        "tax": 0
      }
    },
    "tax_summary": {
      "total_itc": 54000,
      "total_sgst": 22500,
      "total_cgst": 22500,
      "total_igst": 0
    },
    "status": "draft"
  }
}
```

---

### 4. Validate GSTR Data
```http
POST /api/gst/validate/2024-01
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": [
    "No IGST claimed despite interstate transactions"
  ],
  "summary": {
    "total_purchases": 5,
    "total_itc": 54000
  }
}
```

---

### 5. Submit GSTR to Portal
```http
POST /api/gst/submit/2024-01
Authorization: Bearer <token>
Content-Type: application/json

{
  "format": "GSTR-3B",
  "declaration": true
}
```

**Response (200):**
```json
{
  "success": true,
  "format": "GSTR-3B",
  "month": "2024-01",
  "filed_at": "2024-01-20T14:30:00Z",
  "acknowledgement_number": "GSTR3B20240120123456",
  "status": "filed"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "invoice_number": "Invoice number is required",
    "subtotal_amount": "Must be a positive number"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "details": "Invalid or expired token",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 404 Not Found
```json
{
  "error": "Invoice not found",
  "details": "Invoice with ID 550e8400-e29b-41d4-a716-446655440001 does not exist",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "details": "Database connection failed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error - Internal error |

---

## Rate Limiting

All endpoints are rate-limited to **100 requests per 15 minutes** per user.

Response headers include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642355400
```

---

## Testing

### Test Credentials
- **Test GSTIN (Payer):** `27AABCT0045A1Z0`
- **Test GSTIN (Vendor):** `18AABCT0045A1Z0`
- **Test UPI:** `success@razorpay`
- **Test Amount:** Any amount (auto-captured in test mode)

### Example cURL Tests
```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!","user_type":"business"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}'

# 3. Create Invoice
curl -X POST http://localhost:3000/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_gstin":"18AABCT0045A1Z0",
    "invoice_number":"INV-TEST-001",
    "subtotal_amount":75000,
    "transaction_type":"B2B"
  }'
```

---

## Webhook Events (Future)

Webhooks will be available for:
- `payment.success` - Payment completed
- `payment.failed` - Payment failed
- `gst.filed` - GSTR submission completed
- `gst.validation_error` - GST validation failed

---

For more help: https://docs.gstpayment.dev

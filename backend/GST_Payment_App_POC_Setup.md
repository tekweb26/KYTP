# GST Payment App - Proof of Concept (POC)

## 📋 POC Scope & Objectives

### What We're Building
A working prototype demonstrating:
1. Receipt upload/scanning (OCR extraction)
2. UPI payment processing
3. Payment recording against invoice
4. Basic GST calculation & aggregation

### What We're NOT Building (Out of Scope)
- Government GSTR submission
- Multi-user RBAC
- Admin portal
- Advanced analytics

### Success Criteria
- ✅ Scan/upload receipt → Extract vendor name, amount, tax
- ✅ Initiate UPI payment → Record transaction reference
- ✅ View payment history with GST breakdown
- ✅ Generate monthly GST summary (local export only)

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+ (or Python 3.9+)
- **Framework**: Express.js (lightweight, fast to build)
- **Database**: PostgreSQL (local development) or MongoDB (if already using)
- **File Storage**: Local filesystem (POC phase; upgrade to S3 later)
- **Authentication**: JWT tokens (Firebase optional)

### Frontend
- **Framework**: React 18 (or vanilla HTML/JS for speed)
- **UI**: Tailwind CSS (rapid prototyping)
- **Mobile**: React Native Expo (optional; web-first for POC)
- **Payment**: Razorpay SDK (test/sandbox mode)
- **OCR**: Google Cloud Vision API (free tier: 1000 requests/month)

### External Services (Sandbox/Freemium)
- **OCR**: Google Cloud Vision (free tier)
- **UPI Payments**: Razorpay (sandbox account, ₹0 setup)
- **Hosting**: Heroku (free tier) or Vercel (frontend only)
- **Database**: PostgreSQL on Railway or Supabase (free tier)

---

## 📐 Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  gstin VARCHAR(15) UNIQUE,
  phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table (uploaded receipts)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  vendor_name VARCHAR(200),
  vendor_gstin VARCHAR(15),
  invoice_date DATE,
  invoice_number VARCHAR(50),
  amount_before_tax DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  tax_rate INT, -- 0, 5, 12, 18, 28
  total_amount DECIMAL(10, 2),
  receipt_image_path VARCHAR(255), -- path to stored image
  ocr_confidence FLOAT, -- 0.0 to 1.0
  status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, paid, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  user_id UUID REFERENCES users(id),
  payment_reference VARCHAR(50) UNIQUE, -- UPI ref or transaction ID
  upi_txn_id VARCHAR(100),
  amount DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed
  payment_method VARCHAR(20) DEFAULT 'upi', -- upi, card, netbanking
  payment_date TIMESTAMP,
  razorpay_payment_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GST Summary (monthly aggregation)
CREATE TABLE gst_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  month INT,
  year INT,
  total_purchases DECIMAL(12, 2),
  total_tax_paid DECIMAL(12, 2),
  tax_rate_breakdown JSONB, -- { "5": 1000, "12": 5000, "18": 10000 }
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month, year)
);

-- Indexes for performance
CREATE INDEX idx_invoices_user_date ON invoices(user_id, created_at DESC);
CREATE INDEX idx_payments_user_date ON payments(user_id, created_at DESC);
CREATE INDEX idx_gst_summary_user ON gst_summary(user_id, year DESC, month DESC);
```

---

## 🔌 API Endpoints (Backend)

### Authentication
```
POST   /auth/register          - Register user with email/phone
POST   /auth/login             - Login, return JWT token
POST   /auth/logout            - Invalidate token
```

### Invoice Management
```
POST   /invoices/upload        - Upload receipt image → trigger OCR
GET    /invoices               - Get all invoices for logged-in user
GET    /invoices/:id           - Get invoice details (with OCR data)
PATCH  /invoices/:id           - Update extracted fields (correction)
DELETE /invoices/:id           - Delete invoice
```

### Payments
```
POST   /payments/initiate      - Create Razorpay order for invoice
POST   /payments/callback      - Webhook from Razorpay (payment status)
GET    /payments               - Get payment history
GET    /payments/:id           - Get payment details
```

### GST Reports
```
GET    /gst/monthly-summary    - Get monthly aggregated GST data
GET    /gst/export-csv         - Export GST summary as CSV
```

---

## 🚀 Implementation Steps (2-3 Week Sprint)

### Week 1: Backend Setup & OCR Integration

#### Step 1.1: Initialize Node.js Project
```bash
mkdir gst-payment-poc
cd gst-payment-poc

# Backend setup
mkdir backend
cd backend
npm init -y
npm install express dotenv cors pg jsonwebtoken bcryptjs
npm install --save-dev nodemon

# Create folder structure
mkdir routes middleware models controllers config
mkdir public/uploads
```

#### Step 1.2: Environment Setup (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/gst_poc
JWT_SECRET=your-super-secret-key-change-in-production
RAZORPAY_KEY_ID=your-razorpay-test-key
RAZORPAY_KEY_SECRET=your-razorpay-test-secret
GOOGLE_CLOUD_VISION_API_KEY=your-google-cloud-api-key
```

#### Step 1.3: Basic Express Server
```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Routes (to be added)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/gst', require('./routes/gst'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
```

#### Step 1.4: Database Connection
```javascript
// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
```

#### Step 1.5: OCR Service (Google Cloud Vision)
```javascript
// backend/services/ocrService.js
const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_VISION_KEYFILE || undefined,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

async function extractReceiptData(imagePath) {
  try {
    const imageData = fs.readFileSync(imagePath);
    
    // Call Google Vision API
    const [result] = await client.documentTextDetection({
      image: { content: imageData },
    });
    
    const fullText = result.textAnnotations
      .map(annotation => annotation.description)
      .join('\n');
    
    // Parse extracted text to find key fields
    const extracted = parseReceiptText(fullText);
    
    return {
      fullText,
      extracted,
      confidence: calculateConfidence(extracted),
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

function parseReceiptText(text) {
  // Regex patterns for Indian invoice format
  const patterns = {
    gstin: /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}\b/,
    amount: /(?:Amount|Total|Grand Total|Rs\.?|₹)\s*[:\s]*(\d+[.,]\d{2})/i,
    date: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
    vendor: /^([A-Z][A-Za-z\s&.]{5,100})(?:\n|$)/m,
  };
  
  return {
    gstin: text.match(patterns.gstin)?.[0] || null,
    amount: text.match(patterns.amount)?.[1]?.replace(',', '.') || null,
    date: text.match(patterns.date)?.[0] || null,
    vendor: text.match(patterns.vendor)?.[1] || null,
    rawText: text,
  };
}

function calculateConfidence(extracted) {
  let score = 1.0;
  if (!extracted.gstin) score -= 0.2;
  if (!extracted.amount) score -= 0.3;
  if (!extracted.date) score -= 0.1;
  if (!extracted.vendor) score -= 0.2;
  return Math.max(0, score);
}

module.exports = { extractReceiptData };
```

### Week 2: Payment Integration & Invoice Management

#### Step 2.1: Authentication Routes
```javascript
// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, name, phone, gstin } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, name, phone, gstin) VALUES ($1, $2, $3, $4) RETURNING id, email',
      [email, name, phone, gstin]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // For POC, skip password validation; use magic link or OAuth instead
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### Step 2.2: Invoice Routes (Upload & Extract)
```javascript
// backend/routes/invoices.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const { extractReceiptData } = require('../services/ocrService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Multer config
const upload = multer({
  dest: 'public/uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

// Upload receipt
router.post('/upload', verifyToken, upload.single('receipt'), async (req, res) => {
  try {
    const userId = req.userId;
    const filePath = req.file.path;
    
    // Extract text via OCR
    const ocrData = await extractReceiptData(filePath);
    
    // Determine tax rate based on amount (placeholder logic)
    const amount = parseFloat(ocrData.extracted.amount || 0);
    let taxRate = 18; // Default GST rate
    
    // Insert invoice
    const result = await pool.query(
      `INSERT INTO invoices 
       (user_id, vendor_name, vendor_gstin, invoice_date, amount_before_tax, tax_amount, tax_rate, total_amount, receipt_image_path, ocr_confidence, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, vendor_name, vendor_gstin, amount_before_tax, tax_amount, total_amount, ocr_confidence`,
      [
        userId,
        ocrData.extracted.vendor || 'Unknown Vendor',
        ocrData.extracted.gstin || null,
        ocrData.extracted.date || new Date(),
        amount,
        amount * (taxRate / 100),
        taxRate,
        amount * (1 + taxRate / 100),
        filePath,
        ocrData.confidence,
      ]
    );
    
    const invoice = result.rows[0];
    
    res.json({
      invoice,
      ocrData: ocrData.extracted,
      message: 'Receipt uploaded and extracted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all invoices
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single invoice
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice (manual correction after OCR)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { vendor_name, vendor_gstin, amount_before_tax, tax_rate } = req.body;
    
    const taxAmount = amount_before_tax * (tax_rate / 100);
    const totalAmount = amount_before_tax + taxAmount;
    
    const result = await pool.query(
      `UPDATE invoices 
       SET vendor_name = $1, vendor_gstin = $2, amount_before_tax = $3, tax_rate = $4, tax_amount = $5, total_amount = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [vendor_name, vendor_gstin, amount_before_tax, tax_rate, taxAmount, totalAmount, req.params.id, req.userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### Step 2.3: Payment Routes (Razorpay Integration)
```javascript
// backend/routes/payments.js
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initiate payment
router.post('/initiate', verifyToken, async (req, res) => {
  try {
    const { invoiceId } = req.body;
    
    // Get invoice details
    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, req.userId]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoice = invoiceResult.rows[0];
    
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(invoice.total_amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `invoice-${invoice.id}`,
      notes: {
        invoiceId: invoice.id,
        vendor: invoice.vendor_name,
      },
    });
    
    // Store order reference
    await pool.query(
      `INSERT INTO payments (invoice_id, user_id, razorpay_order_id, amount, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [invoiceId, req.userId, order.id, invoice.total_amount]
    );
    
    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment callback (Razorpay webhook)
router.post('/callback', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Update payment status
    const result = await pool.query(
      `UPDATE payments 
       SET status = 'success', razorpay_payment_id = $1, payment_date = NOW()
       WHERE razorpay_order_id = $2
       RETURNING invoice_id`,
      [razorpay_payment_id, razorpay_order_id]
    );
    
    if (result.rows.length > 0) {
      // Update invoice status
      await pool.query(
        'UPDATE invoices SET status = $1 WHERE id = $2',
        ['paid', result.rows[0].invoice_id]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment history
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, i.vendor_name, i.total_amount 
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC LIMIT 50`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Week 3: Frontend & GST Reports

#### Step 3.1: Basic Frontend (React)
```bash
cd ..
npx create-react-app frontend
cd frontend
npm install axios tailwindcss razorpay
npx tailwindcss init
```

#### Step 3.2: Main Dashboard Component
```jsx
// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchPayments();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await API.get('/invoices');
      setInvoices(res.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await API.get('/payments');
      setPayments(res.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleReceiptUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await API.post('/invoices/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      alert(`Receipt uploaded! Extracted: ${res.data.invoice.vendor_name}, ₹${res.data.invoice.total_amount}`);
      fetchInvoices();
    } catch (error) {
      alert('Error uploading receipt: ' + error.message);
    }
  };

  const handlePayment = async (invoiceId, amount) => {
    try {
      // Create Razorpay order
      const res = await API.post('/payments/initiate', { invoiceId });
      const { order, key } = res.data;

      // Open Razorpay checkout
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        handler: (response) => {
          // Verify payment on backend
          API.post('/payments/callback', {
            razorpay_order_id: order.id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
            .then(() => {
              alert('Payment successful!');
              fetchInvoices();
              fetchPayments();
            })
            .catch((error) => alert('Payment verification failed: ' + error.message));
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert('Error initiating payment: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GST Payment Tracker</h1>
          <p className="text-gray-600 mt-2">Manage receipts, payments, and GST records</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Receipt</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleReceiptUpload}
            className="block w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer"
          />
          <p className="text-sm text-gray-500 mt-2">Upload a photo of your invoice. We'll extract the details automatically.</p>
        </div>

        {/* Invoices Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
          {loading ? (
            <p>Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="text-gray-500">No invoices yet. Upload one to get started.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Vendor</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Tax</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t">
                    <td className="px-4 py-2">{invoice.vendor_name}</td>
                    <td className="px-4 py-2">₹{invoice.amount_before_tax}</td>
                    <td className="px-4 py-2">₹{invoice.tax_amount} ({invoice.tax_rate}%)</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {invoice.status === 'unpaid' && (
                        <button
                          onClick={() => handlePayment(invoice.id, invoice.total_amount)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Pay ₹{invoice.total_amount}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Payments Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-gray-500">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Vendor</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="px-4 py-2">{payment.vendor_name}</td>
                    <td className="px-4 py-2">₹{payment.amount}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### Step 3.3: GST Report Routes
```javascript
// backend/routes/gst.js
const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { Parser } = require('json2csv');

const router = express.Router();

// Get monthly GST summary
router.get('/monthly-summary', verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const queryMonth = parseInt(month) || currentDate.getMonth() + 1;
    const queryYear = parseInt(year) || currentDate.getFullYear();
    
    const result = await pool.query(
      `SELECT 
         SUM(amount_before_tax) as total_purchases,
         SUM(tax_amount) as total_tax,
         json_object_agg(tax_rate, SUM(tax_amount)) as tax_by_rate,
         COUNT(*) as total_invoices
       FROM invoices
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM invoice_date) = $2
         AND EXTRACT(YEAR FROM invoice_date) = $3
         AND status = 'paid'`,
      [req.userId, queryMonth, queryYear]
    );
    
    const summary = result.rows[0];
    
    res.json({
      month: queryMonth,
      year: queryYear,
      totalPurchases: summary.total_purchases || 0,
      totalTaxPaid: summary.total_tax || 0,
      taxByRate: summary.tax_by_rate || {},
      totalInvoices: summary.total_invoices || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export as CSV
router.get('/export-csv', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         vendor_name, vendor_gstin, invoice_date, amount_before_tax, tax_amount, tax_rate, total_amount, status
       FROM invoices
       WHERE user_id = $1
       ORDER BY invoice_date DESC`,
      [req.userId]
    );
    
    const csv = new Parser().parse(result.rows);
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=gst_summary.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (or use managed service like Railway/Supabase)
- Google Cloud Vision API key (free tier)
- Razorpay sandbox account (free)
- Git

### Local Setup

```bash
# 1. Clone repo
git clone <your-repo>
cd gst-payment-poc

# 2. Setup Backend
cd backend
npm install

# 3. Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/gst_poc
JWT_SECRET=super-secret-dev-key
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
GOOGLE_CLOUD_VISION_API_KEY=your-key
EOF

# 4. Setup database (psql)
psql -U postgres -d postgres -f ../database/schema.sql

# 5. Start backend
npm run dev

# 6. Setup Frontend (new terminal)
cd frontend
npm install
npm start

# Open http://localhost:3000
```

---

## 🧪 Testing Checklist

- [ ] User registration/login works
- [ ] Upload receipt image → OCR extracts vendor name & amount
- [ ] Initiate UPI payment → Razorpay dialog opens
- [ ] Complete Razorpay test payment (use card: 4111111111111111)
- [ ] Payment status updates to "paid"
- [ ] Monthly GST summary calculates correctly
- [ ] Export CSV downloads without errors

---

## 📦 Deployment (Optional for POC)

### Backend (Heroku)
```bash
cd backend
heroku create gst-payment-poc
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### Frontend (Vercel)
```bash
cd frontend
npm install -g vercel
vercel
```

---

## 🚀 Next Steps After POC

1. **Add GSTIN Verification API** - Integrate government GSTIN database
2. **Implement Multi-Tenant** - Support multiple businesses per user
3. **Mobile App** - React Native for iOS/Android
4. **Advanced OCR** - Train custom model for Indian invoices
5. **Government Integration** - Direct GSTR submission to GST portal
6. **Analytics Dashboard** - Tax trends, payment insights

---

## 💡 Key Learnings & Pivot Points

- **OCR Accuracy**: Expect 70-85% on first pass; manual review UI critical
- **UPI Adoption**: Most Indian users familiar with UPI; prioritize over card payments
- **Tax Complexity**: GST rates vary; build validator before auto-filing
- **Government Access**: Reach out to GST department early for API access (can take 3-6 months)

---

## 📞 Support

For questions or issues:
- GitHub Issues: [link]
- Email: [your-email]
- Slack: [your-slack]

Happy building! 🎉

-- USERS TABLE (Support both individual and business)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type ENUM('individual', 'business') DEFAULT 'individual',
  phone_number VARCHAR(20),
  pan_number VARCHAR(20) UNIQUE,
  gstin VARCHAR(15) UNIQUE,
  business_name VARCHAR(255),
  kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  kyc_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- VENDORS TABLE
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gstin VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  pan VARCHAR(20),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INVOICES TABLE
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  subtotal_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- GST Details
  sgst_amount DECIMAL(10,2) DEFAULT 0,
  cgst_amount DECIMAL(10,2) DEFAULT 0,
  igst_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2),
  
  -- Invoice Details
  invoice_type ENUM('B2B', 'B2C', 'REVERSE_CHARGE') DEFAULT 'B2B',
  original_image_url VARCHAR(500),
  ocr_confidence DECIMAL(5,2),
  
  status ENUM('draft', 'pending', 'partial_paid', 'fully_paid', 'cancelled') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_invoice_per_user UNIQUE(user_id, vendor_id, invoice_number)
);

-- LINE ITEMS TABLE
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  hsn_code VARCHAR(10),
  tax_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAYMENTS TABLE
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  
  amount_paid DECIMAL(12,2) NOT NULL,
  tax_amount_paid DECIMAL(10,2),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- UPI Details
  upi_transaction_id VARCHAR(100) UNIQUE,
  payer_upi VARCHAR(100),
  payee_upi VARCHAR(100),
  payment_method ENUM('UPI', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE') DEFAULT 'UPI',
  
  -- Status
  status ENUM('pending', 'success', 'failed', 'cancelled') DEFAULT 'pending',
  payment_gateway_response JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GST SUMMARY TABLE (Monthly aggregation for GSTR reports)
CREATE TABLE gst_monthly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  year_month DATE NOT NULL,
  
  -- B2B Purchases
  b2b_purchases_count INTEGER DEFAULT 0,
  b2b_purchase_amount DECIMAL(15,2) DEFAULT 0,
  b2b_sgst DECIMAL(12,2) DEFAULT 0,
  b2b_cgst DECIMAL(12,2) DEFAULT 0,
  b2b_igst DECIMAL(12,2) DEFAULT 0,
  
  -- B2C Purchases
  b2c_purchases_count INTEGER DEFAULT 0,
  b2c_purchase_amount DECIMAL(15,2) DEFAULT 0,
  b2c_tax DECIMAL(12,2) DEFAULT 0,
  
  -- Reverse Charge
  reverse_charge_count INTEGER DEFAULT 0,
  reverse_charge_amount DECIMAL(15,2) DEFAULT 0,
  reverse_charge_tax DECIMAL(12,2) DEFAULT 0,
  
  -- Total ITC
  total_itc DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  gstr_status ENUM('draft', 'filed', 'rejected', 'amended') DEFAULT 'draft',
  gstr_filed_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_monthly_summary UNIQUE(user_id, year_month)
);

-- AUDIT LOG TABLE
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  action VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDICES
CREATE INDEX idx_users_gstin ON users(gstin);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_upi_txn ON payments(upi_transaction_id);
CREATE INDEX idx_gst_summary_user_month ON gst_monthly_summary(user_id, year_month);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at);

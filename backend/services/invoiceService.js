const vision = require('@google-cloud/vision');
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_PATH
});

/**
 * Process receipt image via OCR
 * Extracts vendor GSTIN, amounts, line items, tax details
 */
async function processReceiptOCR(imageBuffer) {
  try {
    const request = {
      image: { content: imageBuffer },
    };

    const [result] = await visionClient.documentTextDetection(request);
    const fullTextAnnotation = result.fullTextAnnotation;
    
    if (!fullTextAnnotation) {
      throw new Error('No text detected in image');
    }

    const extractedText = fullTextAnnotation.text;
    const confidence = calculateConfidence(result.textAnnotations);

    // Parse extracted text using regex patterns
    const invoiceData = parseInvoiceText(extractedText);
    invoiceData.ocr_confidence = confidence;
    invoiceData.extracted_text = extractedText;

    return invoiceData;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error(`OCR Processing Failed: ${error.message}`);
  }
}

/**
 * Parse invoice text and extract structured data
 */
function parseInvoiceText(text) {
  // Regex patterns for Indian invoices
  const patterns = {
    // GSTIN Pattern: 2 digits (state) + 10 chars + 1 check digit = 15 chars
    gstin: /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/g,
    
    // Invoice number (common formats)
    invoice: /(?:Invoice|INV|Bill|Ref)[-#\s]*([A-Z0-9\-\/]+)/i,
    
    // Date patterns
    date: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g,
    
    // Amount patterns (₹ or amounts)
    amount: /₹?\s*([0-9,]+(?:\.[0-9]{2})?)/g,
    
    // Tax patterns
    sgst: /SGST[:\s]*₹?\s*([0-9,]+\.[0-9]{2})/i,
    cgst: /CGST[:\s]*₹?\s*([0-9,]+\.[0-9]{2})/i,
    igst: /IGST[:\s]*₹?\s*([0-9,]+\.[0-9]{2})/i,
    
    // HSN codes (6-8 digits)
    hsn: /HSN[:\s]*([0-9]{6,8})/gi,
  };

  const extracted = {};

  // Extract GSTIN
  const gstinMatches = text.match(patterns.gstin);
  if (gstinMatches) {
    extracted.vendor_gstin = gstinMatches[0];
  }

  // Extract invoice number
  const invoiceMatch = text.match(patterns.invoice);
  if (invoiceMatch) {
    extracted.invoice_number = invoiceMatch[1].trim();
  }

  // Extract date
  const dateMatches = text.match(patterns.date);
  if (dateMatches) {
    extracted.invoice_date = parseDate(dateMatches[0]);
  }

  // Extract amounts
  const amountMatches = text.match(patterns.amount);
  if (amountMatches) {
    // Last amount is usually total
    extracted.total_amount = parseAmount(amountMatches[amountMatches.length - 1]);
  }

  // Extract tax components
  const sgstMatch = text.match(patterns.sgst);
  if (sgstMatch) {
    extracted.sgst_amount = parseAmount(sgstMatch[1]);
  }

  const cgstMatch = text.match(patterns.cgst);
  if (cgstMatch) {
    extracted.cgst_amount = parseAmount(cgstMatch[1]);
  }

  const igstMatch = text.match(patterns.igst);
  if (igstMatch) {
    extracted.igst_amount = parseAmount(igstMatch[1]);
  }

  // Extract line items (simple heuristic)
  extracted.line_items = extractLineItems(text);

  return extracted;
}

/**
 * Extract line items from invoice text
 */
function extractLineItems(text) {
  const lines = text.split('\n');
  const items = [];
  
  lines.forEach(line => {
    // Look for patterns like "Product Name ... Qty Price Amount"
    const match = line.match(/^([A-Za-z\s]+?)\s+(\d+)\s+₹?([0-9,]+(?:\.[0-9]{2})?)\s+₹?([0-9,]+(?:\.[0-9]{2})?)/);
    if (match) {
      items.push({
        description: match[1].trim(),
        quantity: parseFloat(match[2]),
        unit_price: parseAmount(match[3]),
        line_total: parseAmount(match[4])
      });
    }
  });
  
  return items;
}

/**
 * Helper: Parse amount from string with commas
 */
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  return parseFloat(amountStr.replace(/₹?|,/g, ''));
}

/**
 * Helper: Parse various date formats
 */
function parseDate(dateStr) {
  // Handles: DD-MM-YYYY, DD/MM/YYYY, etc.
  const patterns = [
    /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/,
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
  ];

  for (let pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      if (match[3].length === 4) {
        return `${match[3]}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
      } else {
        return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
      }
    }
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate OCR confidence score
 */
function calculateConfidence(annotations) {
  if (!annotations || annotations.length === 0) return 0;
  
  let totalConfidence = 0;
  annotations.forEach(annotation => {
    if (annotation.confidence) {
      totalConfidence += annotation.confidence;
    }
  });
  
  return (totalConfidence / annotations.length) * 100;
}

/**
 * Verify vendor GSTIN against government database
 */
async function verifyVendorGSTIN(gstin) {
  try {
    // In production, this would call official GST API
    // For POC, simulating response
    
    const isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
    
    if (isValid) {
      // Mock API call to GST verification service
      // const response = await axios.post('https://gst-api.gov.in/verify', { gstin });
      
      return {
        valid: true,
        gstin: gstin,
        status: 'Active',
        business_name: 'Mock Vendor Name',
        verified_at: new Date()
      };
    }
    
    return { valid: false, error: 'Invalid GSTIN format' };
  } catch (error) {
    console.error('GSTIN Verification Error:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Save invoice to database
 */
async function saveInvoice(userId, invoiceData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create or get vendor
    let vendorId;
    const vendorCheck = await client.query(
      'SELECT id FROM vendors WHERE gstin = $1',
      [invoiceData.vendor_gstin]
    );

    if (vendorCheck.rows.length > 0) {
      vendorId = vendorCheck.rows[0].id;
    } else {
      const vendorResult = await client.query(
        'INSERT INTO vendors (gstin, name, verified) VALUES ($1, $2, $3) RETURNING id',
        [invoiceData.vendor_gstin, invoiceData.vendor_name || 'Unknown', false]
      );
      vendorId = vendorResult.rows[0].id;
    }

    // Insert invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        user_id, vendor_id, invoice_number, invoice_date, 
        subtotal_amount, tax_amount, total_amount,
        sgst_amount, cgst_amount, igst_amount,
        ocr_confidence, original_image_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        userId, vendorId, invoiceData.invoice_number, invoiceData.invoice_date,
        invoiceData.subtotal_amount || 0, invoiceData.tax_amount || 0, invoiceData.total_amount,
        invoiceData.sgst_amount || 0, invoiceData.cgst_amount || 0, invoiceData.igst_amount || 0,
        invoiceData.ocr_confidence, invoiceData.image_url, 'pending'
      ]
    );

    const invoiceId = invoiceResult.rows[0].id;

    // Insert line items
    if (invoiceData.line_items && invoiceData.line_items.length > 0) {
      for (let item of invoiceData.line_items) {
        await client.query(
          `INSERT INTO line_items (invoice_id, description, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5)`,
          [invoiceId, item.description, item.quantity, item.unit_price, item.line_total]
        );
      }
    }

    await client.query('COMMIT');
    return invoiceId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  processReceiptOCR,
  verifyVendorGSTIN,
  saveInvoice,
  parseInvoiceText
};

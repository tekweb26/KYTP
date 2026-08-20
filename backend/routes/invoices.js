const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const invoiceService = require('../services/invoiceService');
const gstService = require('../services/gstService');

// File upload config
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

/**
 * POST /api/invoices/upload
 * Upload receipt image and extract data via OCR
 */
router.post('/upload', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process OCR
    const ocrResult = await invoiceService.processReceiptOCR(req.file.buffer);

    // Verify vendor GSTIN
    const gstinVerification = await invoiceService.verifyVendorGSTIN(ocrResult.vendor_gstin);

    if (!gstinVerification.valid) {
      return res.status(400).json({
        error: 'Invalid vendor GSTIN',
        details: gstinVerification.error
      });
    }

    // Calculate GST
    const payerGSTIN = req.body.payer_gstin;
    const isIntrastate = gstService.isIntrastateTransaction(payerGSTIN, ocrResult.vendor_gstin);
    
    const gstCalculation = gstService.calculateGST(
      ocrResult.subtotal_amount || 0,
      parseInt(req.body.tax_rate) || 18,
      req.body.transaction_type || 'B2B',
      isIntrastate
    );

    res.json({
      success: true,
      extracted_data: {
        vendor_name: ocrResult.vendor_name || 'Unknown Vendor',
        vendor_gstin: ocrResult.vendor_gstin,
        invoice_number: ocrResult.invoice_number,
        invoice_date: ocrResult.invoice_date,
        subtotal_amount: ocrResult.subtotal_amount || 0,
        line_items: ocrResult.line_items || [],
        ocr_confidence: ocrResult.ocr_confidence,
        gstin_verified: gstinVerification.valid,
        gstin_status: gstinVerification.status,
        gst_details: gstCalculation
      }
    });
  } catch (error) {
    console.error('Invoice Upload Error:', error);
    res.status(500).json({
      error: 'Failed to process receipt',
      details: error.message
    });
  }
});

/**
 * POST /api/invoices
 * Create invoice with manual entry or corrected OCR data
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      vendor_name,
      vendor_gstin,
      invoice_number,
      invoice_date,
      subtotal_amount,
      tax_rate,
      transaction_type,
      payer_gstin,
      line_items
    } = req.body;

    // Validate required fields
    if (!vendor_gstin || !invoice_number || !subtotal_amount) {
      return res.status(400).json({
        error: 'Missing required fields: vendor_gstin, invoice_number, subtotal_amount'
      });
    }

    // Calculate GST
    const isIntrastate = gstService.isIntrastateTransaction(payer_gstin, vendor_gstin);
    const gstData = gstService.calculateGST(
      subtotal_amount,
      tax_rate || 18,
      transaction_type || 'B2B',
      isIntrastate
    );

    const invoiceData = {
      vendor_name,
      vendor_gstin,
      invoice_number,
      invoice_date,
      subtotal_amount,
      tax_amount: gstData.total_tax,
      total_amount: gstData.invoice_total,
      sgst_amount: gstData.sgst,
      cgst_amount: gstData.cgst,
      igst_amount: gstData.igst,
      line_items,
      image_url: req.body.image_url
    };

    // Save to database
    const invoiceId = await invoiceService.saveInvoice(req.user.id, invoiceData);

    res.status(201).json({
      success: true,
      invoice_id: invoiceId,
      gst_details: gstData,
      total_amount: gstData.invoice_total
    });
  } catch (error) {
    console.error('Invoice Creation Error:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      details: error.message
    });
  }
});

/**
 * GET /api/invoices/:invoiceId
 * Fetch invoice details
 */
router.get('/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const result = await pool.query(
      `SELECT 
        i.*, v.gstin, v.name as vendor_name,
        json_agg(json_build_object(
          'description', li.description,
          'quantity', li.quantity,
          'unit_price', li.unit_price,
          'line_total', li.line_total
        )) as line_items
       FROM invoices i
       JOIN vendors v ON i.vendor_id = v.id
       LEFT JOIN line_items li ON i.id = li.invoice_id
       WHERE i.id = $1 AND i.user_id = $2
       GROUP BY i.id, v.id`,
      [invoiceId, req.user.id]
    );

    pool.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      success: true,
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Invoice Fetch Error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice',
      details: error.message
    });
  }
});

/**
 * GET /api/invoices
 * List all invoices for user with pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    let query = `SELECT i.*, v.name as vendor_name FROM invoices i
                 JOIN vendors v ON i.vendor_id = v.id
                 WHERE i.user_id = $1`;
    const params = [req.user.id];

    if (status) {
      query += ` AND i.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM invoices WHERE user_id = $1',
      [req.user.id]
    );

    pool.end();

    res.json({
      success: true,
      invoices: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Invoice List Error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      details: error.message
    });
  }
});

/**
 * PUT /api/invoices/:invoiceId
 * Update invoice details
 */
router.put('/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { vendor_name, subtotal_amount, tax_rate } = req.body;
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Recalculate GST if amounts changed
    let gstData = {};
    if (subtotal_amount) {
      gstData = gstService.calculateGST(subtotal_amount, tax_rate || 18);
    }

    const result = await pool.query(
      `UPDATE invoices 
       SET vendor_name = COALESCE($1, vendor_name),
           subtotal_amount = COALESCE($2, subtotal_amount),
           sgst_amount = COALESCE($3, sgst_amount),
           cgst_amount = COALESCE($4, cgst_amount),
           tax_amount = COALESCE($5, tax_amount),
           total_amount = COALESCE($6, total_amount),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        vendor_name,
        subtotal_amount,
        gstData.sgst,
        gstData.cgst,
        gstData.total_tax,
        gstData.invoice_total,
        invoiceId,
        req.user.id
      ]
    );

    pool.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      success: true,
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Invoice Update Error:', error);
    res.status(500).json({
      error: 'Failed to update invoice',
      details: error.message
    });
  }
});

module.exports = router;

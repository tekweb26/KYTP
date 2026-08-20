const { Pool } = require('pg');
const axios = require('axios');
const xml2js = require('xml2js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// GST Tax Rates for India
const TAX_RATES = {
  0: { sgst: 0, cgst: 0, igst: 0 },
  5: { sgst: 2.5, cgst: 2.5, igst: 5 },
  12: { sgst: 6, cgst: 6, igst: 12 },
  18: { sgst: 9, cgst: 9, igst: 18 },
  28: { sgst: 14, cgst: 14, igst: 28 }
};

/**
 * Calculate GST for an invoice based on transaction type
 */
function calculateGST(subtotalAmount, taxRate = 18, transactionType = 'B2B', isIntrastate = false) {
  const rate = TAX_RATES[taxRate];
  if (!rate) {
    throw new Error(`Invalid tax rate: ${taxRate}%`);
  }

  let sgst = 0, cgst = 0, igst = 0, totalTax = 0;

  if (transactionType === 'B2B' && isIntrastate) {
    // B2B Intrastate: SGST + CGST
    sgst = (subtotalAmount * rate.sgst) / 100;
    cgst = (subtotalAmount * rate.cgst) / 100;
  } else if (transactionType === 'B2B' && !isIntrastate) {
    // B2B Interstate: IGST only
    igst = (subtotalAmount * rate.igst) / 100;
  } else if (transactionType === 'B2C') {
    // B2C: SGST + CGST (similar to B2B Intrastate)
    sgst = (subtotalAmount * rate.sgst) / 100;
    cgst = (subtotalAmount * rate.cgst) / 100;
  } else if (transactionType === 'REVERSE_CHARGE') {
    // Reverse Charge: Tax paid by recipient
    sgst = (subtotalAmount * rate.sgst) / 100;
    cgst = (subtotalAmount * rate.cgst) / 100;
  }

  totalTax = sgst + cgst + igst;
  const invoiceTotal = subtotalAmount + totalTax;

  return {
    subtotal: Math.round(subtotalAmount * 100) / 100,
    tax_rate: taxRate,
    sgst: Math.round(sgst * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    total_tax: Math.round(totalTax * 100) / 100,
    invoice_total: Math.round(invoiceTotal * 100) / 100
  };
}

/**
 * Determine if transaction is intrastate (same state) or interstate
 */
function isIntrastateTransaction(payerGSTIN, vendorGSTIN) {
  if (!payerGSTIN || !vendorGSTIN || payerGSTIN.length < 2 || vendorGSTIN.length < 2) {
    return false;
  }
  // First 2 chars are state code
  return payerGSTIN.substring(0, 2) === vendorGSTIN.substring(0, 2);
}

/**
 * Get GST monthly summary for a user
 */
async function getMonthlyGSTSummary(userId, yearMonth) {
  try {
    const result = await pool.query(
      `SELECT * FROM gst_monthly_summary WHERE user_id = $1 AND year_month = $2`,
      [userId, yearMonth]
    );

    if (result.rows.length === 0) {
      return {
        user_id: userId,
        year_month: yearMonth,
        b2b_purchases_count: 0,
        b2b_purchase_amount: 0,
        b2b_sgst: 0,
        b2b_cgst: 0,
        b2b_igst: 0,
        total_itc: 0,
        gstr_status: 'draft'
      };
    }

    return result.rows[0];
  } catch (error) {
    console.error('GST Summary Fetch Error:', error);
    throw error;
  }
}

/**
 * Generate GSTR-2A (Purchase Register) XML
 * Format as per GST portal specifications
 */
async function generateGSTR2A(userId, yearMonth) {
  try {
    // Fetch all purchases for the month
    const purchasesQuery = await pool.query(
      `SELECT 
        i.id, i.invoice_number, i.invoice_date, 
        i.subtotal_amount, i.total_amount,
        i.sgst_amount, i.cgst_amount, i.igst_amount,
        i.invoice_type,
        v.gstin, v.name as vendor_name,
        u.gstin as payer_gstin
       FROM invoices i
       JOIN vendors v ON i.vendor_id = v.id
       JOIN users u ON i.user_id = u.id
       WHERE i.user_id = $1 
         AND i.status = 'fully_paid'
         AND DATE_TRUNC('month', i.invoice_date) = $2::date
       ORDER BY i.invoice_date ASC`,
      [userId, yearMonth]
    );

    const purchases = purchasesQuery.rows;
    const summary = await getMonthlyGSTSummary(userId, yearMonth);

    // Build GSTR-2A XML structure
    const gstrData = {
      gstin: purchases[0]?.payer_gstin || '',
      month: yearMonth.substring(0, 7),
      summary: {
        total_purchases: purchases.length,
        total_amount: summary.b2b_purchase_amount + summary.b2c_purchase_amount,
        total_igst: summary.b2b_igst,
        total_cgst: summary.b2b_cgst,
        total_sgst: summary.b2b_sgst,
        total_itc: summary.total_itc
      },
      b2b: purchases
        .filter(p => p.invoice_type === 'B2B')
        .map(p => ({
          inv_no: p.invoice_number,
          inv_date: p.invoice_date.toISOString().split('T')[0],
          supplier_gstin: p.gstin,
          supplier_name: p.vendor_name,
          invoice_value: p.total_amount,
          sgst: p.sgst_amount,
          cgst: p.cgst_amount,
          igst: p.igst_amount
        })),
      b2c: purchases
        .filter(p => p.invoice_type === 'B2C')
        .map(p => ({
          inv_no: p.invoice_number,
          inv_date: p.invoice_date.toISOString().split('T')[0],
          invoice_value: p.total_amount,
          sgst: p.sgst_amount,
          cgst: p.cgst_amount
        }))
    };

    return gstrData;
  } catch (error) {
    console.error('GSTR-2A Generation Error:', error);
    throw error;
  }
}

/**
 * Generate GSTR-3B XML (Monthly Return)
 * Simplified version for POC
 */
async function generateGSTR3B(userId, yearMonth) {
  try {
    const summary = await getMonthlyGSTSummary(userId, yearMonth);
    
    const userQuery = await pool.query(
      'SELECT gstin FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      throw new Error('User not found');
    }

    const gstr3b = {
      gstin: userQuery.rows[0].gstin,
      month: yearMonth.substring(0, 7),
      
      // Purchase Summary
      purchases: {
        b2b_value: summary.b2b_purchase_amount,
        b2b_sgst: summary.b2b_sgst,
        b2b_cgst: summary.b2b_cgst,
        b2b_igst: summary.b2b_igst,
        
        b2c_value: summary.b2c_purchase_amount,
        b2c_tax: summary.b2c_tax,
        
        reverse_charge: {
          value: summary.reverse_charge_amount || 0,
          tax: summary.reverse_charge_tax || 0
        }
      },
      
      // Tax Summary
      tax_summary: {
        total_itc: summary.total_itc,
        total_sgst: summary.b2b_sgst,
        total_cgst: summary.b2b_cgst,
        total_igst: summary.b2b_igst
      }
    };

    return gstr3b;
  } catch (error) {
    console.error('GSTR-3B Generation Error:', error);
    throw error;
  }
}

/**
 * Convert GSTR data to XML format
 */
function convertToXML(gstrData, format = 'GSTR-2A') {
  const builder = new xml2js.Builder();
  
  const xmlObject = {
    [format.replace('-', '')]: {
      Header: {
        gstin: gstrData.gstin,
        period: gstrData.month
      },
      Summary: [gstrData.summary],
      Details: [
        gstrData.b2b && { B2B: gstrData.b2b },
        gstrData.b2c && { B2C: gstrData.b2c }
      ].filter(Boolean)
    }
  };

  return builder.buildObject(xmlObject);
}

/**
 * Submit GSTR to government portal (requires auth token)
 */
async function submitGSTRToPortal(userId, yearMonth, format = 'GSTR-3B') {
  try {
    // In production: would call actual GST portal API
    // For POC: simulating submission
    
    const gstrData = format === 'GSTR-2A' 
      ? await generateGSTR2A(userId, yearMonth)
      : await generateGSTR3B(userId, yearMonth);

    const xmlData = convertToXML(gstrData, format);

    // Update summary with filed status
    await pool.query(
      `UPDATE gst_monthly_summary
       SET gstr_status = 'filed', gstr_filed_date = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND year_month = $2`,
      [userId, yearMonth]
    );

    return {
      success: true,
      format: format,
      month: yearMonth,
      filed_at: new Date(),
      acknowledgement_number: `GSTR${format.replace('-', '')}${Date.now()}`
    };
  } catch (error) {
    console.error('GSTR Portal Submission Error:', error);
    throw error;
  }
}

/**
 * Validate GSTR data before submission
 */
async function validateGSTRData(userId, yearMonth) {
  try {
    const summary = await getMonthlyGSTSummary(userId, yearMonth);
    const user = await pool.query('SELECT gstin FROM users WHERE id = $1', [userId]);

    const errors = [];
    const warnings = [];

    // Validations
    if (!user.rows[0]?.gstin) {
      errors.push('User GSTIN not registered');
    }

    if (summary.b2b_purchase_amount > 0 && summary.total_itc === 0) {
      warnings.push('No ITC claimed despite having B2B purchases');
    }

    if (summary.reverse_charge_amount > 0 && summary.reverse_charge_tax === 0) {
      errors.push('Reverse charge transactions must have tax amount');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary
    };
  } catch (error) {
    console.error('GSTR Validation Error:', error);
    throw error;
  }
}

module.exports = {
  calculateGST,
  isIntrastateTransaction,
  getMonthlyGSTSummary,
  generateGSTR2A,
  generateGSTR3B,
  convertToXML,
  submitGSTRToPortal,
  validateGSTRData,
  TAX_RATES
};

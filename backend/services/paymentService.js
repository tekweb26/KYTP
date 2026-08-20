const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Razorpay credentials
const RAZORPAY_KEY = process.env.RAZORPAY_KEY;
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET;
const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

/**
 * Initiate UPI payment via Razorpay
 */
async function initiateUPIPayment(invoiceId, userId, amount, vendorGSTIN) {
  try {
    // Fetch invoice details
    const invoiceQuery = await pool.query(
      `SELECT i.*, v.gstin as vendor_gstin, v.name as vendor_name, u.gstin as payer_gstin
       FROM invoices i
       JOIN vendors v ON i.vendor_id = v.id
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [invoiceId, userId]
    );

    if (invoiceQuery.rows.length === 0) {
      throw new Error('Invoice not found');
    }

    const invoice = invoiceQuery.rows[0];
    const idempotencyKey = generateIdempotencyKey(invoiceId, amount);

    // Create order in Razorpay
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: invoice.invoice_number,
      notes: {
        invoice_id: invoiceId,
        vendor_gstin: invoice.vendor_gstin,
        payer_gstin: invoice.payer_gstin,
        tax_amount: invoice.tax_amount,
        sgst: invoice.sgst_amount,
        cgst: invoice.cgst_amount,
        igst: invoice.igst_amount
      }
    };

    const razorpayOrder = await createRazorpayOrder(orderData);

    // Save payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (
        invoice_id, user_id, vendor_id, amount_paid, tax_amount_paid,
        status, payment_gateway_response
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        invoiceId,
        userId,
        invoice.vendor_id,
        amount,
        invoice.tax_amount,
        'pending',
        JSON.stringify({ razorpay_order_id: razorpayOrder.id })
      ]
    );

    return {
      payment_id: paymentResult.rows[0].id,
      razorpay_order_id: razorpayOrder.id,
      amount: amount,
      currency: 'INR',
      key: RAZORPAY_KEY,
      invoice_number: invoice.invoice_number,
      vendor_name: invoice.vendor_name
    };
  } catch (error) {
    console.error('Payment Initiation Error:', error);
    throw error;
  }
}

/**
 * Verify UPI payment after successful transaction
 */
async function verifyUPIPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, invoiceId) {
  try {
    // Verify signature
    const signature = crypto
      .createHmac('sha256', RAZORPAY_SECRET)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    if (signature !== razorpaySignature) {
      throw new Error('Invalid payment signature');
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await getPaymentDetails(razorpayPaymentId);

    if (paymentDetails.status !== 'captured') {
      throw new Error('Payment not captured');
    }

    // Update payment record
    const updateResult = await pool.query(
      `UPDATE payments
       SET status = 'success',
           upi_transaction_id = $1,
           payment_gateway_response = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE invoice_id = $3 AND status = 'pending'
       RETURNING id, invoice_id, amount_paid`,
      [
        razorpayPaymentId,
        JSON.stringify({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          vpa: paymentDetails.vpa,
          method: paymentDetails.method,
          fee: paymentDetails.fee,
          tax: paymentDetails.tax
        }),
        invoiceId
      ]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Payment record not found');
    }

    // Update invoice status
    const invoiceUpdate = await pool.query(
      `UPDATE invoices
       SET status = 'fully_paid', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, user_id, sgst_amount, cgst_amount, igst_amount, total_amount`,
      [invoiceId]
    );

    if (invoiceUpdate.rows.length > 0) {
      // Update GST monthly summary
      await updateGSTSummary(
        invoiceUpdate.rows[0].user_id,
        invoiceId,
        invoiceUpdate.rows[0]
      );
    }

    // Log audit trail
    await logAuditTrail(
      updateResult.rows[0].invoice_id.split('-')[0],
      'payment',
      razorpayPaymentId,
      'success',
      { status: 'pending' },
      { status: 'success', amount: updateResult.rows[0].amount_paid }
    );

    return {
      success: true,
      payment_id: razorpayPaymentId,
      invoice_id: invoiceId,
      amount: updateResult.rows[0].amount_paid
    };
  } catch (error) {
    console.error('Payment Verification Error:', error);
    
    // Mark payment as failed
    await pool.query(
      `UPDATE payments SET status = 'failed' WHERE invoice_id = $1 AND status = 'pending'`,
      [invoiceId]
    );

    throw error;
  }
}

/**
 * Create order in Razorpay
 */
async function createRazorpayOrder(orderData) {
  try {
    const response = await axios.post(
      `${RAZORPAY_API_URL}/orders`,
      orderData,
      {
        auth: {
          username: RAZORPAY_KEY,
          password: RAZORPAY_SECRET
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Fetch payment details from Razorpay
 */
async function getPaymentDetails(paymentId) {
  try {
    const response = await axios.get(
      `${RAZORPAY_API_URL}/payments/${paymentId}`,
      {
        auth: {
          username: RAZORPAY_KEY,
          password: RAZORPAY_SECRET
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Razorpay Fetch Payment Error:', error);
    throw new Error('Failed to fetch payment details');
  }
}

/**
 * Update GST monthly summary after payment
 */
async function updateGSTSummary(userId, invoiceId, invoiceData) {
  try {
    const invoiceQuery = await pool.query(
      `SELECT i.invoice_date, i.invoice_type FROM invoices i WHERE i.id = $1`,
      [invoiceId]
    );

    if (invoiceQuery.rows.length === 0) return;

    const invoice = invoiceQuery.rows[0];
    const yearMonth = invoice.invoice_date.toISOString().substring(0, 7);

    // Determine tax column based on transaction type
    let updateQuery, params;

    if (invoice.invoice_type === 'B2B') {
      updateQuery = `
        UPDATE gst_monthly_summary
        SET b2b_purchases_count = b2b_purchases_count + 1,
            b2b_purchase_amount = b2b_purchase_amount + $3,
            b2b_sgst = b2b_sgst + $4,
            b2b_cgst = b2b_cgst + $5,
            b2b_igst = b2b_igst + $6,
            total_itc = b2b_sgst + b2b_cgst + b2b_igst + $4 + $5 + $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND year_month = $2
      `;
      params = [
        userId,
        yearMonth,
        invoiceData.total_amount,
        invoiceData.sgst_amount,
        invoiceData.cgst_amount,
        invoiceData.igst_amount
      ];
    } else {
      updateQuery = `
        UPDATE gst_monthly_summary
        SET b2c_purchases_count = b2c_purchases_count + 1,
            b2c_purchase_amount = b2c_purchase_amount + $3,
            b2c_tax = b2c_tax + $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND year_month = $2
      `;
      params = [userId, yearMonth, invoiceData.total_amount, invoiceData.sgst_amount + invoiceData.cgst_amount];
    }

    // Insert if not exists, else update
    await pool.query(
      `INSERT INTO gst_monthly_summary (user_id, year_month) 
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, yearMonth]
    );

    await pool.query(updateQuery, params);
  } catch (error) {
    console.error('GST Summary Update Error:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Generate idempotency key for payment
 */
function generateIdempotencyKey(invoiceId, amount) {
  return crypto
    .createHash('sha256')
    .update(`${invoiceId}-${amount}-${Date.now()}`)
    .digest('hex');
}

/**
 * Log audit trail
 */
async function logAuditTrail(userId, entityType, entityId, action, oldValues, newValues) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, entityType, entityId, action, JSON.stringify(oldValues), JSON.stringify(newValues)]
    );
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
}

module.exports = {
  initiateUPIPayment,
  verifyUPIPayment,
  createRazorpayOrder,
  getPaymentDetails
};

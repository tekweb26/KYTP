const express = require('express');
const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE UPI PAYMENT STRING (No actual payment processing)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * UPI String Format:
 * upi://pay?pa=upiid&pn=name&am=amount&tn=description&tr=reference
 * 
 * When user scans/clicks this, it opens their UPI app (Google Pay, PhonePe, etc.)
 * User confirms payment in their app
 * Money goes directly to vendor account
 * App just records the transaction
 */

router.post('/generate', (req, res) => {
  try {
    const { vendorUPI, vendorName, amount, invoiceId, description } = req.body;

    // Validate input
    if (!vendorUPI || !amount || !invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: vendorUPI, amount, invoiceId'
      });
    }

    // Validate UPI format (simple check)
    if (!isValidUPI(vendorUPI)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid UPI ID format (should be like: user@paytm)'
      });
    }

    // Generate UPI String
    const upiString = generateUPIString({
      vendorUPI,
      vendorName: vendorName || 'Vendor',
      amount,
      invoiceId,
      description: description || `Payment for Invoice ${invoiceId}`
    });

    // Record in database (for tracking)
    recordPaymentInitiation({
      invoiceId,
      vendorUPI,
      amount,
      status: 'initiated',
      timestamp: new Date()
    });

    res.json({
      success: true,
      upiString: upiString,
      qrData: upiString, // Can be used to generate QR code
      invoiceId: invoiceId,
      amount: amount,
      vendorUPI: vendorUPI,
      message: 'UPI string generated. User can scan QR or click link to pay.',
      instructions: {
        step1: 'Share this UPI string with payer',
        step2: 'Payer clicks link or scans QR code',
        step3: 'Opens in payer\'s UPI app (Google Pay, PhonePe, etc.)',
        step4: 'Payer verifies amount and vendor details',
        step5: 'Payer confirms and completes payment',
        step6: 'Money goes directly to vendor\'s bank account',
        step7: 'App records transaction status'
      }
    });
  } catch (error) {
    console.error('UPI generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate UPI string'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// RECORD PAYMENT STATUS (After user completes payment in their UPI app)
// ═══════════════════════════════════════════════════════════════════════════

router.post('/record-payment', (req, res) => {
  try {
    const { invoiceId, vendorUPI, amount, transactionRef, status } = req.body;

    // Update payment status in database
    updatePaymentStatus({
      invoiceId,
      vendorUPI,
      amount,
      transactionRef, // UTR from UPI
      status, // 'completed', 'failed', 'pending'
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: `Payment ${status} for Invoice ${invoiceId}`,
      invoiceId,
      status,
      transactionRef
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record payment'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function isValidUPI(upi) {
  // Simple UPI validation: should match format like user@paytm, user@okhdfcbank, etc.
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiRegex.test(upi);
}

function generateUPIString(data) {
  const { vendorUPI, vendorName, amount, invoiceId, description } = data;

  // Encode special characters
  const encodedName = encodeURIComponent(vendorName.substring(0, 60)); // Max 60 chars
  const encodedDesc = encodeURIComponent(description.substring(0, 80)); // Max 80 chars
  const transactionRef = encodeURIComponent(`INV${invoiceId}`);

  // Build UPI string
  // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=DESCRIPTION&tr=REFERENCE
  const upiString = `upi://pay?pa=${vendorUPI}&pn=${encodedName}&am=${amount}&tn=${encodedDesc}&tr=${transactionRef}`;

  return upiString;
}

function recordPaymentInitiation(data) {
  // TODO: Save to database
  // Example:
  // await PaymentInitiation.create({
  //   invoiceId: data.invoiceId,
  //   vendorUPI: data.vendorUPI,
  //   amount: data.amount,
  //   status: data.status,
  //   createdAt: data.timestamp
  // });

  console.log('Payment initiated:', data);
}

function updatePaymentStatus(data) {
  // TODO: Update database
  // Example:
  // await Payment.findByIdAndUpdate(invoiceId, {
  //   status: data.status,
  //   transactionRef: data.transactionRef,
  //   updatedAt: data.timestamp
  // });

  console.log('Payment status updated:', data);
}

module.exports = router;

import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";

import { processInvoiceOCR } from "../services/ocrService.js";
import { parseInvoiceWithAI } from "../services/aiInvoiceParser.js";
import { compareGSTCalculation } from "../services/gstComparisonService.js";
import { getTaxType } from "../services/gstTaxTypeService.js";
import { getGSTStatus } from "../services/gstStatusService.js";

import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoiceController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});


// ======================================================
// GST STATUS
// ======================================================

router.post(
  "/gst-status",
  authMiddleware,
  async (req, res) => {
    try {
      const { gstin } = req.body;

      if (!gstin) {
        return res.status(400).json({
          success: false,
          message: "GSTIN is required",
        });
      }

      const gstStatus = await getGSTStatus(gstin);

      return res.json({
        success: true,
        message: "GST status fetched successfully",
        data: gstStatus,
      });
    } catch (error) {
      console.error("GST Status Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch GST status",
        error: error.message,
      });
    }
  }
);


// ======================================================
// INVOICE SCAN
// ======================================================

router.post(
  "/scan",
  authMiddleware,
  upload.single("invoice"),
  async (req, res) => {
    try {

      // --------------------------------------------------
      // 1. Check invoice file
      // --------------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Invoice image is required",
        });
      }


      // --------------------------------------------------
      // 2. OCR
      // --------------------------------------------------

      const ocrResult = await processInvoiceOCR(
        req.file.buffer
      );


      // --------------------------------------------------
      // 3. AI Parser
      // --------------------------------------------------

      const aiResult = await parseInvoiceWithAI(
        ocrResult.text
      );


      // --------------------------------------------------
      // 4. User GST State
      // --------------------------------------------------

      const userGSTState = req.body.userGSTState;


      if (!userGSTState) {
        return res.status(400).json({
          success: false,
          message: "User GST state is required",
        });
      }


      // --------------------------------------------------
      // 5. Get Vendor GSTIN from AI
      // --------------------------------------------------

      const vendorGSTIN = aiResult.vendor_gstin;


      let gstStatus = null;
      let vendorGSTState = null;


      // --------------------------------------------------
      // 6. GST Status API
      // --------------------------------------------------

      if (vendorGSTIN) {
        gstStatus = await getGSTStatus(vendorGSTIN);

        vendorGSTState = gstStatus.vendor_state;
      }


      // --------------------------------------------------
      // 7. Tax Type
      // --------------------------------------------------

      const taxTypeResult = getTaxType({
        userGSTState,
        vendorGSTState,
      });


      // --------------------------------------------------
      // 8. GST Calculation + AI Comparison
      // --------------------------------------------------

      const gstComparison = (aiResult.items || []).map(
        (item) => {

          return compareGSTCalculation({
            amountBeforeGST: item.amount_before_gst,
            gstRate: item.gst_rate,
            aiAmountAfterGST: item.amount_after_gst,
            taxType: taxTypeResult.taxType,
          });

        }
      );


      // --------------------------------------------------
      // 9. Final Response
      // --------------------------------------------------

      return res.json({
        success: true,

        message:
          "Invoice OCR + AI + GST status + GST calculation completed",

        ocr: ocrResult,

        ai: aiResult,

        gst_status: gstStatus,

        user_gst_state: userGSTState,

        vendor_gst_state: vendorGSTState,

        taxType: taxTypeResult.taxType,

        tax_reason: taxTypeResult.reason,

        gst_comparison: gstComparison,
      });

    } catch (error) {

      console.error(
        "Invoice OCR Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Invoice OCR failed",
        error: error.message,
      });
    }
  }
);


// ======================================================
// NORMAL INVOICE ROUTES
// ======================================================

router.post(
  "/",
  authMiddleware,
  createInvoice
);

router.get(
  "/",
  authMiddleware,
  getInvoices
);

router.get(
  "/:id",
  authMiddleware,
  getInvoice
);

router.put(
  "/:id",
  authMiddleware,
  updateInvoice
);

router.delete(
  "/:id",
  authMiddleware,
  deleteInvoice
);


export default router;
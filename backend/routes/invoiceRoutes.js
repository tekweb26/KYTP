import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";

import { processInvoiceOCR } from "../services/ocrService.js";
import { parseInvoiceWithAI } from "../services/aiInvoiceParser.js";
import { compareGSTCalculation } from "../services/gstComparisonService.js";
import { getTaxType } from "../services/gstTaxTypeService.js";
import { getGSTStatus } from "../services/gstStatusService.js";
import {
  validateGSTIN,
  getStateFromGSTIN,
} from "../services/gstinValidationService.js";

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

      console.log("GST STATUS REQUEST:", gstin);

      if (!gstin) {
        return res.status(400).json({
          success: false,
          message: "GSTIN is required",
        });
      }

      const validation = validateGSTIN(gstin);

      console.log("GST VALIDATION:", validation);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid GSTIN",
        });
      }

      console.log(
        "CALLING SANDBOX WITH:",
        validation.gstin
      );

      const gstStatus = await getGSTStatus(
        validation.gstin
      );

      console.log(
        "SANDBOX GST RESPONSE:",
        gstStatus
      );

      return res.json({
        success: true,
        message: "GST status fetched successfully",
        data: gstStatus,
      });

    } catch (error) {
      console.error("========== GST STATUS ERROR ==========");
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
      console.error("======================================");

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch GST status",
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

      const ocrResult = await processInvoiceOCR(req.file.buffer);

      // --------------------------------------------------
      // 3. AI Parsing
      // --------------------------------------------------

      const aiResult = await parseInvoiceWithAI(
        ocrResult.text,
        req.file.buffer,
        req.file.mimetype
      );


      // --------------------------------------------------
      // 4. User GST State
      // --------------------------------------------------

      const userGSTState = String(
        req.body.userGSTState || ""
      ).trim();

      if (!userGSTState) {
        return res.status(400).json({
          success: false,
          message: "User GST state is required",
        });
      }

      console.log("Buyer/User GST State:", userGSTState);


      // --------------------------------------------------
      // 5. Get Vendor GSTIN from AI
      // --------------------------------------------------

      const vendorGSTINResult = validateGSTIN(aiResult.vendor_gstin);

      let gstStatus = null;
      let vendorGSTState = null;

      if (vendorGSTINResult.isValid) {
        const gstinDerivedState = getStateFromGSTIN(
          vendorGSTINResult.gstin
        );

        try {
          gstStatus = await getGSTStatus(
            vendorGSTINResult.gstin
          );
        } catch (gstError) {
          console.error(
            "GST Status API Error:",
            gstError.message
          );
        }

        // GSTIN prefix is the reliable state source
        vendorGSTState = gstinDerivedState;
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

      const parseNumber = (value) => {
        if (value === null || value === undefined || value === "") {
          return null;
        }

        const cleaned = String(value)
          .replace(/₹/g, "")
          .replace(/,/g, "")
          .replace(/%/g, "")
          .trim();

        const number = Number(cleaned);

        return Number.isFinite(number) ? number : null;
      };

      const gstComparison = (aiResult.items || []).map((item) => {

        const amountBeforeGST = parseNumber(
          item.amount_before_gst
        );

        const gstRate = parseNumber(
          item.gst_rate
        );

        const aiAmountAfterGST = parseNumber(
          item.amount_after_gst
        );

        console.log("AI GST VALUES:", {
          description: item.description,
          amountBeforeGST,
          gstRate,
          aiAmountAfterGST,
        });

        if (
          amountBeforeGST === null ||
          gstRate === null ||
          aiAmountAfterGST === null
        ) {
          return {
            ai: {
              amount_before_gst: amountBeforeGST,
              gst_rate: gstRate,
              amount_after_gst: aiAmountAfterGST,
            },

            calculated: null,

            comparison: {
              is_match: false,
              difference: null,
              status: "INVALID_DATA",
            },
          };
        }

        return compareGSTCalculation({
          amountBeforeGST,
          gstRate,
          aiAmountAfterGST,
          taxType: taxTypeResult.taxType,
        });

      });

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

        vendor_gstin_validation: vendorGSTINResult,

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
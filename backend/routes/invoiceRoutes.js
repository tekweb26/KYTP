import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";
import { processInvoiceOCR } from "../services/ocrService.js";
import { parseInvoiceWithAI } from "../services/aiInvoiceParser.js";
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
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

router.post("/", authMiddleware, createInvoice);

router.post(
  "/scan",
  authMiddleware,
  upload.single("invoice"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Invoice image is required",
        });
      }

      const ocrResult = await processInvoiceOCR(req.file.buffer);
      const aiResult = await parseInvoiceWithAI(ocrResult.text);
      return res.json({
        success: true,
        message: "Invoice OCR completed",
        ocr: ocrResult,
        ai: aiResult,
      });


      return res.json({
        success: true,
        message: "Invoice OCR completed",
        ocr: ocrResult,
      });
    } catch (error) {
      console.error("Invoice OCR Error:", error);

      return res.status(500).json({
        success: false,
        message: "Invoice OCR failed",
        error: error.message,
      });
    }
  }
);


router.get("/", authMiddleware, getInvoices);

router.get("/:id", authMiddleware, getInvoice);

router.put("/:id", authMiddleware, updateInvoice);

router.delete("/:id", authMiddleware, deleteInvoice);

export default router;
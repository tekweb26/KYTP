import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  createInvoice,
  getInvoices,
  getInvoice,
  deleteInvoice,
} from "../controllers/invoiceController.js";


const router = express.Router();


/* =====================================================
   CREATE INVOICE

   POST /api/invoices
===================================================== */

router.post(
  "/",
  authMiddleware,
  createInvoice
);


/* =====================================================
   GET ALL USER INVOICES

   GET /api/invoices
===================================================== */

router.get(
  "/",
  authMiddleware,
  getInvoices
);


/* =====================================================
   GET SINGLE INVOICE

   GET /api/invoices/:id
===================================================== */

router.get(
  "/:id",
  authMiddleware,
  getInvoice
);


/* =====================================================
   DELETE INVOICE

   DELETE /api/invoices/:id
===================================================== */

router.delete(
  "/:id",
  authMiddleware,
  deleteInvoice
);


export default router;
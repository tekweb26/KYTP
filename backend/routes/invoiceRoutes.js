import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  createInvoice,
  getInvoices,
  getInvoice,
  deleteInvoice,
} from "../controllers/invoiceController.js";


const router =
  express.Router();


/* =====================================================
   CREATE INVOICE
===================================================== */

router.post(
  "/",
  authMiddleware,
  createInvoice
);


/* =====================================================
   GET ALL USER INVOICES
===================================================== */

router.get(
  "/",
  authMiddleware,
  getInvoices
);


/* =====================================================
   GET SINGLE INVOICE
===================================================== */

router.get(
  "/:id",
  authMiddleware,
  getInvoice
);


/* =====================================================
   DELETE
===================================================== */

router.delete(
  "/:id",
  authMiddleware,
  deleteInvoice
);


export default router;
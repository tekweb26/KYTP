import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    /* =====================================================
       USER
       कोणत्या logged-in user ने invoice तयार केला
    ===================================================== */

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },


    /* =====================================================
       VENDOR DETAILS
    ===================================================== */

    vendor_name: {
      type: String,
      required: true,
      trim: true,
    },

    vendor_gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },


    /* =====================================================
       VENDOR STATE
       GST च्या पहिल्या 2 digits वरून state code
    ===================================================== */

    vendor_state_code: {
      type: String,
      default: "",
      trim: true,
    },


    /* =====================================================
       TAX TYPE

       CGST_SGST = Same State
       IGST       = Different State
    ===================================================== */

    tax_type: {
      type: String,

      enum: [
        "CGST_SGST",
        "IGST",
      ],

      required: true,
    },


    /* =====================================================
       TAX RATE

       User manually rate enter करेल.

       Example:
       5
       12
       18
       28
    ===================================================== */

    gst_rate: {
      type: Number,

      required: true,

      min: 0,

      max: 100,
    },


    /* =====================================================
       CGST
    ===================================================== */

    cgst_rate: {
      type: Number,

      default: 0,

      min: 0,

      max: 100,
    },

    cgst_amount: {
      type: Number,

      default: 0,

      min: 0,
    },


    /* =====================================================
       SGST
    ===================================================== */

    sgst_rate: {
      type: Number,

      default: 0,

      min: 0,

      max: 100,
    },

    sgst_amount: {
      type: Number,

      default: 0,

      min: 0,
    },


    /* =====================================================
       IGST
    ===================================================== */

    igst_rate: {
      type: Number,

      default: 0,

      min: 0,

      max: 100,
    },

    igst_amount: {
      type: Number,

      default: 0,

      min: 0,
    },


    /* =====================================================
       AMOUNT
    ===================================================== */

    total_amount: {
      type: Number,

      required: true,

      min: 0,
    },


    /* =====================================================
       TAX TOTAL
    ===================================================== */

    total_tax: {
      type: Number,

      default: 0,

      min: 0,
    },


    /* =====================================================
       GRAND TOTAL

       total_amount + total_tax
    ===================================================== */

    grand_total: {
      type: Number,

      default: 0,

      min: 0,
    },


    /* =====================================================
       DESCRIPTION
    ===================================================== */

    description: {
      type: String,

      trim: true,

      default: "",
    },


    /* =====================================================
       STATUS
    ===================================================== */

    status: {
      type: String,

      enum: [
        "Pending",
        "Paid",
        "Cancelled",
      ],

      default: "Pending",
    },
  },


  {
    timestamps: true,
  }
);


/* =====================================================
   MODEL
===================================================== */

const Invoice = mongoose.model(
  "Invoice",
  invoiceSchema
);


export default Invoice;
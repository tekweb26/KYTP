import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    /* =====================================================
       USER
    ===================================================== */

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },


    /* =====================================================
       INVOICE NUMBER - MANUAL
    ===================================================== */

    invoice_number: {
      type: String,
      required: true,
      trim: true,
    },


    /* =====================================================
       INVOICE DATE - MANUAL
    ===================================================== */

    invoice_date: {
      type: Date,
      required: true,
    },


    /* =====================================================
       STORED YEAR / MONTH
    ===================================================== */

    invoice_year: {
      type: Number,
      required: true,
      index: true,
    },

    invoice_month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },


    /* =====================================================
       VENDOR
    ===================================================== */

    vendor_name: {
      type: String,
      required: true,
      trim: true,
    },


    /* =====================================================
       VENDOR GST AVAILABLE
    ===================================================== */

    vendor_has_gst: {
      type: Boolean,
      required: true,
      default: false,
    },


    /* =====================================================
       VENDOR GST
    ===================================================== */

    vendor_gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },


    /* =====================================================
       VENDOR STATE
    ===================================================== */

    vendor_state: {
      type: String,
      required: true,
      trim: true,
    },


    /* =====================================================
       VENDOR STATE CODE
    ===================================================== */

    vendor_state_code: {
      type: String,
      default: "",
      trim: true,
    },


    /* =====================================================
       TAX TYPE
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
       GST RATE
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


    total_tax: {
      type: Number,
      default: 0,
      min: 0,
    },


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


const Invoice =
  mongoose.model(
    "Invoice",
    invoiceSchema
  );

export default Invoice;
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
       INVOICE NUMBER
    ===================================================== */

    invoice_number: {
      type: String,
      required: true,
      trim: true,
    },

    /* =====================================================
       INVOICE DATE
    ===================================================== */

    invoice_date: {
      type: Date,
      required: true,
    },

    /* =====================================================
       YEAR / MONTH
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

    vendor_has_gst: {
      type: Boolean,
      required: true,
      default: false,
    },

    vendor_gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    vendor_state: {
      type: String,
      required: true,
      trim: true,
    },

    vendor_state_code: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       TAX TYPE

       CGST_SGST = Same state
       IGST       = Different state
    ===================================================== */

    tax_type: {
      type: String,
      enum: ["CGST_SGST", "IGST"],
      required: true,
    },

    /* =====================================================
       MAIN GST RATE

       Existing frontend compatibility साठी ठेवले आहे.

       Single GST असेल तर actual rate.
       Multiple GST असेल तर rates मधील values
       array मध्ये gst_rates मध्ये असतील.
    ===================================================== */

    gst_rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    /* =====================================================
       MULTIPLE GST RATES

       Example:

       [
         5,
         12,
         18
       ]
    ===================================================== */

    gst_rates: {
      type: [Number],
      default: [],
    },

    /* =====================================================
       GST BREAKDOWN

       Example:

       [
         {
           rate: 5,
           taxable_amount: 10000,
           gst_amount: 500
         },
         {
           rate: 12,
           taxable_amount: 20000,
           gst_amount: 2400
         }
       ]
    ===================================================== */

    gst_breakdown: {
      type: [
        {
          rate: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
          },

          taxable_amount: {
            type: Number,
            required: true,
            min: 0,
          },

          gst_amount: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      default: [],
    },

    /* =====================================================
       CGST

       Single-rate compatibility fields.
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
       TAXABLE / PRODUCT TOTAL

       IMPORTANT:

       total_amount = GST आधीचा total taxable amount
    ===================================================== */

    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =====================================================
       TOTAL GST / TAX
    ===================================================== */

    total_tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       FINAL AMOUNT

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
      enum: ["Pending", "Paid", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);


/* =====================================================
   INDEX
===================================================== */

invoiceSchema.index({
  user_id: 1,
  invoice_date: -1,
});

invoiceSchema.index({
  user_id: 1,
  createdAt: -1,
});


/* =====================================================
   MODEL
===================================================== */

const Invoice =
  mongoose.models.Invoice ||
  mongoose.model("Invoice", invoiceSchema);

export default Invoice;
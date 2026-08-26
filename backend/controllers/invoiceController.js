import Invoice from "../models/Invoice.js";
import User from "../models/User.js";


/* =====================================================
   CREATE INVOICE
===================================================== */

export const createInvoice = async (req, res) => {
  try {

    const {
      vendor_name,
      vendor_gstin,
      total_amount,
      gst_rate,
      description,
    } = req.body;


    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (!vendor_name) {
      return res.status(400).json({
        success: false,
        message: "Vendor name is required",
      });
    }


    if (
      total_amount === undefined ||
      total_amount === null ||
      total_amount === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Total amount is required",
      });
    }


    if (
      gst_rate === undefined ||
      gst_rate === null ||
      gst_rate === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "GST rate is required",
      });
    }


    const amount = Number(total_amount);
    const gstRate = Number(gst_rate);


    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount",
      });
    }


    if (
      Number.isNaN(gstRate) ||
      gstRate < 0 ||
      gstRate > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GST rate",
      });
    }


    /* =================================================
       LOGGED-IN USER
    ================================================= */

    const user = await User.findById(req.user._id);


    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }


    /* =================================================
       USER GST CHECK
    ================================================= */

    if (!user.hasGST || !user.gstNumber) {
      return res.status(400).json({
        success: false,
        message:
          "You must have a GST number to create a GST invoice",
      });
    }


    /* =================================================
       CLEAN GST
    ================================================= */

    const userGST =
      user.gstNumber
        .toUpperCase()
        .trim();


    const vendorGST =
      vendor_gstin
        ? vendor_gstin.toUpperCase().trim()
        : "";


    /* =================================================
       VENDOR GST REQUIRED
    ================================================= */

    if (!vendorGST) {
      return res.status(400).json({
        success: false,
        message:
          "Vendor GST number is required",
      });
    }


    /* =================================================
       GST FORMAT VALIDATION
    ================================================= */

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


    if (!gstRegex.test(userGST)) {
      return res.status(400).json({
        success: false,
        message:
          "Logged-in user GST number is invalid",
      });
    }


    if (!gstRegex.test(vendorGST)) {
      return res.status(400).json({
        success: false,
        message:
          "Vendor GST number is invalid",
      });
    }


    /* =================================================
       STATE CODE

       GST च्या पहिल्या 2 digits म्हणजे state code
    ================================================= */

    const userStateCode =
      userGST.substring(0, 2);


    const vendorStateCode =
      vendorGST.substring(0, 2);


    /* =================================================
       TAX CALCULATION
    ================================================= */

    let taxType;

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;


    /* =================================================
       SAME STATE
       
       CGST + SGST
    ================================================= */

    if (
      userStateCode === vendorStateCode
    ) {

      taxType = "CGST_SGST";


      /*
        Example:
        GST Rate = 18%

        CGST = 9%
        SGST = 9%
      */

      cgstRate =
        gstRate / 2;

      sgstRate =
        gstRate / 2;


      cgstAmount =
        Number(
          (
            amount *
            cgstRate /
            100
          ).toFixed(2)
        );


      sgstAmount =
        Number(
          (
            amount *
            sgstRate /
            100
          ).toFixed(2)
        );

    }


    /* =================================================
       DIFFERENT STATE
       
       IGST
    ================================================= */

    else {

      taxType = "IGST";


      igstRate =
        gstRate;


      igstAmount =
        Number(
          (
            amount *
            igstRate /
            100
          ).toFixed(2)
        );

    }


    /* =================================================
       TOTAL TAX
    ================================================= */

    const totalTax =
      Number(
        (
          cgstAmount +
          sgstAmount +
          igstAmount
        ).toFixed(2)
      );


    /* =================================================
       GRAND TOTAL
    ================================================= */

    const grandTotal =
      Number(
        (
          amount +
          totalTax
        ).toFixed(2)
      );


    /* =================================================
       CREATE INVOICE
    ================================================= */

    const invoice =
      await Invoice.create({

        user_id:
          user._id,

        vendor_name:
          vendor_name.trim(),

        vendor_gstin:
          vendorGST,

        vendor_state_code:
          vendorStateCode,

        tax_type:
          taxType,

        gst_rate:
          gstRate,

        cgst_rate:
          cgstRate,

        cgst_amount:
          cgstAmount,

        sgst_rate:
          sgstRate,

        sgst_amount:
          sgstAmount,

        igst_rate:
          igstRate,

        igst_amount:
          igstAmount,

        total_amount:
          amount,

        total_tax:
          totalTax,

        grand_total:
          grandTotal,

        description:
          description || "",

        status:
          "Pending",
      });


    /* =================================================
       RESPONSE
    ================================================= */

    return res.status(201).json({

      success: true,

      message:
        "Invoice created successfully",

      invoice,

    });

  } catch (error) {

    console.error(
      "Create Invoice Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to create invoice",

      error:
        error.message,

    });

  }
};


/* =====================================================
   GET ALL USER INVOICES
===================================================== */

export const getInvoices = async (req, res) => {

  try {

    const invoices =
      await Invoice.find({

        user_id:
          req.user._id,

      })

      .sort({
        createdAt: -1,
      });


    return res.status(200).json({

      success: true,

      invoices,

    });

  } catch (error) {

    console.error(
      "Get Invoices Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to load invoices",

    });

  }

};


/* =====================================================
   GET SINGLE INVOICE
===================================================== */

export const getInvoice = async (req, res) => {

  try {

    const invoice =
      await Invoice.findOne({

        _id:
          req.params.id,

        user_id:
          req.user._id,

      });


    if (!invoice) {

      return res.status(404).json({

        success: false,

        message:
          "Invoice not found",

      });

    }


    return res.status(200).json({

      success: true,

      invoice,

    });

  } catch (error) {

    console.error(
      "Get Invoice Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to load invoice",

    });

  }

};


/* =====================================================
   DELETE INVOICE
===================================================== */

export const deleteInvoice = async (req, res) => {

  try {

    const invoice =
      await Invoice.findOneAndDelete({

        _id:
          req.params.id,

        user_id:
          req.user._id,

      });


    if (!invoice) {

      return res.status(404).json({

        success: false,

        message:
          "Invoice not found",

      });

    }


    return res.status(200).json({

      success: true,

      message:
        "Invoice deleted successfully",

    });

  } catch (error) {

    console.error(
      "Delete Invoice Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to delete invoice",

    });

  }

};
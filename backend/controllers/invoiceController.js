
import Invoice from "../models/Invoice.js";
import User from "../models/User.js";


/* =====================================================
   CREATE INVOICE
===================================================== */

export const createInvoice = async (req, res) => {
  try {

    const {
      invoice_number,
      invoice_date,

      vendor_name,
      vendor_has_gst,
      vendor_gstin,
      vendor_state,

      total_amount,
      gst_rate,
      description,
    } = req.body;


    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (!invoice_number?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invoice number is required",
      });
    }


    if (!invoice_date) {
      return res.status(400).json({
        success: false,
        message: "Invoice date is required",
      });
    }


    if (!vendor_name?.trim()) {
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


    const amount =
      Number(total_amount);

    const gstRate =
      Number(gst_rate);


    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {
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
       DATE
    ================================================= */

    const parsedDate =
      new Date(invoice_date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice date",
      });
    }


    const invoiceYear =
      parsedDate.getFullYear();

    const invoiceMonth =
      parsedDate.getMonth() + 1;


    /* =================================================
       LOGGED USER
    ================================================= */

    const user =
      await User.findById(
        req.user._id
      );


    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }


    /* =================================================
       COMPANY STATE
    ================================================= */

    let companyState =
      user.companyState;


    /* =================================================
       IF USER HAS GST
       COMPANY STATE FROM GST
    ================================================= */

    if (
      user.hasGST &&
      user.gstNumber
    ) {

      const userGST =
        user.gstNumber
          .toUpperCase()
          .trim();


      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


      if (!gstRegex.test(userGST)) {
        return res.status(400).json({
          success: false,
          message:
            "Logged-in user GST number is invalid",
        });
      }

    }


    if (!companyState) {
      return res.status(400).json({
        success: false,
        message:
          "Company state is required",
      });
    }


    /* =================================================
       VENDOR GST
    ================================================= */

    let vendorGST = "";

    let vendorStateFinal =
      vendor_state?.trim() || "";

    let vendorStateCode = "";


    /* =================================================
       VENDOR HAS GST
    ================================================= */

    if (vendor_has_gst === true) {

      if (!vendor_gstin) {
        return res.status(400).json({
          success: false,
          message:
            "Vendor GST number is required",
        });
      }


      vendorGST =
        vendor_gstin
          .toUpperCase()
          .trim();


      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


      if (!gstRegex.test(vendorGST)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid vendor GST number",
        });
      }


      /* =================================================
         GST FIRST 2 DIGITS
         STATE CODE
      ================================================= */

      vendorStateCode =
        vendorGST.substring(0, 2);


      /* =================================================
         GST STATE MAP
      ================================================= */

      if (!vendorStateFinal) {

        const stateCodeMap = {

          "01": "Jammu and Kashmir",
          "02": "Himachal Pradesh",
          "03": "Punjab",
          "04": "Chandigarh",
          "05": "Uttarakhand",
          "06": "Haryana",
          "07": "Delhi",
          "08": "Rajasthan",
          "09": "Uttar Pradesh",
          "10": "Bihar",
          "11": "Sikkim",
          "12": "Arunachal Pradesh",
          "13": "Nagaland",
          "14": "Manipur",
          "15": "Mizoram",
          "16": "Tripura",
          "17": "Meghalaya",
          "18": "Assam",
          "19": "West Bengal",
          "20": "Jharkhand",
          "21": "Odisha",
          "22": "Chhattisgarh",
          "23": "Madhya Pradesh",
          "24": "Gujarat",
          "26": "Dadra and Nagar Haveli and Daman and Diu",
          "27": "Maharashtra",
          "28": "Andhra Pradesh",
          "29": "Karnataka",
          "30": "Goa",
          "31": "Lakshadweep",
          "32": "Kerala",
          "33": "Tamil Nadu",
          "34": "Puducherry",
          "35": "Andaman and Nicobar Islands",
          "36": "Telangana",
          "37": "Andhra Pradesh",
          "38": "Ladakh",

        };


        vendorStateFinal =
          stateCodeMap[
            vendorStateCode
          ] || "";
      }


      if (!vendorStateFinal) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to determine vendor state from GST",
        });
      }

    }


    /* =================================================
       VENDOR DOES NOT HAVE GST
       STATE MANUAL
    ================================================= */

    else {

      vendorGST = "";

      vendorStateCode = "";


      if (!vendorStateFinal) {
        return res.status(400).json({
          success: false,
          message:
            "Please select vendor state",
        });
      }

    }


    /* =================================================
       TAX TYPE
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
    ================================================= */

    if (
      companyState.toLowerCase().trim() ===
      vendorStateFinal.toLowerCase().trim()
    ) {

      taxType =
        "CGST_SGST";


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
    ================================================= */

    else {

      taxType =
        "IGST";


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
       CREATE
    ================================================= */

    const invoice =
      await Invoice.create({

        user_id:
          user._id,

        invoice_number:
          invoice_number.trim(),

        invoice_date:
          parsedDate,

        invoice_year:
          invoiceYear,

        invoice_month:
          invoiceMonth,

        vendor_name:
          vendor_name.trim(),

        vendor_has_gst:
          vendor_has_gst === true,

        vendor_gstin:
          vendorGST,

        vendor_state:
          vendorStateFinal,

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
          description?.trim() || "",

        status:
          "Pending",

      });


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
   GET INVOICES
   IMPORTANT:
   Populate USER details so frontend gets
   companyName, companyAddress, companyState, gstNumber
===================================================== */

export const getInvoices = async (
  req,
  res
) => {

  try {

    const invoices =
      await Invoice.find({

        user_id:
          req.user._id,

      })
      .populate(
        "user_id",
        "name companyName companyAddress companyState hasGST gstNumber"
      )
      .sort({

        invoice_date: -1,

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
   IMPORTANT:
   Populate USER details here too
===================================================== */

export const getInvoice = async (
  req,
  res
) => {

  try {

    const invoice =
      await Invoice.findOne({

        _id:
          req.params.id,

        user_id:
          req.user._id,

      })
      .populate(
        "user_id",
        "name companyName companyAddress companyState hasGST gstNumber"
      );


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

export const deleteInvoice = async (
  req,
  res
) => {

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

/* =====================================================
   UPDATE INVOICE
===================================================== */

export const updateInvoice = async (req, res) => {
  try {
    const {
      invoice_number,
      invoice_date,

      vendor_name,
      vendor_has_gst,
      vendor_gstin,
      vendor_state,

      total_amount,
      gst_rate,
      description,
      status,
    } = req.body;

    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (!invoice_number?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invoice number is required",
      });
    }

    if (!invoice_date) {
      return res.status(400).json({
        success: false,
        message: "Invoice date is required",
      });
    }

    if (!vendor_name?.trim()) {
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

    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {
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
       DATE
    ================================================= */

    const parsedDate = new Date(invoice_date);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice date",
      });
    }

    const invoiceYear = parsedDate.getFullYear();
    const invoiceMonth = parsedDate.getMonth() + 1;

    /* =================================================
       LOGGED USER
    ================================================= */

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    /* =================================================
       COMPANY STATE
    ================================================= */

    const companyState = user.companyState;

    if (!companyState) {
      return res.status(400).json({
        success: false,
        message: "Company state is required",
      });
    }

    /* =================================================
       VENDOR GST / STATE
    ================================================= */

    let vendorGST = "";
    let vendorStateFinal = vendor_state?.trim() || "";
    let vendorStateCode = "";

    /* =================================================
       VENDOR HAS GST
    ================================================= */

    if (vendor_has_gst === true) {
      if (!vendor_gstin) {
        return res.status(400).json({
          success: false,
          message: "Vendor GST number is required",
        });
      }

      vendorGST = vendor_gstin
        .toUpperCase()
        .trim();

      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

      if (!gstRegex.test(vendorGST)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vendor GST number",
        });
      }

      /* ===============================================
         GST STATE CODE
      =============================================== */

      vendorStateCode = vendorGST.substring(0, 2);

      const stateCodeMap = {
        "01": "Jammu and Kashmir",
        "02": "Himachal Pradesh",
        "03": "Punjab",
        "04": "Chandigarh",
        "05": "Uttarakhand",
        "06": "Haryana",
        "07": "Delhi",
        "08": "Rajasthan",
        "09": "Uttar Pradesh",
        "10": "Bihar",
        "11": "Sikkim",
        "12": "Arunachal Pradesh",
        "13": "Nagaland",
        "14": "Manipur",
        "15": "Mizoram",
        "16": "Tripura",
        "17": "Meghalaya",
        "18": "Assam",
        "19": "West Bengal",
        "20": "Jharkhand",
        "21": "Odisha",
        "22": "Chhattisgarh",
        "23": "Madhya Pradesh",
        "24": "Gujarat",
        "26": "Dadra and Nagar Haveli and Daman and Diu",
        "27": "Maharashtra",
        "28": "Andhra Pradesh",
        "29": "Karnataka",
        "30": "Goa",
        "31": "Lakshadweep",
        "32": "Kerala",
        "33": "Tamil Nadu",
        "34": "Puducherry",
        "35": "Andaman and Nicobar Islands",
        "36": "Telangana",
        "37": "Andhra Pradesh",
        "38": "Ladakh",
      };

      vendorStateFinal =
        stateCodeMap[vendorStateCode] || "";

      if (!vendorStateFinal) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to determine vendor state from GST",
        });
      }
    }

    /* =================================================
       VENDOR DOES NOT HAVE GST
    ================================================= */

    else {
      vendorGST = "";
      vendorStateCode = "";

      if (!vendorStateFinal) {
        return res.status(400).json({
          success: false,
          message: "Please select vendor state",
        });
      }
    }

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
    ================================================= */

    if (
      companyState.toLowerCase().trim() ===
      vendorStateFinal.toLowerCase().trim()
    ) {
      taxType = "CGST_SGST";

      cgstRate = gstRate / 2;
      sgstRate = gstRate / 2;

      cgstAmount = Number(
        (
          amount *
          cgstRate /
          100
        ).toFixed(2)
      );

      sgstAmount = Number(
        (
          amount *
          sgstRate /
          100
        ).toFixed(2)
      );
    }

    /* =================================================
       DIFFERENT STATE
    ================================================= */

    else {
      taxType = "IGST";

      igstRate = gstRate;

      igstAmount = Number(
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

    const totalTax = Number(
      (
        cgstAmount +
        sgstAmount +
        igstAmount
      ).toFixed(2)
    );

    /* =================================================
       GRAND TOTAL
    ================================================= */

    const grandTotal = Number(
      (
        amount +
        totalTax
      ).toFixed(2)
    );

    /* =================================================
       FIND EXISTING INVOICE
    ================================================= */

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    /* =================================================
       UPDATE
    ================================================= */

    invoice.invoice_number =
      invoice_number.trim();

    invoice.invoice_date =
      parsedDate;

    invoice.invoice_year =
      invoiceYear;

    invoice.invoice_month =
      invoiceMonth;

    invoice.vendor_name =
      vendor_name.trim();

    invoice.vendor_has_gst =
      vendor_has_gst === true;

    invoice.vendor_gstin =
      vendorGST;

    invoice.vendor_state =
      vendorStateFinal;

    invoice.vendor_state_code =
      vendorStateCode;

    invoice.tax_type =
      taxType;

    invoice.gst_rate =
      gstRate;

    invoice.cgst_rate =
      cgstRate;

    invoice.cgst_amount =
      cgstAmount;

    invoice.sgst_rate =
      sgstRate;

    invoice.sgst_amount =
      sgstAmount;

    invoice.igst_rate =
      igstRate;

    invoice.igst_amount =
      igstAmount;

    invoice.total_amount =
      amount;

    invoice.total_tax =
      totalTax;

    invoice.grand_total =
      grandTotal;

    invoice.description =
      description?.trim() || "";

    if (
      status &&
      ["Pending", "Paid", "Cancelled"].includes(status)
    ) {
      invoice.status = status;
    }

    await invoice.save();

    /* =================================================
       POPULATE USER
    ================================================= */

    await invoice.populate(
      "user_id",
      "name companyName companyAddress companyState hasGST gstNumber"
    );

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });

  } catch (error) {
    console.error(
      "Update Invoice Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update invoice",
      error: error.message,
    });
  }
};
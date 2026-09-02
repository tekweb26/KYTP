import Invoice from "../models/Invoice.js";
import User from "../models/User.js";


/* =====================================================
   GST REGEX
===================================================== */

const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


/* =====================================================
   GST STATE MAP
===================================================== */

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


/* =====================================================
   ROUND NUMBER
===================================================== */

const round2 = (value) => {
  return Number(Number(value || 0).toFixed(2));
};


/* =====================================================
   NORMALIZE GST BREAKDOWN

   Frontend कडून:

   [
     {
       rate: 5,
       taxable_amount: 10000
     }
   ]

   आले तरी GST amount backend calculate करेल.
===================================================== */

const normalizeGSTBreakdown = (
  breakdown,
  totalAmount
) => {
  if (!Array.isArray(breakdown)) {
    return [];
  }

  const result = [];

  for (const item of breakdown) {
    const rate = Number(item?.rate);
    const taxableAmount = Number(
      item?.taxable_amount
    );

    if (
      Number.isNaN(rate) ||
      rate < 0 ||
      rate > 100
    ) {
      continue;
    }

    if (
      Number.isNaN(taxableAmount) ||
      taxableAmount < 0
    ) {
      continue;
    }

    const gstAmount = round2(
      taxableAmount * rate / 100
    );

    result.push({
      rate: round2(rate),
      taxable_amount: round2(taxableAmount),
      gst_amount: gstAmount,
    });
  }

  /*
     जर breakdown चा taxable total
     main total_amount पेक्षा वेगळा असेल,
     backend blindly बदलणार नाही.

     कारण OCR/manual entry मध्ये user ला
     data correct करण्याची संधी असावी.
  */

  return result;
};


/* =====================================================
   PREPARE GST DATA

   Single GST:
      total_amount = 10000
      gst_rate = 18

   Multiple GST:
      gst_breakdown = [
        { rate: 5, taxable_amount: 10000 },
        { rate: 12, taxable_amount: 20000 }
      ]
===================================================== */

const calculateTaxData = ({
  amount,
  gstRate,
  gstRates,
  gstBreakdown,
  sameState,
}) => {

  let breakdown = normalizeGSTBreakdown(
    gstBreakdown,
    amount
  );


  /* ===================================================
     जर breakdown नाही आणि एक GST rate आहे
  =================================================== */

  if (
    breakdown.length === 0 &&
    Number(gstRate) >= 0
  ) {
    const rate = Number(gstRate);

    breakdown = [
      {
        rate: round2(rate),
        taxable_amount: round2(amount),
        gst_amount: round2(
          amount * rate / 100
        ),
      },
    ];
  }


  /* ===================================================
     GST RATES ARRAY
  =================================================== */

  let rates = [];

  if (Array.isArray(gstRates)) {
    rates = gstRates
      .map((rate) => Number(rate))
      .filter(
        (rate) =>
          !Number.isNaN(rate) &&
          rate >= 0 &&
          rate <= 100
      );
  }


  /*
     Breakdown मधील rates पण include करा
  */

  breakdown.forEach((item) => {
    const rate = Number(item.rate);

    if (
      !rates.includes(rate)
    ) {
      rates.push(rate);
    }
  });


  /*
     Main gst_rate पण include करा
  */

  if (
    !Number.isNaN(Number(gstRate)) &&
    !rates.includes(Number(gstRate))
  ) {
    rates.push(Number(gstRate));
  }


  /* ===================================================
     जर काहीच rate नसेल
  =================================================== */

  if (rates.length === 0) {
    rates = [0];
  }


  rates = rates.map(round2);


  /* ===================================================
     TOTAL GST
  =================================================== */

  let totalTax = 0;

  for (const item of breakdown) {
    totalTax += Number(item.gst_amount || 0);
  }

  totalTax = round2(totalTax);


  /* ===================================================
     CGST / SGST / IGST

     Multiple GST rates असल्यास प्रत्येक rate चे
     GST amounts एकत्र केले जातील.
  =================================================== */

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;


  if (sameState) {

    /*
       प्रत्येक GST rate चे अर्धे CGST
       आणि अर्धे SGST
    */

    for (const item of breakdown) {

      const rate = Number(item.rate);
      const taxableAmount =
        Number(item.taxable_amount);

      const halfRate =
        rate / 2;

      const halfAmount =
        round2(
          taxableAmount *
          halfRate /
          100
        );

      cgstRate += halfRate;
      sgstRate += halfRate;

      cgstAmount += halfAmount;
      sgstAmount += halfAmount;
    }

    cgstRate = round2(cgstRate);
    sgstRate = round2(sgstRate);

    cgstAmount = round2(cgstAmount);
    sgstAmount = round2(sgstAmount);

  } else {

    /*
       Different state = IGST
    */

    for (const item of breakdown) {

      const rate = Number(item.rate);

      const taxableAmount =
        Number(item.taxable_amount);

      const igstAmountForRate =
        round2(
          taxableAmount *
          rate /
          100
        );

      igstRate += rate;
      igstAmount += igstAmountForRate;
    }

    igstRate = round2(igstRate);
    igstAmount = round2(igstAmount);
  }


  /*
     Tax rounding correction

     Breakdown GST = actual total GST.
  */

  const calculatedTax =
    round2(
      cgstAmount +
      sgstAmount +
      igstAmount
    );


  /*
     जर same state असेल तर CGST + SGST
     किंवा different state असेल तर IGST
  */

  if (sameState) {

    /*
       Floating point difference असल्यास
       SGST मध्ये correction.
    */

    const difference =
      round2(
        totalTax -
        (cgstAmount + sgstAmount)
      );

    if (difference !== 0) {
      sgstAmount =
        round2(
          sgstAmount + difference
        );
    }

  } else {

    igstAmount = totalTax;
  }


  return {
    rates,
    breakdown,

    cgstRate,
    cgstAmount,

    sgstRate,
    sgstAmount,

    igstRate,
    igstAmount,

    totalTax,
    calculatedTax,
  };
};


/* =====================================================
   GET USER
===================================================== */

const getLoggedUser = async (req) => {
  return await User.findById(
    req.user._id
  );
};


/* =====================================================
   CREATE INVOICE
===================================================== */

export const createInvoice = async (
  req,
  res
) => {

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
      gst_rates,
      gst_breakdown,

      description,
      status,
    } = req.body;


    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (!invoice_number?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice number is required",
      });
    }


    if (!invoice_date) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice date is required",
      });
    }


    if (!vendor_name?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Vendor name is required",
      });
    }


    if (
      total_amount === undefined ||
      total_amount === null ||
      total_amount === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Total amount is required",
      });
    }


    const amount =
      Number(total_amount);


    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid total amount",
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
        message:
          "Invalid invoice date",
      });
    }


    const invoiceYear =
      parsedDate.getFullYear();

    const invoiceMonth =
      parsedDate.getMonth() + 1;


    /* =================================================
       USER
    ================================================= */

    const user =
      await getLoggedUser(req);


    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User not found",
      });
    }


    /* =================================================
       COMPANY STATE
    ================================================= */

    const companyState =
      user.companyState;


    if (!companyState) {
      return res.status(400).json({
        success: false,
        message:
          "Company state is required",
      });
    }


    /* =================================================
       VENDOR GST

       GSTIN मिळाला असेल तर YES automatically
    ================================================= */

    let vendorGST = "";

    let vendorHasGST =
      vendor_has_gst === true ||
      vendor_has_gst === "true" ||
      vendor_has_gst === "yes";


    let vendorStateFinal =
      vendor_state?.trim() || "";

    let vendorStateCode = "";


    /*
       GSTIN आलेला असेल तर
       automatically GST = YES
    */

    if (
      vendor_gstin &&
      String(vendor_gstin).trim()
    ) {

      vendorHasGST = true;

      vendorGST =
        String(vendor_gstin)
          .toUpperCase()
          .trim();
    }


    /* =================================================
       VENDOR HAS GST
    ================================================= */

    if (vendorHasGST) {

      if (!vendorGST) {
        return res.status(400).json({
          success: false,
          message:
            "Vendor GST number is required",
        });
      }


      if (
        !GST_REGEX.test(vendorGST)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid vendor GST number",
        });
      }


      /* ===============================================
         STATE CODE
      =============================================== */

      vendorStateCode =
        vendorGST.substring(0, 2);


      /*
         GSTIN मधून state मिळवा.
         जर frontend ने चुकीचा state पाठवला तरी
         GSTIN state ला priority.
      */

      const gstState =
        stateCodeMap[
          vendorStateCode
        ] || "";


      if (!vendorStateFinal) {
        vendorStateFinal =
          gstState;
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
    ================================================= */

    else {

      vendorGST = "";

      vendorStateCode = "";

      vendorHasGST = false;


      if (!vendorStateFinal) {
        return res.status(400).json({
          success: false,
          message:
            "Please select vendor state",
        });
      }
    }


    /* =================================================
       GST RATE

       Multiple GST असेल तर breakdown मधून
       rates मिळतील.
    ================================================= */

    let mainGSTRate =
      Number(gst_rate);


    if (
      Number.isNaN(mainGSTRate)
    ) {
      mainGSTRate = 0;
    }


    if (
      mainGSTRate < 0 ||
      mainGSTRate > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid GST rate",
      });
    }


    /* =================================================
       SAME STATE / DIFFERENT STATE
    ================================================= */

    const sameState =
      companyState
        .toLowerCase()
        .trim() ===
      vendorStateFinal
        .toLowerCase()
        .trim();


    const taxType =
      sameState
        ? "CGST_SGST"
        : "IGST";


    /* =================================================
       TAX CALCULATION
    ================================================= */

    const taxData =
      calculateTaxData({
        amount,
        gstRate: mainGSTRate,
        gstRates: gst_rates,
        gstBreakdown: gst_breakdown,
        sameState,
      });


    /* =================================================
       GRAND TOTAL
    ================================================= */

    const grandTotal =
      round2(
        amount +
        taxData.totalTax
      );


    /* =================================================
       CREATE INVOICE
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
          vendorHasGST,

        vendor_gstin:
          vendorGST,

        vendor_state:
          vendorStateFinal,

        vendor_state_code:
          vendorStateCode,

        tax_type:
          taxType,

        gst_rate:
          mainGSTRate,

        gst_rates:
          taxData.rates,

        gst_breakdown:
          taxData.breakdown,

        cgst_rate:
          taxData.cgstRate,

        cgst_amount:
          taxData.cgstAmount,

        sgst_rate:
          taxData.sgstRate,

        sgst_amount:
          taxData.sgstAmount,

        igst_rate:
          taxData.igstRate,

        igst_amount:
          taxData.igstAmount,

        total_amount:
          round2(amount),

        total_tax:
          taxData.totalTax,

        grand_total:
          grandTotal,

        description:
          description?.trim() || "",

        status:
          ["Pending", "Paid", "Cancelled"].includes(
            status
          )
            ? status
            : "Pending",
      });


    /* =================================================
       POPULATE USER
    ================================================= */

    await invoice.populate(
      "user_id",
      "name companyName companyAddress companyState hasGST gstNumber"
    );


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
   GET ALL INVOICES
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
   UPDATE INVOICE
===================================================== */

export const updateInvoice = async (
  req,
  res
) => {

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
      gst_rates,
      gst_breakdown,

      description,
      status,
    } = req.body;


    /* =================================================
       VALIDATION
    ================================================= */

    if (!invoice_number?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice number is required",
      });
    }


    if (!invoice_date) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice date is required",
      });
    }


    if (!vendor_name?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Vendor name is required",
      });
    }


    if (
      total_amount === undefined ||
      total_amount === null ||
      total_amount === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Total amount is required",
      });
    }


    const amount =
      Number(total_amount);


    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid total amount",
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
        message:
          "Invalid invoice date",
      });
    }


    const invoiceYear =
      parsedDate.getFullYear();

    const invoiceMonth =
      parsedDate.getMonth() + 1;


    /* =================================================
       USER
    ================================================= */

    const user =
      await getLoggedUser(req);


    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User not found",
      });
    }


    /* =================================================
       COMPANY STATE
    ================================================= */

    const companyState =
      user.companyState;


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

    let vendorHasGST =
      vendor_has_gst === true ||
      vendor_has_gst === "true" ||
      vendor_has_gst === "yes";


    let vendorStateFinal =
      vendor_state?.trim() || "";

    let vendorStateCode = "";


    /*
       GSTIN असेल तर automatically YES
    */

    if (
      vendor_gstin &&
      String(vendor_gstin).trim()
    ) {

      vendorHasGST = true;

      vendorGST =
        String(vendor_gstin)
          .toUpperCase()
          .trim();
    }


    /* =================================================
       GST VALIDATION
    ================================================= */

    if (vendorHasGST) {

      if (!vendorGST) {
        return res.status(400).json({
          success: false,
          message:
            "Vendor GST number is required",
        });
      }


      if (
        !GST_REGEX.test(vendorGST)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid vendor GST number",
        });
      }


      vendorStateCode =
        vendorGST.substring(0, 2);


      const gstState =
        stateCodeMap[
          vendorStateCode
        ] || "";


      /*
         GST मधून state मिळत असल्यास
         तोच वापरला जाईल.
      */

      vendorStateFinal =
        gstState ||
        vendorStateFinal;


      if (!vendorStateFinal) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to determine vendor state from GST",
        });
      }

    } else {

      vendorGST = "";

      vendorStateCode = "";

      vendorHasGST = false;


      if (!vendorStateFinal) {
        return res.status(400).json({
          success: false,
          message:
            "Please select vendor state",
        });
      }
    }


    /* =================================================
       GST RATE
    ================================================= */

    let mainGSTRate =
      Number(gst_rate);


    if (
      Number.isNaN(mainGSTRate)
    ) {
      mainGSTRate = 0;
    }


    if (
      mainGSTRate < 0 ||
      mainGSTRate > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid GST rate",
      });
    }


    /* =================================================
       TAX TYPE
    ================================================= */

    const sameState =
      companyState
        .toLowerCase()
        .trim() ===
      vendorStateFinal
        .toLowerCase()
        .trim();


    const taxType =
      sameState
        ? "CGST_SGST"
        : "IGST";


    /* =================================================
       TAX CALCULATION
    ================================================= */

    const taxData =
      calculateTaxData({
        amount,
        gstRate: mainGSTRate,
        gstRates: gst_rates,
        gstBreakdown: gst_breakdown,
        sameState,
      });


    /* =================================================
       GRAND TOTAL
    ================================================= */

    const grandTotal =
      round2(
        amount +
        taxData.totalTax
      );


    /* =================================================
       FIND EXISTING
    ================================================= */

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
      vendorHasGST;

    invoice.vendor_gstin =
      vendorGST;

    invoice.vendor_state =
      vendorStateFinal;

    invoice.vendor_state_code =
      vendorStateCode;

    invoice.tax_type =
      taxType;

    invoice.gst_rate =
      mainGSTRate;

    invoice.gst_rates =
      taxData.rates;

    invoice.gst_breakdown =
      taxData.breakdown;

    invoice.cgst_rate =
      taxData.cgstRate;

    invoice.cgst_amount =
      taxData.cgstAmount;

    invoice.sgst_rate =
      taxData.sgstRate;

    invoice.sgst_amount =
      taxData.sgstAmount;

    invoice.igst_rate =
      taxData.igstRate;

    invoice.igst_amount =
      taxData.igstAmount;

    invoice.total_amount =
      round2(amount);

    invoice.total_tax =
      taxData.totalTax;

    invoice.grand_total =
      grandTotal;

    invoice.description =
      description?.trim() || "";


    if (
      status &&
      [
        "Pending",
        "Paid",
        "Cancelled",
      ].includes(status)
    ) {
      invoice.status =
        status;
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

      message:
        "Invoice updated successfully",

      invoice,

    });

  } catch (error) {

    console.error(
      "Update Invoice Error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to update invoice",

      error:
        error.message,

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
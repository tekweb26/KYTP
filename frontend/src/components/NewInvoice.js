import React, { useState } from "react";

import {
  X,
  Plus,
  Trash2,
  Search,
  ScanLine,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

import toast from "react-hot-toast";
import { invoiceAPI } from "../api/api";
import "./NewInvoice.css";

const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const GST_RATE_VALUES = [0, 5, 12, 18, 28];

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const GST_STATE_MAP = {
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

const getTodayISO = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const round2 = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const numberValue = (value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£]/g, "")
    .replace(/[^\d.-]/g, "");

  const n = Number(cleaned);

  return Number.isFinite(n) ? n : 0;
};

const cleanGSTIN = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .trim();

const getStateFromGSTIN = (gstin) => {
  const value = cleanGSTIN(gstin);

  if (value.length !== 15 || !GST_REGEX.test(value)) {
    return "";
  }

  return GST_STATE_MAP[value.substring(0, 2)] || "";
};

const getLoggedInUser = () => {
  try {
    const raw =
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/* =========================================================
   GST CALCULATION
========================================================= */

const buildGSTBreakdown = (taxableAmount, rate) => {
  const taxable = numberValue(taxableAmount);
  const gstRate = numberValue(rate);

  if (taxable <= 0 || gstRate <= 0) {
    return [];
  }

  return [
    {
      rate: gstRate,
      taxable_amount: round2(taxable),
      gst_amount: round2((taxable * gstRate) / 100),
      tax_type: "GST",
    },
  ];
};

const buildAutomaticGSTBreakdown = (
  taxableAmount,
  rate,
  vendorGSTIN,
  vendorState
) => {
  const taxable = numberValue(taxableAmount);
  const gstRate = numberValue(rate);

  if (taxable <= 0 || gstRate <= 0) {
    return [];
  }

  const user = getLoggedInUser();

  /*
   * User does not have GST at signup.
   * Therefore automatic CGST/SGST/IGST comparison
   * should not be forced.
   */
  if (!user || user.hasGST !== true) {
    return [];
  }

  const userGSTIN = cleanGSTIN(
    user.gstNumber || user.gstin || ""
  );

  const userState =
    user.companyState || getStateFromGSTIN(userGSTIN);

  const vendorGST = cleanGSTIN(vendorGSTIN);

  const detectedVendorState =
    vendorState || getStateFromGSTIN(vendorGST);

  if (!userState || !detectedVendorState) {
    return [];
  }

  const totalGST = round2(
    (taxable * gstRate) / 100
  );

  /* SAME STATE -> CGST + SGST */

  if (
    userState.toLowerCase() ===
    detectedVendorState.toLowerCase()
  ) {
    const halfRate = round2(gstRate / 2);
    const halfAmount = round2(totalGST / 2);

    return [
      {
        rate: halfRate,
        taxable_amount: round2(taxable),
        gst_amount: halfAmount,
        tax_type: "CGST",
      },
      {
        rate: halfRate,
        taxable_amount: round2(taxable),
        gst_amount: halfAmount,
        tax_type: "SGST",
      },
    ];
  }

  /* DIFFERENT STATE -> IGST */

  return [
    {
      rate: gstRate,
      taxable_amount: round2(taxable),
      gst_amount: totalGST,
      tax_type: "IGST",
    },
  ];
};

/* =========================================================
   MULTI-RATE GST CALCULATION
========================================================= */

const buildMultiRateGSTBreakdown = (
  groupedAmounts,
  vendorGSTIN,
  vendorState
) => {
  const groups = Object.entries(groupedAmounts || {})
    .map(([rate, taxable]) => ({
      rate: numberValue(rate),
      taxable: round2(taxable),
    }))
    .filter(
      (group) =>
        GST_RATE_VALUES.includes(group.rate) &&
        group.rate > 0 &&
        group.taxable > 0
    )
    .sort((a, b) => a.rate - b.rate);

  if (!groups.length) {
    return [];
  }

  const user = getLoggedInUser();

  /*
   * If user has no GST, keep generic GST rows.
   */
  if (!user || user.hasGST !== true) {
    return groups.map((group) => ({
      rate: group.rate,
      taxable_amount: group.taxable,
      gst_amount: round2(
        (group.taxable * group.rate) / 100
      ),
      tax_type: "GST",
    }));
  }

  const userGSTIN = cleanGSTIN(
    user.gstNumber || user.gstin || ""
  );

  const userState =
    user.companyState || getStateFromGSTIN(userGSTIN);

  const vendorGST = cleanGSTIN(vendorGSTIN);

  const detectedVendorState =
    vendorState || getStateFromGSTIN(vendorGST);

  if (!userState || !detectedVendorState) {
    return groups.map((group) => ({
      rate: group.rate,
      taxable_amount: group.taxable,
      gst_amount: round2(
        (group.taxable * group.rate) / 100
      ),
      tax_type: "GST",
    }));
  }

  const sameState =
    userState.toLowerCase() ===
    detectedVendorState.toLowerCase();

  const breakdown = [];

  groups.forEach((group) => {
    const totalGST = round2(
      (group.taxable * group.rate) / 100
    );

    if (sameState) {
      const halfRate = round2(group.rate / 2);
      const halfAmount = round2(totalGST / 2);

      breakdown.push({
        rate: halfRate,
        taxable_amount: group.taxable,
        gst_amount: halfAmount,
        tax_type: "CGST",
      });

      breakdown.push({
        rate: halfRate,
        taxable_amount: group.taxable,
        gst_amount: halfAmount,
        tax_type: "SGST",
      });
    } else {
      breakdown.push({
        rate: group.rate,
        taxable_amount: group.taxable,
        gst_amount: totalGST,
        tax_type: "IGST",
      });
    }
  });

  return breakdown;
};

/* =========================================================
   GROUP ITEMS BY GST RATE
========================================================= */

const groupItemsByGSTRate = (items) => {
  const groups = {};

  (Array.isArray(items) ? items : []).forEach((item) => {
    const rate = numberValue(item?.gst_rate);
    const amount = numberValue(
      item?.amount_before_gst ?? item?.amount ?? item?.taxable_amount
    );

    if (rate <= 0 || amount <= 0) return;

    const key = rate.toString();
    groups[key] = round2((groups[key] || 0) + amount);
  });

  return groups;
};

/* =========================================================
   TAXABLE TOTAL FROM GST BREAKDOWN
========================================================= */

const getTaxableTotalFromBreakdown = (breakdown) => {
  const rows = Array.isArray(breakdown) ? breakdown : [];
  if (!rows.length) return 0;

  let total = 0;
  const countedCGST = new Set();

  rows.forEach((row) => {
    const taxable = numberValue(row?.taxable_amount);
    if (taxable <= 0) return;

    const type = String(row?.tax_type || '').toUpperCase();
    const rate = numberValue(row?.rate);

    if (type === 'CGST' || type === 'SGST') {
      if (type === 'CGST') {
        const key = `${rate}-${taxable}`;
        if (!countedCGST.has(key)) {
          total += taxable;
          countedCGST.add(key);
        }
      }
      return;
    }

    total += taxable;
  });

  return round2(total);
};

/* =========================================================
   MOCK GST API
   Later replace only this function with real API.
========================================================= */

const checkGSTStatus = async (gstin) => {
  const value = cleanGSTIN(gstin);

  if (!GST_REGEX.test(value)) {
    throw new Error("Invalid GSTIN");
  }

  await new Promise((resolve) =>
    setTimeout(resolve, 700)
  );

  return {
    gstin: value,
    legalName: "ABC Private Limited",
    tradeName: "ABC Traders",
    centreJurisdiction: "PIMPRI RANGE",
    stateJurisdiction: "MAHARASHTRA STATE",
    registrationDate: "01/04/2022",
    taxpayerType: "Regular",
    status: "Active",
    businessActivity: [
      "Wholesale Business",
      "Retail Business",
      "Office / Sale Office",
    ],
    state: getStateFromGSTIN(value),
  };
};

/* =========================================================
   COMPONENT
========================================================= */

const NewInvoice = ({
  onClose,
  onCreated,
}) => {
  const [formData, setFormData] =
    useState({
      invoice_number: "",
      invoice_date: getTodayISO(),
      vendor_name: "",
      vendor_has_gst: "",
      vendor_gstin: "",
      vendor_state: "",
      total_amount: "",
      final_amount: "",
      total_gst: "0.00",

      /*
       * Kept for backend compatibility.
       * For multi-rate invoices, actual rates are stored
       * in items + gst_breakdown.
       */
      gst_rate: "",

      /*
       * No description field.
       */
      gst_breakdown: [],

      items: [],
    });

  const [loading, setLoading] =
    useState(false);

  const [gstChecking, setGSTChecking] =
    useState(false);

  const [gstStatus, setGSTStatus] =
    useState(null);

  const [showGSTPopup, setShowGSTPopup] =
    useState(false);

  /* =========================================================
     INVOICE SCANNER UI
     OCR will be connected later.
     ========================================================= */
  const [invoiceImage, setInvoiceImage] = useState(null);
  const [invoiceImagePreview, setInvoiceImagePreview] = useState("");

  const handleInvoiceImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an invoice image.");
      return;
    }

    if (invoiceImagePreview) {
      URL.revokeObjectURL(invoiceImagePreview);
    }

    setInvoiceImage(file);
    setInvoiceImagePreview(URL.createObjectURL(file));
    toast.success("Invoice image selected.");
  };

  const removeInvoiceImage = () => {
    if (invoiceImagePreview) {
      URL.revokeObjectURL(invoiceImagePreview);
    }

    setInvoiceImage(null);
    setInvoiceImagePreview("");
  };

  /* =========================================================
     BASIC INPUT
  ========================================================= */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGSTOptionChange = (
    value
  ) => {
    setFormData((prev) => ({
      ...prev,
      vendor_has_gst: value,

      vendor_gstin:
        value === "yes"
          ? prev.vendor_gstin
          : "",

      gst_breakdown:
        value === "no"
          ? []
          : prev.gst_breakdown,
    }));
  };

  const handleGSTINChange = (e) => {
    const gstin = cleanGSTIN(
      e.target.value
    );

    const state =
      getStateFromGSTIN(gstin);

    setFormData((prev) => ({
      ...prev,
      vendor_gstin: gstin,

      vendor_state:
        state ||
        prev.vendor_state,

      vendor_has_gst:
        gstin.length > 0
          ? "yes"
          : prev.vendor_has_gst,
    }));
  };

  /* =========================================================
     GST STATUS CHECK
  ========================================================= */

  const handleCheckGSTStatus =
    async () => {
      const gstin = cleanGSTIN(
        formData.vendor_gstin
      );

      if (!GST_REGEX.test(gstin)) {
        toast.error(
          "Please enter a valid GSTIN."
        );
        return;
      }

      try {
        setGSTChecking(true);

        const result =
          await checkGSTStatus(
            gstin
          );

        setGSTStatus(result);
        setShowGSTPopup(true);

        /*
         * GST API becomes source of truth for vendor name.
         */
        const apiName =
          result.legalName ||
          result.tradeName ||
          "";


        setFormData((prev) => ({
          ...prev,

          vendor_name:
            apiName ||
            prev.vendor_name,

          vendor_state:
            result.state ||
            prev.vendor_state,

          vendor_has_gst: "yes",

          vendor_gstin:
            result.gstin ||
            prev.vendor_gstin,
        }));
      } catch (error) {
        console.error(
          "GST status error:",
          error
        );

        toast.error(
          error.message ||
          "GST verification failed."
        );
      } finally {
        setGSTChecking(false);
      }
    };

  /* =========================================================
     GST CALCULATION
  ========================================================= */

  const calculateCurrentGST = () => {
    const taxable = numberValue(
      formData.total_amount
    );

    if (taxable <= 0) {
      toast.error(
        "Please enter taxable amount."
      );
      return;
    }

    /*
     * If OCR has multiple items/rates,
     * always calculate from those actual invoice rates.
     */
    if (
      formData.items?.length
    ) {
      const grouped =
        groupItemsByGSTRate(
          formData.items
        );

      const breakdown =
        buildMultiRateGSTBreakdown(
          grouped,
          formData.vendor_gstin,
          formData.vendor_state
        );

      if (breakdown.length) {
        const totalGST =
          round2(
            breakdown.reduce(
              (sum, row) =>
                sum +
                numberValue(
                  row.gst_amount
                ),
              0
            )
          );

        const taxableTotal =
          getTaxableTotalFromBreakdown(
            breakdown
          );

        const finalAmount =
          round2(
            taxableTotal +
            totalGST
          );

        const rates =
          Object.keys(grouped)
            .map(Number)
            .sort(
              (a, b) => a - b
            );

        setFormData((prev) => ({
          ...prev,

          total_amount:
            taxableTotal.toFixed(
              2
            ),

          total_gst:
            totalGST.toFixed(
              2
            ),

          final_amount:
            finalAmount.toFixed(
              2
            ),

          gst_rate:
            rates.length === 1
              ? rates[0]
              : "",

          gst_breakdown:
            breakdown,
        }));

        toast.success(
          "GST calculated from invoice rates."
        );

        return;
      }
    }

    /*
     * Manual single-rate calculation fallback.
     */
    const rate = numberValue(
      formData.gst_rate
    );

    if (rate <= 0) {
      setFormData((prev) => ({
        ...prev,

        total_amount:
          taxable.toFixed(2),

        total_gst: "0.00",

        final_amount:
          taxable.toFixed(2),

        gst_breakdown: [],
      }));

      return;
    }

    const vendorGSTIN =
      cleanGSTIN(
        formData.vendor_gstin
      );

    let breakdown = [];

    if (
      formData.vendor_has_gst ===
      "yes" &&
      vendorGSTIN
    ) {
      breakdown =
        buildAutomaticGSTBreakdown(
          taxable,
          rate,
          vendorGSTIN,
          formData.vendor_state
        );
    }

    if (!breakdown.length) {
      breakdown =
        buildGSTBreakdown(
          taxable,
          rate
        );
    }

    const totalGST =
      round2(
        breakdown.reduce(
          (sum, row) =>
            sum +
            numberValue(
              row.gst_amount
            ),
          0
        )
      );

    const finalAmount =
      round2(
        taxable + totalGST
      );

    setFormData((prev) => ({
      ...prev,

      total_amount:
        taxable.toFixed(2),

      total_gst:
        totalGST.toFixed(2),

      final_amount:
        finalAmount.toFixed(2),

      gst_breakdown:
        breakdown,
    }));

    toast.success(
      "GST calculated."
    );
  };

  /* =========================================================
     GST BREAKDOWN
  ========================================================= */

  const addGSTRow = () => {
    setFormData((prev) => ({
      ...prev,

      gst_breakdown: [
        ...(prev.gst_breakdown ||
          []),

        {
          rate: "",
          taxable_amount: "",
          gst_amount: "",
          tax_type: "GST",
        },
      ],
    }));
  };

  const removeGSTRow = (
    index
  ) => {
    setFormData((prev) => ({
      ...prev,

      gst_breakdown:
        prev.gst_breakdown.filter(
          (_, i) =>
            i !== index
        ),
    }));
  };

  const updateGSTRow = (
    index,
    field,
    value
  ) => {
    setFormData((prev) => {
      const rows = [
        ...(prev.gst_breakdown ||
          []),
      ];

      const row = {
        ...rows[index],
        [field]: value,
      };

      if (
        field === "rate" ||
        field ===
        "taxable_amount"
      ) {
        const rate =
          numberValue(
            row.rate
          );

        const taxable =
          numberValue(
            row.taxable_amount
          );

        row.gst_amount =
          rate > 0 &&
            taxable > 0
            ? round2(
              (taxable * rate) /
              100
            )
            : "";
      }

      rows[index] = row;

      const totalGST =
        round2(
          rows.reduce(
            (sum, item) =>
              sum +
              numberValue(
                item.gst_amount
              ),
            0
          )
        );

      const taxableAmount =
        getTaxableTotalFromBreakdown(
          rows
        );

      return {
        ...prev,

        gst_breakdown:
          rows,

        total_gst:
          totalGST.toFixed(2),

        total_amount:
          taxableAmount > 0
            ? taxableAmount.toFixed(
              2
            )
            : prev.total_amount,

        final_amount:
          taxableAmount > 0
            ? round2(
              taxableAmount +
              totalGST
            ).toFixed(2)
            : prev.final_amount,
      };
    });
  };

  const getBreakdownGSTTotal =
    () => {
      return round2(
        (
          formData.gst_breakdown ||
          []
        ).reduce(
          (sum, row) =>
            sum +
            numberValue(
              row.gst_amount
            ),
          0
        )
      );
    };

  /* =========================================================
     RESET
  ========================================================= */

  const resetForm = () => {
    setFormData({
      invoice_number: "",
      invoice_date: getTodayISO(),
      vendor_name: "",
      vendor_has_gst: "",
      vendor_gstin: "",
      vendor_state: "",
      total_amount: "",
      final_amount: "",
      total_gst: "0.00",
      gst_rate: "",
      gst_breakdown: [],
      items: [],
    });

    setGSTStatus(null);
    setShowGSTPopup(false);

    if (invoiceImagePreview) {
      URL.revokeObjectURL(invoiceImagePreview);
    }
    setInvoiceImage(null);
    setInvoiceImagePreview("");
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (
      !formData.invoice_number.trim()
    ) {
      toast.error(
        "Please enter invoice number."
      );

      return false;
    }

    if (!formData.invoice_date) {
      toast.error(
        "Please select invoice date."
      );

      return false;
    }

    if (
      !formData.vendor_name.trim()
    ) {
      toast.error(
        "Please enter vendor name."
      );

      return false;
    }

    if (
      !formData.vendor_has_gst
    ) {
      toast.error(
        "Please select vendor GST option."
      );

      return false;
    }

    if (
      formData.vendor_has_gst ===
      "yes"
    ) {
      if (
        !GST_REGEX.test(
          cleanGSTIN(
            formData.vendor_gstin
          )
        )
      ) {
        toast.error(
          "Please enter a valid GSTIN."
        );

        return false;
      }
    }

    if (
      formData.vendor_has_gst ===
      "no" &&
      !formData.vendor_state
    ) {
      toast.error(
        "Please select vendor state."
      );

      return false;
    }

    if (
      numberValue(
        formData.total_amount
      ) <= 0
    ) {
      toast.error(
        "Please enter a valid taxable amount."
      );

      return false;
    }

    return true;
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      let breakdown = [
        ...(formData.gst_breakdown ||
          []),
      ];

      if (
        formData.items?.length
      ) {
        const grouped =
          groupItemsByGSTRate(
            formData.items
          );

        if (
          Object.keys(grouped)
            .length
        ) {
          breakdown =
            buildMultiRateGSTBreakdown(
              grouped,
              formData.vendor_gstin,
              formData.vendor_state
            );

          console.log(
            "GST BREAKDOWN RESULT:",
            JSON.stringify(breakdown, null, 2)
          );
          console.log(
            "GST BREAKDOWN RESULT:",
            JSON.stringify(breakdown, null, 2)
          );
        }
      }

      /*
       * If breakdown is still empty, use manually entered
       * single rate as fallback.
       */
      if (!breakdown.length) {
        const taxableAmount =
          numberValue(
            formData.total_amount
          );

        const gstRate =
          numberValue(
            formData.gst_rate
          );

        if (
          gstRate > 0 &&
          taxableAmount > 0
        ) {
          breakdown =
            buildAutomaticGSTBreakdown(
              taxableAmount,
              gstRate,
              formData.vendor_gstin,
              formData.vendor_state
            );

          if (
            !breakdown.length
          ) {
            breakdown =
              buildGSTBreakdown(
                taxableAmount,
                gstRate
              );
          }
        }
      }

      const totalGST =
        round2(
          breakdown.reduce(
            (sum, row) =>
              sum +
              numberValue(
                row.gst_amount
              ),
            0
          )
        );

      /*
       * Never calculate taxable amount by summing CGST + SGST
       * taxable values twice.
       */
      let taxableAmount =
        getTaxableTotalFromBreakdown(
          breakdown
        );

      if (
        taxableAmount <= 0
      ) {
        taxableAmount =
          numberValue(
            formData.total_amount
          );
      }

      const finalAmount =
        round2(
          taxableAmount +
          totalGST
        );

      const finalBreakdown =
        breakdown.map(
          (row) => ({
            rate: numberValue(
              row.rate
            ),

            taxable_amount:
              numberValue(
                row.taxable_amount
              ),

            gst_amount:
              numberValue(
                row.gst_amount
              ),

            tax_type:
              row.tax_type ||
              "GST",
          })
        );

      /*
       * If only one invoice GST rate exists, keep it.
       * Multiple rates => gst_rate = null.
       */
      const uniqueRates = [
        ...new Set(
          (
            formData.items ||
            []
          )
            .map((item) =>
              numberValue(
                item.gst_rate
              )
            )
            .filter(
              (rate) =>
                rate > 0
            )
        ),
      ].sort(
        (a, b) => a - b
      );

      const gstRate =
        uniqueRates.length ===
          1
          ? uniqueRates[0]
          : uniqueRates.length >
            1
            ? null
            : numberValue(
              formData.gst_rate
            );

      const payload = {
        ...formData,

        vendor_gstin:
          formData.vendor_has_gst ===
            "yes"
            ? cleanGSTIN(
              formData.vendor_gstin
            )
            : "",

        total_amount:
          taxableAmount,

        total_gst:
          totalGST,

        final_amount:
          finalAmount,

        gst_rate:
          gstRate,

        gst_breakdown:
          finalBreakdown,

        /*
         * Invoice item details.
         * No description field.
         */
        items: (
          formData.items || []
        ).map((item) => ({
          hsn_sac:
            item.hsn_sac || "",

          quantity:
            numberValue(
              item.quantity
            ) || null,

          rate:
            numberValue(
              item.rate
            ) || null,

          amount:
            numberValue(
              item.amount
            ),

          gst_rate:
            numberValue(
              item.gst_rate
            ),
        })),
      };

      /*
       * Explicitly remove description in case an older
       * form state/backend spread somehow contains it.
       */
      delete payload.description;

      await invoiceAPI.createInvoice(
        payload
      );

      toast.success(
        "Invoice created successfully."
      );

      if (onCreated) {
        await onCreated();
      } else {
        resetForm();
      }
    } catch (error) {
      console.error(
        "Create invoice error:",
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
        error?.message ||
        "Unable to create invoice."
      );
    } finally {
      setLoading(false);
    }
  };

  const breakdownTotal =
    getBreakdownGSTTotal();

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal">

        {/* HEADER */}

        <div className="invoice-header">
          <div>
            <h1>New Invoice</h1>

            <p>
              Create a new invoice or
              scan an invoice.
            </p>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={
              onClose || resetForm
            }
            title="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* =====================================================
            INVOICE SCANNER - UI ONLY
            ===================================================== */}

        <div
          className="form-section"
          style={{
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "5px",
                }}
              >
                <ScanLine size={21} />
                Scan Invoice
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                }}
              >
                Upload an invoice image. OCR will be connected next.
              </p>
            </div>

            <label
              className="scan-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <Upload size={18} />
              {invoiceImage ? "Change Invoice" : "Upload Invoice"}
              <input
                type="file"
                accept="image/*"
                onChange={handleInvoiceImageSelect}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {invoiceImagePreview && (
            <div
              style={{
                marginTop: "18px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "12px",
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    fontWeight: 600,
                  }}
                >
                  <ImageIcon size={17} />
                  {invoiceImage?.name || "Invoice image"}
                </span>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={removeInvoiceImage}
                >
                  Remove
                </button>
              </div>

              <img
                src={invoiceImagePreview}
                alt="Invoice preview"
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: "420px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  background: "#ffffff",
                }}
              />
            </div>
          )}
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="invoice-form"
        >

          {/* INVOICE DETAILS */}

          <div className="form-section">
            <h2>
              Invoice Details
            </h2>

            <div className="form-grid">

              <div className="form-group">
                <label>
                  Invoice Number{" "}
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="invoice_number"
                  value={
                    formData.invoice_number
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter invoice number"
                />
              </div>

              <div className="form-group">
                <label>
                  Invoice Date{" "}
                  <span>*</span>
                </label>

                <input
                  type="date"
                  name="invoice_date"
                  value={
                    formData.invoice_date
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Vendor Name{" "}
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="vendor_name"
                  value={
                    formData.vendor_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter vendor name"
                />
              </div>

            </div>
          </div>

          {/* VENDOR GST */}

          <div className="form-section">
            <h2>
              Vendor GST Details
            </h2>

            <div className="form-group">
              <label>
                Does vendor have GST?{" "}
                <span>*</span>
              </label>

              <div className="radio-group">

                <label className="radio-option">
                  <input
                    type="radio"
                    name="vendor_has_gst"
                    value="yes"
                    checked={
                      formData.vendor_has_gst ===
                      "yes"
                    }
                    onChange={(e) =>
                      handleGSTOptionChange(
                        e.target.value
                      )
                    }
                  />

                  <span>
                    Yes
                  </span>
                </label>

                <label className="radio-option">
                  <input
                    type="radio"
                    name="vendor_has_gst"
                    value="no"
                    checked={
                      formData.vendor_has_gst ===
                      "no"
                    }
                    onChange={(e) =>
                      handleGSTOptionChange(
                        e.target.value
                      )
                    }
                  />

                  <span>
                    No
                  </span>
                </label>

              </div>
            </div>

            {formData.vendor_has_gst ===
              "yes" && (
                <div className="form-grid">

                  <div className="form-group">
                    <label>
                      Vendor GSTIN{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="vendor_gstin"
                      value={
                        formData.vendor_gstin
                      }
                      onChange={
                        handleGSTINChange
                      }
                      maxLength={15}
                      placeholder="Enter GSTIN"
                    />

                    <button
                      type="button"
                      className="scan-btn"
                      onClick={
                        handleCheckGSTStatus
                      }
                      disabled={
                        gstChecking
                      }
                      style={{
                        marginTop:
                          "10px",
                      }}
                    >
                      <Search
                        size={18}
                      />

                      {gstChecking
                        ? "Checking..."
                        : "Check GST Status"}
                    </button>
                  </div>

                  <div className="form-group">
                    <label>
                      Vendor State
                    </label>

                    <input
                      type="text"
                      value={
                        formData.vendor_state
                      }
                      readOnly
                      placeholder="State from GSTIN"
                    />
                  </div>

                </div>
              )}

            {formData.vendor_has_gst ===
              "no" && (
                <div className="form-group">
                  <label>
                    Vendor State{" "}
                    <span>*</span>
                  </label>

                  <select
                    name="vendor_state"
                    value={
                      formData.vendor_state
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      Select state
                    </option>

                    {STATES.map(
                      (state) => (
                        <option
                          key={state}
                          value={state}
                        >
                          {state}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}
          </div>

          {/* GST CALCULATION */}

          <div className="form-section">
            <h2>
              GST Calculation
            </h2>

            <div className="form-grid">

              <div className="form-group">
                <label>
                  Taxable Amount{" "}
                  <span>*</span>
                </label>

                <input
                  type="number"
                  name="total_amount"
                  value={
                    formData.total_amount
                  }
                  onChange={
                    handleChange
                  }
                  min="0"
                  step="0.01"
                  placeholder="Enter taxable amount"
                />
              </div>

              <div className="form-group">
                <label>
                  GST Rate (%)
                </label>

                <input
                  type="number"
                  name="gst_rate"
                  value={
                    formData.gst_rate
                  }
                  onChange={
                    handleChange
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Multiple rates are shown below"
                  disabled={
                    formData.items?.length >
                    0 &&
                    new Set(
                      formData.items.map(
                        (item) =>
                          numberValue(
                            item.gst_rate
                          )
                      )
                    ).size > 1
                  }
                />
              </div>

            </div>

            <button
              type="button"
              className="scan-btn"
              onClick={
                calculateCurrentGST
              }
            >
              Calculate GST
            </button>

            {/* INVOICE ITEM INFORMATION */}

            {formData.items?.length >
              0 && (
                <div
                  className="gst-breakdown-section"
                  style={{
                    marginTop:
                      "20px",
                  }}
                >
                  <div className="gst-breakdown-header">
                    <div>
                      <h3>
                        Invoice Items
                      </h3>

                      <p>
                        Details extracted
                        from invoice details
                      </p>
                    </div>
                  </div>

                  <div className="gst-breakdown-list">

                    {formData.items.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className="gst-breakdown-row"
                          key={`item-${index}`}
                        >

                          <div className="form-group">
                            <label>
                              HSN/SAC
                            </label>

                            <input
                              value={
                                item.hsn_sac ||
                                ""
                              }
                              readOnly
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Quantity
                            </label>

                            <input
                              value={
                                item.quantity ??
                                ""
                              }
                              readOnly
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Rate
                            </label>

                            <input
                              value={
                                item.rate ??
                                ""
                              }
                              readOnly
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Amount
                            </label>

                            <input
                              value={
                                item.amount ??
                                ""
                              }
                              readOnly
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              GST Rate
                            </label>

                            <input
                              value={
                                item.gst_rate ??
                                ""
                              }
                              readOnly
                            />
                          </div>

                        </div>
                      )
                    )}

                  </div>
                </div>
              )}

            {/* BREAKDOWN */}

            <div className="gst-breakdown-section">

              <div className="gst-breakdown-header">

                <div>
                  <h3>
                    GST Breakdown
                  </h3>

                  <p>
                    GST calculation
                    details
                  </p>
                </div>

                <button
                  type="button"
                  className="add-gst-btn"
                  onClick={
                    addGSTRow
                  }
                >
                  <Plus size={18} />
                  Add GST
                </button>

              </div>

              {!formData.gst_breakdown
                ?.length ? (
                <div className="empty-breakdown">
                  No GST breakdown
                  added.
                </div>
              ) : (
                <div className="gst-breakdown-list">

                  {formData.gst_breakdown.map(
                    (
                      row,
                      index
                    ) => (
                      <div
                        className="gst-breakdown-row"
                        key={index}
                      >

                        <div className="form-group">
                          <label>
                            Tax Type
                          </label>

                          <select
                            value={
                              row.tax_type ||
                              "GST"
                            }
                            onChange={(e) =>
                              updateGSTRow(
                                index,
                                "tax_type",
                                e.target.value
                              )
                            }
                          >
                            <option value="GST">
                              GST
                            </option>

                            <option value="CGST">
                              CGST
                            </option>

                            <option value="SGST">
                              SGST
                            </option>

                            <option value="IGST">
                              IGST
                            </option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>
                            Rate (%)
                          </label>

                          <input
                            type="number"
                            value={
                              row.rate ??
                              ""
                            }
                            onChange={(e) =>
                              updateGSTRow(
                                index,
                                "rate",
                                e.target.value
                              )
                            }
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            Taxable Amount
                          </label>

                          <input
                            type="number"
                            value={
                              row.taxable_amount ??
                              ""
                            }
                            onChange={(e) =>
                              updateGSTRow(
                                index,
                                "taxable_amount",
                                e.target.value
                              )
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            GST Amount
                          </label>

                          <input
                            type="number"
                            value={
                              row.gst_amount ??
                              ""
                            }
                            onChange={(e) =>
                              updateGSTRow(
                                index,
                                "gst_amount",
                                e.target.value
                              )
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <button
                          type="button"
                          className="delete-gst-btn"
                          onClick={() =>
                            removeGSTRow(
                              index
                            )
                          }
                          title="Remove GST row"
                        >
                          <Trash2
                            size={18}
                          />
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}
            </div>

            {/* SUMMARY */}

            <div className="calculation-summary">

              <div className="summary-row">
                <span>
                  Taxable Amount
                </span>

                <strong>
                  ₹{" "}
                  {numberValue(
                    formData.total_amount
                  ).toFixed(2)}
                </strong>
              </div>

              {formData.gst_breakdown?.map(
                (
                  row,
                  index
                ) => (
                  <div
                    className="summary-row"
                    key={`summary-${index}`}
                  >
                    <span>
                      {row.tax_type ||
                        "GST"}{" "}
                      {numberValue(
                        row.rate
                      )}
                      %
                    </span>

                    <strong>
                      ₹{" "}
                      {numberValue(
                        row.gst_amount
                      ).toFixed(2)}
                    </strong>
                  </div>
                )
              )}

              <div className="summary-row">
                <span>
                  Total GST
                </span>

                <strong>
                  ₹{" "}
                  {breakdownTotal.toFixed(
                    2
                  )}
                </strong>
              </div>

              <div className="summary-row total-row">
                <span>
                  Final Amount
                </span>

                <strong>
                  ₹{" "}
                  {round2(
                    numberValue(
                      formData.total_amount
                    ) +
                    breakdownTotal
                  ).toFixed(2)}
                </strong>
              </div>

            </div>
          </div>

          {/* ACTIONS */}

          <div className="form-actions">

            <button
              type="button"
              className="cancel-btn"
              onClick={
                onClose ||
                resetForm
              }
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Save Invoice"}
            </button>

          </div>

        </form>

        {/* GST STATUS POPUP */}

        {showGSTPopup &&
          gstStatus && (
            <div
              className="camera-modal"
              onClick={() =>
                setShowGSTPopup(
                  false
                )
              }
            >
              <div
                className="camera-modal-content"
                style={{
                  maxWidth:
                    "650px",
                  width: "95%",
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <div className="camera-modal-header">
                  <h2>
                    GST Registration
                    Details
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      setShowGSTPopup(
                        false
                      )
                    }
                  >
                    <X size={22} />
                  </button>
                </div>

                <div
                  style={{
                    padding:
                      "20px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "15px",
                    }}
                  >

                    <div className="form-group">
                      <label>
                        GSTIN
                      </label>

                      <input
                        value={
                          gstStatus.gstin ||
                          ""
                        }
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        GSTIN Status
                      </label>

                      <input
                        value={
                          gstStatus.status ||
                          ""
                        }
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Legal Name
                      </label>

                      <input
                        value={
                          gstStatus.legalName ||
                          ""
                        }
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Trade Name
                      </label>

                      <input
                        value={
                          gstStatus.tradeName ||
                          ""
                        }
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Centre Jurisdiction
                      </label>

                      <input
                        value={
                          gstStatus.centreJurisdiction ||
                          ""
                        }
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        State Jurisdiction
                      </label>

                      <input
                        value={
                          gstStatus.stateJurisdiction ||
                          ""
                        }
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Registration Date
                      </label>

                      <input
                        value={
                          gstStatus.registrationDate ||
                          ""
                        }
                        readOnly
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Taxpayer Type
                      </label>

                      <input
                        value={
                          gstStatus.taxpayerType ||
                          ""
                        }
                        readOnly
                      />
                    </div>

                  </div>

                  <div
                    className="form-group"
                    style={{
                      marginTop:
                        "15px",
                    }}
                  >
                    <label>
                      Business Activity
                    </label>

                    <input
                      value={(
                        gstStatus.businessActivity ||
                        []
                      ).join(
                        ", "
                      )}
                      readOnly
                    />
                  </div>

                  <div
                    style={{
                      marginTop:
                        "20px",
                      textAlign:
                        "right",
                    }}
                  >
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() =>
                        setShowGSTPopup(
                          false
                        )
                      }
                    >
                      Close
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

      </div>
    </div>
  );
};

export default NewInvoice;
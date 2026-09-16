import React, { useState, useRef } from "react";

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
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const round2 = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const numberValue = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
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

  if (
    value.length !== 15 ||
    !GST_REGEX.test(value)
  ) {
    return "";
  }

  return (
    GST_STATE_MAP[value.substring(0, 2)] ||
    ""
  );
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
   DATE HELPERS
========================================================= */

const convertInvoiceDateToISO = (value) => {
  if (!value) return "";

  const text = String(value).trim();

  /*
   * Already ISO:
   * 2022-05-26
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(text)
  ) {
    return text;
  }

  /*
   * Backend Gemini currently returns:
   * 26-May-2022
   */
  const monthMap = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  const match = text.match(
    /^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{4})$/
  );

  if (match) {
    const day = match[1].padStart(2, "0");
    const month =
      monthMap[
      match[2].substring(0, 3).toLowerCase()
      ];

    if (month) {
      return `${match[3]}-${month}-${day}`;
    }
  }

  /*
   * DD/MM/YYYY or DD-MM-YYYY
   */
  const numericMatch = text.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
  );

  if (numericMatch) {
    const day = numericMatch[1].padStart(2, "0");
    const month = numericMatch[2].padStart(2, "0");

    return `${numericMatch[3]}-${month}-${day}`;
  }

  return "";
};

/* =========================================================
   GST CALCULATION
========================================================= */

const buildGSTBreakdown = (
  taxableAmount,
  rate
) => {
  const taxable =
    numberValue(taxableAmount);

  const gstRate =
    numberValue(rate);

  if (
    taxable <= 0 ||
    gstRate <= 0
  ) {
    return [];
  }

  return [
    {
      rate: gstRate,
      taxable_amount:
        round2(taxable),
      gst_amount: round2(
        (taxable * gstRate) / 100
      ),
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
  const taxable =
    numberValue(taxableAmount);

  const gstRate =
    numberValue(rate);

  if (
    taxable <= 0 ||
    gstRate <= 0
  ) {
    return [];
  }

  const user =
    getLoggedInUser();

  if (
    !user ||
    user.hasGST !== true
  ) {
    return [];
  }

  const userGSTIN =
    cleanGSTIN(
      user.gstNumber ||
      user.gstin ||
      ""
    );

  const userState =
    user.companyState ||
    getStateFromGSTIN(
      userGSTIN
    );

  const vendorGST =
    cleanGSTIN(vendorGSTIN);

  const detectedVendorState =
    getStateFromGSTIN(
      vendorGST
    ) ||
    vendorState;

  if (
    !userState ||
    !detectedVendorState
  ) {
    return [];
  }

  const totalGST =
    round2(
      (taxable * gstRate) / 100
    );

  if (
    userState.toLowerCase() ===
    detectedVendorState.toLowerCase()
  ) {
    const halfRate =
      round2(gstRate / 2);

    const halfAmount =
      round2(totalGST / 2);

    return [
      {
        rate: halfRate,
        taxable_amount:
          round2(taxable),
        gst_amount:
          halfAmount,
        tax_type: "CGST",
      },
      {
        rate: halfRate,
        taxable_amount:
          round2(taxable),
        gst_amount:
          halfAmount,
        tax_type: "SGST",
      },
    ];
  }

  return [
    {
      rate: gstRate,
      taxable_amount:
        round2(taxable),
      gst_amount:
        totalGST,
      tax_type: "IGST",
    },
  ];
};

/* =========================================================
   MULTI-RATE GST
========================================================= */

const buildMultiRateGSTBreakdown = (
  groupedAmounts,
  vendorGSTIN,
  vendorState
) => {
  const groups =
    Object.entries(
      groupedAmounts || {}
    )
      .map(
        ([rate, taxable]) => ({
          rate: numberValue(rate),
          taxable:
            round2(taxable),
        })
      )
      .filter(
        (group) =>
          GST_RATE_VALUES.includes(
            group.rate
          ) &&
          group.rate > 0 &&
          group.taxable > 0
      )
      .sort(
        (a, b) =>
          a.rate - b.rate
      );

  if (!groups.length) {
    return [];
  }

  const user =
    getLoggedInUser();

  if (
    !user ||
    user.hasGST !== true
  ) {
    return groups.map(
      (group) => ({
        rate: group.rate,
        taxable_amount:
          group.taxable,
        gst_amount:
          round2(
            (group.taxable *
              group.rate) /
            100
          ),
        tax_type: "GST",
      })
    );
  }

  const userGSTIN =
    cleanGSTIN(
      user.gstNumber ||
      user.gstin ||
      ""
    );

  const userState =
    user.companyState ||
    getStateFromGSTIN(
      userGSTIN
    );

  const vendorGST =
    cleanGSTIN(vendorGSTIN);

  /*
   * Prefer GSTIN-derived state because
   * Sandbox test data may return demo state.
   */
  const detectedVendorState =
    getStateFromGSTIN(
      vendorGST
    ) ||
    vendorState;

  if (
    !userState ||
    !detectedVendorState
  ) {
    return groups.map(
      (group) => ({
        rate: group.rate,
        taxable_amount:
          group.taxable,
        gst_amount:
          round2(
            (group.taxable *
              group.rate) /
            100
          ),
        tax_type: "GST",
      })
    );
  }

  const sameState =
    userState.toLowerCase() ===
    detectedVendorState.toLowerCase();

  const breakdown = [];

  groups.forEach(
    (group) => {
      const totalGST =
        round2(
          (group.taxable *
            group.rate) /
          100
        );

      if (sameState) {
        const halfRate =
          round2(
            group.rate / 2
          );

        const halfAmount =
          round2(
            totalGST / 2
          );

        breakdown.push({
          rate: halfRate,
          taxable_amount:
            group.taxable,
          gst_amount:
            halfAmount,
          tax_type: "CGST",
        });

        breakdown.push({
          rate: halfRate,
          taxable_amount:
            group.taxable,
          gst_amount:
            halfAmount,
          tax_type: "SGST",
        });
      } else {
        breakdown.push({
          rate: group.rate,
          taxable_amount:
            group.taxable,
          gst_amount:
            totalGST,
          tax_type: "IGST",
        });
      }
    }
  );

  return breakdown;
};

/* =========================================================
   GROUP ITEMS BY GST RATE
========================================================= */

const groupItemsByGSTRate = (
  items
) => {
  const groups = {};

  (
    Array.isArray(items)
      ? items
      : []
  ).forEach((item) => {
    const rate =
      numberValue(
        item?.gst_rate
      );

    const amount =
      numberValue(
        item?.amount_before_gst ??
        item?.amount ??
        item?.taxable_amount
      );

    if (
      rate <= 0 ||
      amount <= 0
    ) {
      return;
    }

    const key =
      rate.toString();

    groups[key] =
      round2(
        (groups[key] || 0) +
        amount
      );
  });

  return groups;
};

/* =========================================================
   TAXABLE TOTAL
========================================================= */

const getTaxableTotalFromBreakdown =
  (breakdown) => {
    const rows =
      Array.isArray(breakdown)
        ? breakdown
        : [];

    if (!rows.length) {
      return 0;
    }

    let total = 0;
    const countedCGST =
      new Set();

    rows.forEach((row) => {
      const taxable =
        numberValue(
          row?.taxable_amount
        );

      if (taxable <= 0) {
        return;
      }

      const type =
        String(
          row?.tax_type || ""
        ).toUpperCase();

      const rate =
        numberValue(
          row?.rate
        );

      if (
        type === "CGST" ||
        type === "SGST"
      ) {
        if (type === "CGST") {
          const key =
            `${rate}-${taxable}`;

          if (
            !countedCGST.has(
              key
            )
          ) {
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
   COMPONENT
========================================================= */

const NewInvoice = ({
  onClose,
  onCreated,
}) => {
  const invoiceNumberRef = useRef(null);
  const invoiceDateRef = useRef(null);
  const vendorNameRef = useRef(null);
  const vendorGSTOptionRef = useRef(null);
  const vendorGSTINRef = useRef(null);
  const vendorStateRef = useRef(null);
  const totalAmountRef = useRef(null);
  const [formData, setFormData] =
    useState({
      invoice_number: "",
      invoice_date:
        getTodayISO(),
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

  const [loading, setLoading] =
    useState(false);

  const [gstChecking, setGSTChecking] =
    useState(false);

  const [gstStatus, setGSTStatus] =
    useState(null);

  const [showGSTPopup, setShowGSTPopup] =
    useState(false);

  /* =========================================================
     SCANNER
  ========================================================= */

  const [invoiceImage, setInvoiceImage] =
    useState(null);

  const [
    invoiceImagePreview,
    setInvoiceImagePreview,
  ] = useState("");

  const [scanning, setScanning] =
    useState(false);

  const [scanResult, setScanResult] =
    useState(null);

  /* =========================================================
     IMAGE SELECT
  ========================================================= */

  const handleInvoiceImageSelect =
    (e) => {
      const file =
        e.target.files?.[0];

      if (!file) return;

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        toast.error(
          "Please select an invoice image."
        );
        return;
      }

      if (
        invoiceImagePreview
      ) {
        URL.revokeObjectURL(
          invoiceImagePreview
        );
      }

      setInvoiceImage(file);

      setInvoiceImagePreview(
        URL.createObjectURL(file)
      );

      setScanResult(null);

      toast.success(
        "Invoice image selected."
      );
    };

  /* =========================================================
     REMOVE IMAGE
  ========================================================= */

  const removeInvoiceImage =
    () => {
      if (
        invoiceImagePreview
      ) {
        URL.revokeObjectURL(
          invoiceImagePreview
        );
      }

      setInvoiceImage(null);
      setInvoiceImagePreview("");
      setScanResult(null);
    };

  /* =========================================================
     SCAN INVOICE
  ========================================================= */

  const handleScanInvoice =
    async () => {
      if (!invoiceImage) {
        console.log("❌ NO INVOICE IMAGE");
        toast.error(
          "Please upload an invoice image first."
        );
        return;
      }

      try {
        setScanning(true);

        const user =
          getLoggedInUser();

        /*
         * Try companyState first.
         * Otherwise derive state from user's GSTIN.
         */
        const userGSTState =
          user?.companyState ||
          getStateFromGSTIN(
            user?.gstNumber ||
            user?.gstin ||
            ""
          ) ||
          "";

        if (!userGSTState) {
          toast.error(
            "User GST state is required before scanning."
          );
          return;
        }

        const data =
          new FormData();

        data.append(
          "invoice",
          invoiceImage
        );

        data.append(
          "userGSTState",
          userGSTState
        );

        const result =
          await invoiceAPI.scanInvoice(
            data
          );

        console.log(
          "INVOICE SCAN RESULT:",
          result
        );

        const response =
          result?.data ||
          result;

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
            "Invoice scan failed."
          );
        }

        const ai =
          response.ai || {};

        const firstItem =
          ai.items?.[0] || {};

        const extractedGSTIN =
          cleanGSTIN(
            ai.vendor_gstin
          );

        /*
         * IMPORTANT:
         * Prefer GSTIN prefix state.
         * Sandbox test API can return demo state.
         */
        const detectedVendorState =
          getStateFromGSTIN(
            extractedGSTIN
          ) ||
          response.vendor_gst_state ||
          "";

        const invoiceDate =
          convertInvoiceDateToISO(
            ai.invoice_date
          );

        setScanResult(
          response
        );

        setFormData(
          (prev) => ({
            ...prev,

            invoice_number:
              ai.invoice_number ||
              prev.invoice_number,

            invoice_date:
              invoiceDate ||
              prev.invoice_date,

            vendor_name:
              ai.vendor_name ||
              prev.vendor_name,

            vendor_gstin:
              extractedGSTIN ||
              prev.vendor_gstin,

            vendor_has_gst:
              extractedGSTIN
                ? "yes"
                : prev.vendor_has_gst,

            vendor_state:
              detectedVendorState ||
              getStateFromGSTIN(extractedGSTIN || prev.vendor_gstin) ||
              prev.vendor_state,

            total_amount:
              firstItem
                .amount_before_gst !=
                null
                ? Number(
                  firstItem.amount_before_gst
                ).toFixed(2)
                : prev.total_amount,

            gst_rate:
              firstItem.gst_rate !=
                null
                ? firstItem.gst_rate
                : prev.gst_rate,

            final_amount:
              firstItem
                .amount_after_gst !=
                null
                ? Number(
                  firstItem.amount_after_gst
                ).toFixed(2)
                : prev.final_amount,

            items:
              Array.isArray(
                ai.items
              )
                ? ai.items.map(
                  (item) => ({
                    hsn_sac:
                      item.hsn_sac ||
                      "",

                    quantity:
                      numberValue(
                        item.quantity
                      ) ||
                      null,

                    rate:
                      numberValue(
                        item.rate
                      ) ||
                      null,

                    amount:
                      numberValue(
                        item.amount_before_gst
                      ),

                    gst_rate:
                      numberValue(
                        item.gst_rate
                      ),
                  })
                )
                : prev.items,
          })
        );

        /*
         * Automatically calculate frontend GST breakdown
         * using extracted invoice data.
         */
        if (
          Array.isArray(
            ai.items
          ) &&
          ai.items.length
        ) {
          const grouped =
            groupItemsByGSTRate(
              ai.items
            );

          const breakdown =
            buildMultiRateGSTBreakdown(
              grouped,
              extractedGSTIN,
              detectedVendorState
            );

          if (
            breakdown.length
          ) {
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

            setFormData(
              (prev) => ({
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

                gst_breakdown:
                  breakdown,
              })
            );
          }
        }

        toast.success(
          "Invoice scanned successfully."
        );
      } catch (error) {
        console.error(
          "Invoice scan error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
          error?.message ||
          "Unable to scan invoice."
        );
      } finally {
        setScanning(false);
      }
    };

  /* =========================================================
     BASIC INPUT
  ========================================================= */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );
  };

  /* =========================================================
     GST OPTION
  ========================================================= */

  const handleGSTOptionChange =
    (value) => {
      setFormData(
        (prev) => ({
          ...prev,

          vendor_has_gst:
            value,

          vendor_gstin:
            value === "yes"
              ? prev.vendor_gstin
              : "",

          gst_breakdown:
            value === "no"
              ? []
              : prev.gst_breakdown,
        })
      );
    };

  /* =========================================================
     GSTIN INPUT
  ========================================================= */


  const handleGSTINChange = (value) => {
    const gstin = cleanGSTIN(value);

    setFormData((prev) => ({
      ...prev,
      vendor_gstin: gstin,
      vendor_state: getStateFromGSTIN(gstin),
    }));

    // GSTIN valid असल्यास seller state automatic भरला जाईल
  };



  /* =========================================================
     GST STATUS
  ========================================================= */

  const handleCheckGSTStatus = async () => {
    const gstin = cleanGSTIN(formData.vendor_gstin);

    console.log("GSTIN BEFORE API CALL:", gstin);

    if (!GST_REGEX.test(gstin)) {
      toast.error("Invalid GSTIN. Please enter a valid GSTIN.");
      return;
    }

    try {
      setGSTChecking(true);

      console.log("Calling GST API with:", gstin);

      const response =
        await invoiceAPI.checkGSTStatus(gstin);

      console.log("GST API FULL RESPONSE:", response.data);

      setGSTStatus(response.data.data);
      setShowGSTPopup(true);

    } catch (error) {
      console.error("GST Status Error:", error);
      console.log("GST API ERROR RESPONSE:", error.response?.data);

      toast.error(
        error.response?.data?.message ||
        "Failed to fetch GST status."
      );

    } finally {
      setGSTChecking(false);
    }
  };
  /* =========================================================
     GST CALCULATION
  ========================================================= */

  const calculateCurrentGST =
    () => {
      const taxable =
        numberValue(
          formData.total_amount
        );

      if (taxable <= 0) {
        toast.error(
          "Please enter taxable amount."
        );
        return;
      }

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

        if (
          breakdown.length
        ) {
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
            Object.keys(
              grouped
            )
              .map(Number)
              .sort(
                (a, b) =>
                  a - b
              );

          setFormData(
            (prev) => ({
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
            })
          );

          toast.success(
            "GST calculated from invoice rates."
          );

          return;
        }
      }

      const rate =
        numberValue(
          formData.gst_rate
        );

      if (rate <= 0) {
        setFormData(
          (prev) => ({
            ...prev,

            total_amount:
              taxable.toFixed(
                2
              ),

            total_gst:
              "0.00",

            final_amount:
              taxable.toFixed(
                2
              ),

            gst_breakdown:
              [],
          })
        );

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

      if (
        !breakdown.length
      ) {
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
          taxable +
          totalGST
        );

      setFormData(
        (prev) => ({
          ...prev,

          total_amount:
            taxable.toFixed(
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

          gst_breakdown:
            breakdown,
        })
      );

      toast.success(
        "GST calculated."
      );
    };

  /* =========================================================
     GST BREAKDOWN
  ========================================================= */

  const addGSTRow = () => {
    setFormData(
      (prev) => ({
        ...prev,

        gst_breakdown: [
          ...(prev.gst_breakdown ||
            []),

          {
            rate: "",
            taxable_amount:
              "",
            gst_amount: "",
            tax_type: "GST",
          },
        ],
      })
    );
  };

  const removeGSTRow =
    (index) => {
      setFormData(
        (prev) => ({
          ...prev,

          gst_breakdown:
            prev.gst_breakdown.filter(
              (_, i) =>
                i !== index
            ),
        })
      );
    };

  const updateGSTRow = (
    index,
    field,
    value
  ) => {
    setFormData(
      (prev) => {
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
                (taxable *
                  rate) /
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
            totalGST.toFixed(
              2
            ),

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
      }
    );
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
      invoice_date:
        getTodayISO(),
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
    setScanResult(null);

    if (
      invoiceImagePreview
    ) {
      URL.revokeObjectURL(
        invoiceImagePreview
      );
    }

    setInvoiceImage(null);
    setInvoiceImagePreview("");
  };


  const focusInvalidField = (ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setTimeout(() => {
        ref.current.focus();
      }, 300);
    }
  };

  const updateInvoiceItem = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  /* =========================================================
     VALIDATION
  ========================================================= */


  const validateForm = () => {
    if (!formData.invoice_number.trim()) {
      toast.error("Please enter invoice number.");
      focusInvalidField(invoiceNumberRef);
      return false;
    }

    if (!formData.invoice_date) {
      toast.error("Please select invoice date.");
      focusInvalidField(invoiceDateRef);
      return false;
    }

    if (!formData.vendor_name.trim()) {
      toast.error("Please enter vendor name.");
      focusInvalidField(vendorNameRef);
      return false;
    }

    if (!formData.vendor_has_gst) {
      toast.error("Please select vendor GST option.");
      focusInvalidField(vendorGSTOptionRef);
      return false;
    }

    if (formData.vendor_has_gst === "yes") {
      if (
        !GST_REGEX.test(
          cleanGSTIN(formData.vendor_gstin)
        )
      ) {
        toast.error("Please enter a valid GSTIN.");
        focusInvalidField(vendorGSTINRef);
        return false;
      }
    }

    if (
      formData.vendor_has_gst === "no" &&
      !formData.vendor_state
    ) {
      toast.error("Please select vendor state.");
      focusInvalidField(vendorStateRef);
      return false;
    }

    if (numberValue(formData.total_amount) <= 0) {
      toast.error("Please enter a valid taxable amount.");
      focusInvalidField(totalAmountRef);
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
          Object.keys(
            grouped
          ).length
        ) {
          breakdown =
            buildMultiRateGSTBreakdown(
              grouped,
              formData.vendor_gstin,
              formData.vendor_state
            );

          console.log(
            "GST BREAKDOWN RESULT:",
            JSON.stringify(
              breakdown,
              null,
              2
            )
          );
        }
      }

      if (
        !breakdown.length
      ) {
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
        (a, b) =>
          a - b
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

      delete payload.description;

      /*
       * IMPORTANT:
       * api.js contains invoiceAPI.create()
       */
      await invoiceAPI.create(
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
            <h1>
              New Invoice
            </h1>

            <p>
              Create a new invoice or
              scan an invoice.
            </p>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={
              onClose ||
              resetForm
            }
            title="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* =====================================================
            INVOICE SCANNER
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
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: "15px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "8px",
                  marginBottom:
                    "5px",
                }}
              >
                <ScanLine
                  size={21}
                />
                Scan Invoice
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    "#6b7280",
                }}
              >
                Upload an invoice image and scan it to automatically fill invoice details.
              </p>
            </div>

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "10px",
                flexWrap:
                  "wrap",
              }}
            >
              <label
                className="scan-btn"
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: "8px",
                  cursor:
                    "pointer",
                }}
              >
                <Upload
                  size={18}
                />

                {invoiceImage
                  ? "Change Invoice"
                  : "Upload Invoice"}

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleInvoiceImageSelect
                  }
                  style={{
                    display:
                      "none",
                  }}
                />
              </label>

              {invoiceImage && (
                <button
                  type="button"
                  className="scan-btn"
                  onClick={() => {
                    alert("SCAN BUTTON WORKING");
                    console.log("🔥 SCAN BUTTON CLICKED");
                    handleScanInvoice();
                  }}
                  disabled={false}
                >
                  <ScanLine size={18} />
                  {scanning ? "Scanning Invoice..." : "Scan Invoice"}
                </button>
              )}
            </div>
          </div>

          {invoiceImagePreview && (
            <div
              style={{
                marginTop:
                  "18px",
                border:
                  "1px solid #e5e7eb",
                borderRadius:
                  "12px",
                padding:
                  "12px",
                background:
                  "#f9fafb",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: "10px",
                  marginBottom:
                    "10px",
                }}
              >
                <span
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "7px",
                    fontWeight:
                      600,
                  }}
                >
                  <ImageIcon
                    size={17}
                  />

                  {invoiceImage?.name ||
                    "Invoice image"}
                </span>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    removeInvoiceImage
                  }
                >
                  Remove
                </button>
              </div>

              <img
                src={
                  invoiceImagePreview
                }
                alt="Invoice preview"
                style={{
                  display:
                    "block",
                  width: "100%",
                  maxHeight:
                    "420px",
                  objectFit:
                    "contain",
                  borderRadius:
                    "8px",
                  background:
                    "#ffffff",
                }}
              />
            </div>
          )}

          {/* SCAN RESULT STATUS */}

          {scanResult && (
            <div
              style={{
                marginTop:
                  "15px",
                padding:
                  "12px 15px",
                border:
                  "1px solid #e5e7eb",
                borderRadius:
                  "10px",
                background:
                  "#ffffff",
              }}
            >
              <strong>
                Invoice Scan Result
              </strong>

              <div
                style={{
                  marginTop:
                    "6px",
                  display:
                    "flex",
                  gap: "15px",
                  flexWrap:
                    "wrap",
                }}
              >
                <span>
                  OCR Confidence:{" "}
                  <strong>
                    {scanResult.ocr
                      ?.confidence ??
                      0}
                    %
                  </strong>
                </span>

                <span>
                  Tax Type:{" "}
                  <strong>
                    {scanResult.taxType ||
                      "N/A"}
                  </strong>
                </span>

                {scanResult
                  .gst_comparison
                  ?.map(
                    (
                      comparison,
                      index
                    ) => (
                      <span
                        key={`scan-status-${index}`}
                      >
                        GST Check:{" "}
                        <strong>
                          {
                            comparison
                              .comparison
                              ?.status
                          }
                        </strong>
                      </span>
                    )
                  )}
              </div>
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
                  ref={invoiceNumberRef}
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
                  ref={invoiceDateRef}
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
                  ref={vendorNameRef}

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
                    ref={vendorGSTOptionRef}
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
                      ref={vendorGSTINRef}
                      type="text"
                      name="vendor_gstin"
                      value={formData.vendor_gstin}
                      onChange={(e) =>
                        handleGSTINChange(e.target.value)
                      }
                      placeholder="Enter GSTIN"
                      maxLength={15}
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
                        display:
                          "inline-flex",
                        alignItems:
                          "center",
                        gap: "8px",
                      }}
                    >
                      <Search
                        size={18}
                      />

                      {gstChecking
                        ? "Checking..."
                        : "GST Status"}
                    </button>
                  </div>

                  <div className="form-group">
                    <label>
                      Vendor State
                    </label>

                    <input
                      ref={vendorStateRef}
                      type="text"
                      name="vendor_state"
                      value={formData.vendor_state}
                      onChange={handleChange}
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
                    ref={vendorStateRef}
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
                  ref={totalAmountRef}
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

            {/* INVOICE ITEMS */}

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
                        from invoice
                      </p>
                    </div>
                  </div>

                  <div className="gst-breakdown-list">

                    {formData.items.map(
                      (item, index) => (
                        <div
                          className="gst-breakdown-row"
                          key={`item-${index}`}
                        >

                          <div className="form-group">
                            <label>
                              HSN/SAC
                            </label>

                            <input
                              value={item.hsn_sac || ""}
                              onChange={(e) =>
                                updateInvoiceItem(
                                  index,
                                  "hsn_sac",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Quantity
                            </label>

                            <input
                              type="number"
                              value={item.quantity ?? ""}
                              onChange={(e) =>
                                updateInvoiceItem(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Rate
                            </label>

                            <input
                              type="number"
                              value={item.rate ?? ""}
                              onChange={(e) =>
                                updateInvoiceItem(
                                  index,
                                  "rate",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              Amount
                            </label>

                            <input
                              type="number"
                              value={item.amount ?? ""}
                              onChange={(e) =>
                                updateInvoiceItem(
                                  index,
                                  "amount",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>
                              GST Rate
                            </label>

                            <input
                              type="number"
                              value={item.gst_rate ?? ""}
                              onChange={(e) =>
                                updateInvoiceItem(
                                  index,
                                  "gst_rate",
                                  e.target.value
                                )
                              }
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

              {!formData
                .gst_breakdown
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

        {/* =====================================================
            GST STATUS POPUP
            ===================================================== */}

        {showGSTPopup &&
          gstStatus && (
            <div
              className="camera-modal"
              onClick={() => setShowGSTPopup(false)}
            >
              <div
                className="camera-modal-content"
                style={{
                  maxWidth: "650px",
                  width: "95%",
                }}
                onClick={(e) => e.stopPropagation()}
              >

                <div className="camera-modal-header">
                  <h2>
                    GST Registration Details
                  </h2>

                  <button
                    type="button"
                    onClick={() => setShowGSTPopup(false)}
                  >
                    <X size={22} />
                  </button>
                </div>

                <div className="gst-details-body">

                  <div className="gst-info-list">

                    <div className="gst-info-row">
                      <span>GSTIN</span>
                      <strong>
                        {gstStatus.gstn || "-"}
                      </strong>
                    </div>

                    <div className="gst-info-row">
                      <span>GSTIN Status</span>
                      <strong>
                        {gstStatus.gstn_status || "-"}
                      </strong>
                    </div>

                    <div className="gst-info-row">
                      <span>Legal Name</span>
                      <strong>
                        {gstStatus.legal_name_of_business || "-"}
                      </strong>
                    </div>

                    <div className="gst-info-row">
                      <span>Trade Name</span>
                      <strong>
                        {gstStatus.trade_name || "-"}
                      </strong>
                    </div>

                    <div className="gst-info-row">
                      <span>Centre Jurisdiction</span>
                      <strong>
                        {gstStatus.central_jurisdiction || "-"}
                      </strong>
                    </div>

                    <div className="gst-info-row">
                      <span>State Jurisdiction</span>
                      <strong>
                        {gstStatus.state_jurisdiction || "-"}
                      </strong>
                    </div>

                    <div className="gst-info-row">
                      <span>Registration Date</span>
                      <strong>
                        {gstStatus.date_of_registration || "-"}
                      </strong>
                    </div>

                    <div className="gst-info-row">
                      <span>Taxpayer Type</span>
                      <strong>
                        {gstStatus.taxpayer_type || "-"}
                      </strong>
                    </div>

                    <div className="gst-info-row">
                      <span>Business Activity</span>
                      <strong>
                        {(gstStatus.nature_of_business_activity || [])
                          .join(", ") || "-"}
                      </strong>
                    </div>

                  </div>

                  <div className="gst-popup-footer">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setShowGSTPopup(false)}
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


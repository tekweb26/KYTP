import React, { useRef, useState } from "react";

import {
  X,
  Camera,
  Image as ImageIcon,
  ScanLine,
  Plus,
  Trash2,
} from "lucide-react";

import toast from "react-hot-toast";
import { createWorker } from "tesseract.js";
import { invoiceAPI } from "../api/api";

import "./NewInvoice.css";

/* =====================================================
   GST REGEX
===================================================== */

const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/* =====================================================
   INDIAN STATES
===================================================== */

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

/* =====================================================
   GST STATE CODE MAP
===================================================== */

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

/* =====================================================
   MONTH MAP
===================================================== */

const MONTH_MAP = {
  JAN: 1,
  JANUARY: 1,
  FEB: 2,
  FEBRUARY: 2,
  MAR: 3,
  MARCH: 3,
  APR: 4,
  APRIL: 4,
  MAY: 5,
  JUN: 6,
  JUNE: 6,
  JUL: 7,
  JULY: 7,
  AUG: 8,
  AUGUST: 8,
  SEP: 9,
  SEPT: 9,
  SEPTEMBER: 9,
  OCT: 10,
  OCTOBER: 10,
  NOV: 11,
  NOVEMBER: 11,
  DEC: 12,
  DECEMBER: 12,
};

/* =====================================================
   TODAY DATE
   YYYY-MM-DD
===================================================== */

const getTodayISO = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   ROUND
===================================================== */

const round2 = (value) => {
  return Math.round((Number(value) || 0) * 100) / 100;
};

/* =====================================================
   NORMALIZE AMOUNT
===================================================== */

const normalizeAmount = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  let cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[₹$€£]/g, "")
    .replace(/[^\d.]/g, "");

  const parts = cleaned.split(".");

  if (parts.length > 2) {
    cleaned =
      parts[0] + "." + parts.slice(1).join("");
  }

  return cleaned;
};

/* =====================================================
   NUMBER VALUE
===================================================== */

const numberValue = (value) => {
  const n = Number(normalizeAmount(value));

  return Number.isFinite(n) ? n : 0;
};

/* =====================================================
   CLEAN GSTIN
===================================================== */

const cleanGSTIN = (value) => {
  return String(value || "")
    .toUpperCase()
    .replace(/\s/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 15);
};

/* =====================================================
   MAKE SAFE DATE
===================================================== */

const makeSafeDate = (day, month, year) => {
  let d = Number(day);
  let m = Number(month);
  let y = Number(year);

  if (y < 100) {
    y += y >= 50 ? 1900 : 2000;
  }

  if (
    !Number.isInteger(d) ||
    !Number.isInteger(m) ||
    !Number.isInteger(y)
  ) {
    return "";
  }

  if (
    d < 1 ||
    d > 31 ||
    m < 1 ||
    m > 12 ||
    y < 2000 ||
    y > 2100
  ) {
    return "";
  }

  const date = new Date(y, m - 1, d);

  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return "";
  }

  return `${y}-${String(m).padStart(
    2,
    "0"
  )}-${String(d).padStart(2, "0")}`;
};

/* =====================================================
   EXTRACT INVOICE DATE
===================================================== */

const extractInvoiceDate = (text) => {
  if (!text) {
    return "";
  }

  const normalized = String(text)
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "/")
    .replace(/[—–]/g, "-")
    .replace(/[.]/g, ".")
    .replace(/[ \t]+/g, " ");

  const upper = normalized.toUpperCase();

  /* -----------------------------------------------------
     1. LABEL + DATE

     Invoice Date: 02/09/2026
     Invoice Date 02-09-2026
     Bill Date: 02.09.2026
  ----------------------------------------------------- */

  const labelledRegex =
    /(?:INVOICE\s+DATE|INVOICE\s+DT|BILL\s+DATE|DATE\s+OF\s+INVOICE|INVOICE\s+DATE\s+NO?)\s*[:#-]?\s*(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{2,4})/i;

  const labelledMatch =
    upper.match(labelledRegex);

  if (labelledMatch) {
    const result = makeSafeDate(
      labelledMatch[1],
      labelledMatch[2],
      labelledMatch[3]
    );

    if (result) {
      return result;
    }
  }

  /* -----------------------------------------------------
     2. YYYY-MM-DD
  ----------------------------------------------------- */

  const ymdRegex =
    /\b(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})\b/g;

  const ymdMatches = [
    ...upper.matchAll(ymdRegex),
  ];

  for (const match of ymdMatches) {
    const result = makeSafeDate(
      match[3],
      match[2],
      match[1]
    );

    if (result) {
      return result;
    }
  }

  /* -----------------------------------------------------
     3. DD/MM/YYYY

     02/09/2026
     02-09-2026
     02.09.2026
  ----------------------------------------------------- */

  const dateRegex =
    /\b(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{2,4})\b/g;

  const dateMatches = [
    ...upper.matchAll(dateRegex),
  ];

  for (const match of dateMatches) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12
    ) {
      const result = makeSafeDate(
        day,
        month,
        year
      );

      if (result) {
        return result;
      }
    }
  }

  /* -----------------------------------------------------
     4. TEXT DATE

     02 Sep 2026
     02 September 2026
  ----------------------------------------------------- */

  const textDateRegex =
    /\b(\d{1,2})\s+(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|JAN|FEB|MAR|APR|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\s*,?\s*(\d{2,4})\b/i;

  const textDate =
    upper.match(textDateRegex);

  if (textDate) {
    const month =
      MONTH_MAP[textDate[2]];

    const result = makeSafeDate(
      textDate[1],
      month,
      textDate[3]
    );

    if (result) {
      return result;
    }
  }

  /* -----------------------------------------------------
     5. DATE ON NEXT LINE

     Invoice Date
     02/09/2026
  ----------------------------------------------------- */

  const lines = upper
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    if (
      /INVOICE\s+DATE|INVOICE\s+DT|BILL\s+DATE|DATE\s+OF\s+INVOICE/.test(
        lines[i]
      )
    ) {
      const nextLine =
        lines[i + 1] || "";

      const nextMatch =
        nextLine.match(
          /(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{2,4})/
        );

      if (nextMatch) {
        const result = makeSafeDate(
          nextMatch[1],
          nextMatch[2],
          nextMatch[3]
        );

        if (result) {
          return result;
        }
      }
    }
  }

  return "";
};

/* =====================================================
   EXTRACT GSTIN
===================================================== */

const extractGSTIN = (text) => {
  if (!text) {
    return "";
  }

  const upper = String(text)
    .toUpperCase()
    .replace(/\s+/g, " ");

  /* GSTIN label जवळ */

  const labelled =
    upper.match(
      /(?:GSTIN|GST\s*NO|GST\s*NUMBER|GST\s*REGISTRATION)\s*[:#-]?\s*([0-9A-Z]{15})/
    );

  if (labelled) {
    const gst = cleanGSTIN(
      labelled[1]
    );

    if (GST_REGEX.test(gst)) {
      return gst;
    }
  }

  /* कुठेही GSTIN शोधा */

  const candidates =
    upper.match(
      /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]/g
    );

  if (candidates) {
    for (const candidate of candidates) {
      const gst =
        cleanGSTIN(candidate);

      if (GST_REGEX.test(gst)) {
        return gst;
      }
    }
  }

  return "";
};

/* =====================================================
   EXTRACT INVOICE NUMBER
===================================================== */

const extractInvoiceNumber = (text) => {
  if (!text) {
    return "";
  }

  const upper =
    String(text).toUpperCase();

  const patterns = [
    /(?:INVOICE\s*(?:NO|NUMBER)|INV\s*(?:NO|NUMBER)|BILL\s*(?:NO|NUMBER))\s*[:#-]?\s*([A-Z0-9\/-]+)/i,

    /(?:INVOICE|INV|BILL)\s*[:#-]\s*([A-Z0-9\/-]+)/i,
  ];

  for (const pattern of patterns) {
    const match =
      upper.match(pattern);

    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "";
};

/* =====================================================
   EXTRACT TAXABLE AMOUNT
===================================================== */

const extractTaxableAmount = (text) => {
  if (!text) {
    return "";
  }

  const upper =
    String(text).toUpperCase();

  const patterns = [
    /(?:TOTAL\s*TAXABLE\s*VALUE|TOTAL\s*TAXABLE\s*AMOUNT)\s*[:#-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,

    /(?:TAXABLE\s*VALUE|TAXABLE\s*AMOUNT|TAXABLE\s*AMT)\s*[:#-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,

    /(?:NET\s*TAXABLE\s*VALUE|NET\s*TAXABLE\s*AMOUNT)\s*[:#-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,

    /(?:SUB\s*TOTAL|SUBTOTAL)\s*[:#-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,

    /(?:AMOUNT\s*BEFORE\s*TAX|AMOUNT\s*BEFORE\s*GST|TOTAL\s*BEFORE\s*GST|VALUE\s*BEFORE\s*TAX)\s*[:#-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match =
      upper.match(pattern);

    if (match && match[1]) {
      return normalizeAmount(
        match[1]
      );
    }
  }

  return "";
};

/* =====================================================
   EXTRACT FINAL AMOUNT
===================================================== */

const extractFinalAmount = (text) => {
  if (!text) {
    return "";
  }

  const upper =
    String(text).toUpperCase();

  const patterns = [
    /(?:GRAND\s*TOTAL|TOTAL\s*PAYABLE|AMOUNT\s*PAYABLE)\s*[:#-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,

    /(?:NET\s*AMOUNT|FINAL\s*AMOUNT)\s*[:#-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match =
      upper.match(pattern);

    if (match && match[1]) {
      return normalizeAmount(
        match[1]
      );
    }
  }

  return "";
};

/* =====================================================
   EXTRACT GST RATES
===================================================== */

const extractGSTRates = (text) => {
  if (!text) {
    return [];
  }

  const upper =
    String(text).toUpperCase();

  const rates = new Set();

  /* Direct GST rates */

  const directRates =
    upper.match(
      /\b(0|5|12|18|28)\s*%/g
    );

  if (directRates) {
    directRates.forEach((item) => {
      const rate = Number(
        item.replace("%", "").trim()
      );

      if (
        rate >= 0 &&
        rate <= 100
      ) {
        rates.add(rate);
      }
    });
  }

  /* CGST 9% => GST 18% */

  const cgstMatches = [
    ...upper.matchAll(
      /CGST\s*(?:@|RATE)?\s*[:#-]?\s*(\d+(?:\.\d+)?)\s*%/gi
    ),
  ];

  const sgstMatches = [
    ...upper.matchAll(
      /SGST\s*(?:@|RATE)?\s*[:#-]?\s*(\d+(?:\.\d+)?)\s*%/gi
    ),
  ];

  for (const match of cgstMatches) {
    const cgst = Number(
      match[1]
    );

    if (cgst > 0) {
      rates.add(
        round2(cgst * 2)
      );
    }
  }

  for (const match of sgstMatches) {
    const sgst = Number(
      match[1]
    );

    if (sgst > 0) {
      rates.add(
        round2(sgst * 2)
      );
    }
  }

  return [...rates].sort(
    (a, b) => a - b
  );
};

/* =====================================================
   EXTRACT GST AMOUNTS
===================================================== */

const extractGSTAmounts = (text) => {
  if (!text) {
    return [];
  }

  const upper =
    String(text).toUpperCase();

  const result = [];

  const patterns = [
    /(?:IGST|GST)\s*(?:@?\s*\d+(?:\.\d+)?\s*%)?\s*[:#-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/gi,

    /(?:CGST|SGST)\s*(?:@?\s*\d+(?:\.\d+)?\s*%)?\s*[:#-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/gi,
  ];

  for (const pattern of patterns) {
    const matches =
      [...upper.matchAll(pattern)];

    matches.forEach((match) => {
      const amount =
        numberValue(match[1]);

      if (amount > 0) {
        result.push(amount);
      }
    });
  }

  return result;
};

/* =====================================================
   EXTRACT VENDOR NAME
===================================================== */

const extractVendorName = (text) => {
  if (!text) {
    return "";
  }

  const upper =
    String(text).toUpperCase();

  const patterns = [
    /(?:VENDOR|SUPPLIER|SELLER|FROM|BILL\s*FROM|SOLD\s*BY)\s*[:#-]?\s*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match =
      upper.match(pattern);

    if (match && match[1]) {
      return match[1]
        .trim()
        .replace(/\s+/g, " ");
    }
  }

  /* First meaningful line */

  const lines = String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (
      line.length >= 3 &&
      line.length <= 80 &&
      !/invoice|tax|gst|date|amount|total|bill/i.test(
        line
      )
    ) {
      return line;
    }
  }

  return "";
};

/* =====================================================
   EXTRACT STATE
===================================================== */

const extractState = (text) => {
  if (!text) {
    return "";
  }

  const upper =
    String(text).toUpperCase();

  for (const state of STATES) {
    if (
      upper.includes(
        state.toUpperCase()
      )
    ) {
      return state;
    }
  }

  return "";
};

/* =====================================================
   EXTRACT DESCRIPTION
===================================================== */

const extractDescription = (text) => {
  if (!text) {
    return "";
  }

  const match =
    String(text).match(
      /(?:DESCRIPTION|PARTICULARS|ITEM|PRODUCT)\s*[:#-]?\s*([^\n]+)/i
    );

  if (match && match[1]) {
    return match[1].trim();
  }

  return "";
};

/* =====================================================
   PREPROCESS IMAGE
===================================================== */

const preprocessImage = (file) => {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        const img =
          new Image();

        img.onload = () => {
          const MAX_WIDTH = 2600;

          const scale =
            img.width > MAX_WIDTH
              ? MAX_WIDTH / img.width
              : 1;

          const width =
            Math.round(
              img.width * scale
            );

          const height =
            Math.round(
              img.height * scale
            );

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width = width;
          canvas.height = height;

          const ctx =
            canvas.getContext(
              "2d"
            );

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          const imageData =
            ctx.getImageData(
              0,
              0,
              width,
              height
            );

          const data =
            imageData.data;

          for (
            let i = 0;
            i < data.length;
            i += 4
          ) {
            const gray =
              0.299 * data[i] +
              0.587 * data[i + 1] +
              0.114 * data[i + 2];

            const contrast =
              gray * 1.35 -
              128 * 0.35;

            const value =
              Math.max(
                0,
                Math.min(
                  255,
                  contrast
                )
              );

            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
          }

          ctx.putImageData(
            imageData,
            0,
            0
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "Image processing failed"
                  )
                );
                return;
              }

              resolve(blob);
            },
            "image/png",
            1
          );
        };

        img.onerror = () => {
          reject(
            new Error(
              "Image could not be loaded"
            )
          );
        };

        img.src = reader.result;
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Could not read image"
          )
        );
      };

      reader.readAsDataURL(file);
    }
  );
};

/* =====================================================
   BUILD GST BREAKDOWN
===================================================== */

const buildGSTBreakdown = (
  taxableAmount,
  rates,
  extractedGSTAmounts = []
) => {
  const amount =
    numberValue(taxableAmount);

  if (
    !amount ||
    !rates.length
  ) {
    return [];
  }

  /* Single rate */

  if (rates.length === 1) {
    const rate =
      Number(rates[0]);

    return [
      {
        rate,
        taxable_amount: amount,
        gst_amount: round2(
          (amount * rate) / 100
        ),
      },
    ];
  }

  /*
    Multiple rates.
    Actual taxable split OCR ने दिला नसेल
    तर automatically divide करणार नाही.
  */

  return rates.map(
    (rate, index) => ({
      rate: Number(rate),
      taxable_amount: "",
      gst_amount:
        extractedGSTAmounts[index] !==
        undefined
          ? round2(
              extractedGSTAmounts[index]
            )
          : 0,
    })
  );
};

/* =====================================================
   MAIN COMPONENT
===================================================== */

export default function NewInvoice({
  onClose,
  onCreated,
}) {
  const [creating, setCreating] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [gstError, setGstError] =
    useState("");

  const [scanMessage, setScanMessage] =
    useState("");

  const cameraInputRef =
    useRef(null);

  const galleryInputRef =
    useRef(null);

  /* ===================================================
     FORM DATA
  =================================================== */

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
      total_gst: "0",
      gst_rate: "",
      description: "",
      gst_breakdown: [],
    });

  /* ===================================================
     HANDLE INPUT
  =================================================== */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    /* GSTIN */

    if (
      name === "vendor_gstin"
    ) {
      const gst =
        cleanGSTIN(value);

      setFormData((prev) => ({
        ...prev,
        vendor_gstin: gst,
        vendor_has_gst:
          gst.length > 0
            ? "yes"
            : prev.vendor_has_gst,
      }));

      if (gst.length === 15) {
        if (GST_REGEX.test(gst)) {
          setGstError("");

          const stateCode =
            gst.substring(0, 2);

          const state =
            GST_STATE_MAP[
              stateCode
            ] || "";

          if (state) {
            setFormData(
              (prev) => ({
                ...prev,
                vendor_state:
                  state,
              })
            );
          }
        } else {
          setGstError(
            "Invalid GST number."
          );
        }
      } else {
        setGstError("");
      }

      return;
    }

    /* Amount fields */

    if (
      name === "total_amount" ||
      name === "gst_rate"
    ) {
      const cleaned =
        normalizeAmount(value);

      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ===================================================
     GST YES / NO
  =================================================== */

  const handleGSTOption = (
    option
  ) => {
    if (option === "yes") {
      setFormData((prev) => ({
        ...prev,
        vendor_has_gst: "yes",
      }));

      setGstError("");

      return;
    }

    setFormData((prev) => ({
      ...prev,
      vendor_has_gst: "no",
      vendor_gstin: "",
      gst_rate: "",
      gst_breakdown: [],
      total_gst: "0",
      final_amount:
        prev.total_amount || "",
    }));

    setGstError("");
  };

  /* ===================================================
     VALIDATE GSTIN
  =================================================== */

  const validateGSTIN = () => {
    if (
      formData.vendor_has_gst ===
      "no"
    ) {
      return true;
    }

    if (
      formData.vendor_has_gst ===
        "yes" &&
      !formData.vendor_gstin
    ) {
      setGstError(
        "GST Yes असल्यास GST number आवश्यक आहे."
      );

      return false;
    }

    if (
      formData.vendor_gstin &&
      !GST_REGEX.test(
        formData.vendor_gstin
      )
    ) {
      setGstError(
        "Invalid GST number."
      );

      return false;
    }

    setGstError("");

    return true;
  };

  /* ===================================================
     EXTRACT INVOICE DATA
  =================================================== */

  const extractInvoiceData = (
    ocrText
  ) => {
    const invoiceNumber =
      extractInvoiceNumber(
        ocrText
      );

    const invoiceDate =
      extractInvoiceDate(
        ocrText
      );

    const gstin =
      extractGSTIN(
        ocrText
      );

    const vendorName =
      extractVendorName(
        ocrText
      );

    const state =
      extractState(
        ocrText
      );

    const taxableAmount =
      extractTaxableAmount(
        ocrText
      );

    const finalAmount =
      extractFinalAmount(
        ocrText
      );

    const rates =
      extractGSTRates(
        ocrText
      );

    const gstAmounts =
      extractGSTAmounts(
        ocrText
      );

    const description =
      extractDescription(
        ocrText
      );

    const gstBreakdown =
      buildGSTBreakdown(
        taxableAmount,
        rates,
        gstAmounts
      );

    let totalGST = 0;

    if (
      gstBreakdown.length ===
      1
    ) {
      totalGST =
        numberValue(
          gstBreakdown[0]
            .gst_amount
        );
    }

    return {
      invoiceNumber,
      invoiceDate,
      gstin,
      vendorName,
      state,
      taxableAmount,
      finalAmount,
      rates,
      gstBreakdown,
      totalGST,
      description,
    };
  };

  /* ===================================================
     SCAN INVOICE
  =================================================== */

  const scanInvoice = async (
    file
  ) => {
    if (!file) {
      return;
    }

    setScanning(true);

    setScanMessage(
      "Invoice image process करत आहे..."
    );

    try {
      const processedImage =
        await preprocessImage(
          file
        );

      setScanMessage(
        "Invoice OCR scan करत आहे..."
      );

      const worker =
        await createWorker(
          "eng"
        );

      await worker.setParameters(
        {
          tessedit_pageseg_mode:
            "6",
          preserve_interword_spaces:
            "1",
        }
      );

      const result =
        await worker.recognize(
          processedImage
        );

      const ocrText =
        result?.data?.text ||
        "";

      await worker.terminate();

      console.log(
        "========== OCR TEXT =========="
      );

      console.log(ocrText);

      if (!ocrText.trim()) {
        toast.error(
          "Invoice मधून text मिळाला नाही."
        );

        setScanning(false);
        setScanMessage("");

        return;
      }

      const extracted =
        extractInvoiceData(
          ocrText
        );

      console.log(
        "========== EXTRACTED DATA =========="
      );

      console.log(
        extracted
      );

      /* GST */

      const detectedGST =
        extracted.gstin;

      let detectedState =
        extracted.state;

      if (detectedGST) {
        const stateCode =
          detectedGST.substring(
            0,
            2
          );

        detectedState =
          GST_STATE_MAP[
            stateCode
          ] ||
          detectedState;
      }

      const hasGST =
        Boolean(detectedGST);

      /* GST calculation */

      let totalGST =
        extracted.totalGST;

      let finalAmount =
        numberValue(
          extracted.finalAmount
        );

      if (
        extracted.taxableAmount &&
        extracted.rates.length ===
          1
      ) {
        const taxable =
          numberValue(
            extracted.taxableAmount
          );

        const rate =
          Number(
            extracted.rates[0]
          );

        totalGST =
          round2(
            (taxable * rate) /
              100
          );

        finalAmount =
          round2(
            taxable + totalGST
          );
      }

      /*
        जर OCR मधून date मिळाली
        तर ती form मध्ये येईल.
        नाही मिळाली तर existing date
        (आजची date) कायम राहील.
      */

      setFormData((prev) => ({
        ...prev,

        invoice_number:
          extracted.invoiceNumber ||
          prev.invoice_number,

        invoice_date:
          extracted.invoiceDate ||
          prev.invoice_date,

        vendor_name:
          extracted.vendorName ||
          prev.vendor_name,

        vendor_has_gst:
          hasGST
            ? "yes"
            : prev.vendor_has_gst,

        vendor_gstin:
          detectedGST ||
          prev.vendor_gstin,

        vendor_state:
          detectedState ||
          prev.vendor_state,

        total_amount:
          extracted.taxableAmount ||
          prev.total_amount,

        gst_rate:
          extracted.rates.length ===
          1
            ? String(
                extracted.rates[0]
              )
            : prev.gst_rate,

        gst_breakdown:
          extracted.gstBreakdown
            .length
            ? extracted.gstBreakdown
            : prev.gst_breakdown,

        total_gst:
          String(totalGST),

        final_amount:
          finalAmount > 0
            ? String(
                finalAmount
              )
            : prev.final_amount,

        description:
          extracted.description ||
          prev.description,
      }));

      if (hasGST) {
        toast.success(
          "GST number आणि invoice details मिळाले."
        );
      } else {
        toast.success(
          "Invoice details form मध्ये भरले आहेत."
        );
      }

      setScanMessage(
        "Scan complete. Details form मध्ये भरले आहेत."
      );
    } catch (error) {
      console.error(
        "Invoice OCR Error:",
        error
      );

      toast.error(
        "Invoice scan करताना error आला."
      );

      setScanMessage("");
    } finally {
      setScanning(false);
    }
  };

  /* ===================================================
     CAMERA
  =================================================== */

  const handleCameraChange = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (file) {
      scanInvoice(file);
    }

    e.target.value = "";
  };

  /* ===================================================
     GALLERY
  =================================================== */

  const handleGalleryChange = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (file) {
      scanInvoice(file);
    }

    e.target.value = "";
  };

  /* ===================================================
     ADD GST ROW
  =================================================== */

  const addGSTRow = () => {
    setFormData((prev) => ({
      ...prev,

      gst_breakdown: [
        ...prev.gst_breakdown,

        {
          rate: "",
          taxable_amount: "",
          gst_amount: 0,
        },
      ],
    }));
  };

  /* ===================================================
     REMOVE GST ROW
  =================================================== */

  const removeGSTRow = (
    index
  ) => {
    setFormData((prev) => {
      const rows =
        prev.gst_breakdown.filter(
          (_, i) => i !== index
        );

      const totalGST =
        rows.reduce(
          (sum, row) =>
            sum +
            numberValue(
              row.gst_amount
            ),
          0
        );

      const totalTaxable =
        rows.reduce(
          (sum, row) =>
            sum +
            numberValue(
              row.taxable_amount
            ),
          0
        );

      return {
        ...prev,

        gst_breakdown:
          rows,

        total_gst:
          String(
            round2(totalGST)
          ),

        total_amount:
          totalTaxable > 0
            ? String(
                round2(
                  totalTaxable
                )
              )
            : prev.total_amount,

        final_amount:
          String(
            round2(
              totalTaxable +
                totalGST
            )
          ),
      };
    });
  };

  /* ===================================================
     CHANGE GST ROW
  =================================================== */

  const handleGSTBreakdownChange =
    (
      index,
      field,
      value
    ) => {
      setFormData((prev) => {
        const rows = [
          ...prev.gst_breakdown,
        ];

        const row = {
          ...rows[index],
        };

        if (
          field === "rate" ||
          field ===
            "taxable_amount"
        ) {
          value =
            normalizeAmount(
              value
            );
        }

        row[field] = value;

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
            : 0;

        rows[index] = row;

        const totalTaxable =
          rows.reduce(
            (sum, item) =>
              sum +
              numberValue(
                item.taxable_amount
              ),
            0
          );

        const totalGST =
          rows.reduce(
            (sum, item) =>
              sum +
              numberValue(
                item.gst_amount
              ),
            0
          );

        return {
          ...prev,

          gst_breakdown:
            rows,

          total_amount:
            totalTaxable > 0
              ? String(
                  round2(
                    totalTaxable
                  )
                )
              : prev.total_amount,

          total_gst:
            String(
              round2(totalGST)
            ),

          final_amount:
            String(
              round2(
                totalTaxable +
                  totalGST
              )
            ),
        };
      });
    };

  /* ===================================================
     CALCULATE CURRENT GST
  =================================================== */

  const calculateCurrentGST =
    () => {
      const taxable =
        numberValue(
          formData.total_amount
        );

      if (
        formData.gst_breakdown
          .length > 0
      ) {
        return round2(
          formData.gst_breakdown.reduce(
            (sum, row) =>
              sum +
              numberValue(
                row.gst_amount
              ),
            0
          )
        );
      }

      const rate =
        numberValue(
          formData.gst_rate
        );

      if (
        taxable > 0 &&
        rate > 0
      ) {
        return round2(
          (taxable * rate) /
            100
        );
      }

      return 0;
    };

  /* ===================================================
     SUBMIT
  =================================================== */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (creating) {
      return;
    }

    /* Invoice Number */

    if (
      !formData.invoice_number.trim()
    ) {
      toast.error(
        "Invoice number टाका."
      );

      return;
    }

    /* Invoice Date */

    if (
      !formData.invoice_date
    ) {
      toast.error(
        "Invoice date टाका."
      );

      return;
    }

    /* Vendor */

    if (
      !formData.vendor_name.trim()
    ) {
      toast.error(
        "Vendor name टाका."
      );

      return;
    }

    /* Taxable Amount */

    const taxableAmount =
      numberValue(
        formData.total_amount
      );

    if (
      taxableAmount <= 0
    ) {
      toast.error(
        "GST आधीचा Total Amount / Taxable Amount टाका."
      );

      return;
    }

    /* GST validation */

    if (
      formData.vendor_has_gst ===
      "yes"
    ) {
      if (!validateGSTIN()) {
        return;
      }
    }

    /* State validation */

    if (
      formData.vendor_has_gst ===
        "no" &&
      !formData.vendor_state
    ) {
      toast.error(
        "Vendor state निवडा."
      );

      return;
    }

    /* =================================================
       GST BREAKDOWN
    ================================================= */

    let breakdown = [
      ...formData.gst_breakdown,
    ];

    /* Single GST */

    if (
      formData.vendor_has_gst ===
        "yes" &&
      breakdown.length === 0 &&
      numberValue(
        formData.gst_rate
      ) > 0
    ) {
      const rate =
        numberValue(
          formData.gst_rate
        );

      breakdown = [
        {
          rate,

          taxable_amount:
            taxableAmount,

          gst_amount:
            round2(
              (taxableAmount *
                rate) /
                100
            ),
        },
      ];
    }

    /* No GST */

    if (
      formData.vendor_has_gst !==
      "yes"
    ) {
      breakdown = [];
    }

    /* =================================================
       VALIDATE GST ROWS
    ================================================= */

    if (
      breakdown.length > 0
    ) {
      for (
        let i = 0;
        i < breakdown.length;
        i++
      ) {
        const row =
          breakdown[i];

        const rate =
          numberValue(
            row.rate
          );

        const rowTaxable =
          numberValue(
            row.taxable_amount
          );

        if (
          rate <= 0 ||
          rate > 100
        ) {
          toast.error(
            `GST row ${
              i + 1
            }: valid GST rate टाका.`
          );

          return;
        }

        if (
          rowTaxable <= 0
        ) {
          toast.error(
            `GST row ${
              i + 1
            }: taxable amount टाका.`
          );

          return;
        }
      }

      const breakdownTaxable =
        round2(
          breakdown.reduce(
            (sum, row) =>
              sum +
              numberValue(
                row.taxable_amount
              ),
            0
          )
        );

      if (
        Math.abs(
          breakdownTaxable -
            taxableAmount
        ) > 0.01
      ) {
        toast.error(
          `GST breakdown taxable amount ₹${breakdownTaxable.toFixed(
            2
          )} आहे, पण Total Amount ₹${taxableAmount.toFixed(
            2
          )} आहे.`
        );

        return;
      }
    }

    /* =================================================
       FINAL GST CALCULATION
    ================================================= */

    let totalGST = 0;

    if (
      breakdown.length > 0
    ) {
      breakdown =
        breakdown.map(
          (row) => {
            const rate =
              numberValue(
                row.rate
              );

            const rowTaxable =
              numberValue(
                row.taxable_amount
              );

            const gstAmount =
              round2(
                (rowTaxable *
                  rate) /
                  100
              );

            return {
              rate,

              taxable_amount:
                rowTaxable,

              gst_amount:
                gstAmount,
            };
          }
        );

      totalGST =
        round2(
          breakdown.reduce(
            (sum, row) =>
              sum +
              row.gst_amount,
            0
          )
        );
    } else {
      const rate =
        numberValue(
          formData.gst_rate
        );

      totalGST =
        rate > 0
          ? round2(
              (taxableAmount *
                rate) /
                100
            )
          : 0;
    }

    const finalAmount =
      round2(
        taxableAmount +
          totalGST
      );

    /* =================================================
       GST RATES
    ================================================= */

    const gstRates =
      breakdown.length > 0
        ? [
            ...new Set(
              breakdown.map(
                (row) =>
                  numberValue(
                    row.rate
                  )
              )
            ),
          ]
        : formData.gst_rate
        ? [
            numberValue(
              formData.gst_rate
            ),
          ]
        : [];

    const mainGSTRate =
      gstRates.length > 0
        ? gstRates[0]
        : 0;

    /* =================================================
       PAYLOAD
    ================================================= */

    const payload = {
      invoice_number:
        formData.invoice_number.trim(),

      invoice_date:
        formData.invoice_date,

      vendor_name:
        formData.vendor_name.trim(),

      vendor_has_gst:
        formData.vendor_has_gst ===
        "yes",

      vendor_gstin:
        formData.vendor_has_gst ===
        "yes"
          ? cleanGSTIN(
              formData.vendor_gstin
            )
          : "",

      vendor_state:
        formData.vendor_state ||
        "",

      /*
        IMPORTANT:
        total_amount म्हणजे
        GST आधीचा taxable amount
      */

      total_amount:
        taxableAmount,

      gst_rate:
        mainGSTRate,

      gst_rates:
        gstRates,

      gst_breakdown:
        breakdown,

      total_gst:
        totalGST,

      final_amount:
        finalAmount,

      description:
        formData.description.trim(),
    };

    console.log(
      "========== CREATE INVOICE PAYLOAD =========="
    );

    console.log(payload);

    /* =================================================
       API
    ================================================= */

    try {
      setCreating(true);

      const response =
        await invoiceAPI.create(
          payload
        );

      console.log(
        "Invoice Create Response:",
        response
      );

      const createdInvoice =
        response?.data?.invoice ||
        response?.invoice ||
        response?.data;

      if (!createdInvoice) {
        throw new Error(
          "Invoice response missing"
        );
      }

      toast.success(
        "Invoice successfully created."
      );

      /*
        Page reload नाही.
      */

      if (
        typeof onCreated ===
        "function"
      ) {
        onCreated(
          createdInvoice
        );
      }

      onClose();
    } catch (error) {
      console.error(
        "Create Invoice Error:",
        error
      );

      const message =
        error?.response?.data
          ?.message ||
        error?.message ||
        "Invoice create करताना error आला.";

      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  /* ===================================================
     DISPLAY CALCULATIONS
  =================================================== */

  const taxableAmount =
    numberValue(
      formData.total_amount
    );

  const currentGST =
    calculateCurrentGST();

  const currentFinal =
    round2(
      taxableAmount +
        currentGST
    );

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal">

        {/* HEADER */}

        <div className="invoice-modal-header">
          <div>
            <h2>Create Invoice</h2>

            <p>
              Create invoice manually or scan an invoice
            </p>
          </div>

          <button
            type="button"
            className="invoice-close-btn"
            onClick={onClose}
            disabled={creating}
          >
            <X size={20} />
          </button>
        </div>

        {/* SCANNER */}

        <div className="invoice-scanner-box">
          <div className="scanner-title">
            <ScanLine size={24} />

            <div>
              <strong>
                Scan Invoice
              </strong>

              <span>
                Invoice image scan करा आणि details automatic भरू द्या
              </span>
            </div>
          </div>

          <div className="scanner-buttons">

            <button
              type="button"
              className="scanner-btn"
              onClick={() =>
                cameraInputRef.current?.click()
              }
              disabled={
                scanning ||
                creating
              }
            >
              <Camera size={17} />

              Scan with Camera
            </button>

            <button
              type="button"
              className="scanner-btn"
              onClick={() =>
                galleryInputRef.current?.click()
              }
              disabled={
                scanning ||
                creating
              }
            >
              <ImageIcon size={17} />

              Choose Invoice Image
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{
                display: "none",
              }}
              onChange={
                handleCameraChange
              }
            />

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              style={{
                display: "none",
              }}
              onChange={
                handleGalleryChange
              }
            />
          </div>

          {(scanning ||
            scanMessage) && (
            <div className="scanner-progress">
              {scanning
                ? scanMessage ||
                  "Scanning invoice..."
                : scanMessage}
            </div>
          )}
        </div>

        {/* FORM */}

        <form
          className="invoice-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* INVOICE NUMBER */}

          <div className="form-group">
            <label>
              Invoice Number
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
              disabled={creating}
            />
          </div>

          {/* INVOICE DATE */}

          <div className="form-group">
            <label>
              Invoice Date
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
              disabled={creating}
              required
            />

            <small className="field-help">
              OCR scan केल्यास invoice वरील date automatic भरली जाईल.
            </small>
          </div>

          {/* VENDOR */}

          <div className="form-group">
            <label>
              Vendor Name
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
              disabled={creating}
            />
          </div>

          {/* GST OPTION */}

          <div className="form-group">
            <label>
              Vendor has GST?
              <span>*</span>
            </label>

            <div className="gst-radio-group">

              <label>
                <input
                  type="radio"
                  name="vendor_has_gst"
                  checked={
                    formData.vendor_has_gst ===
                    "yes"
                  }
                  onChange={() =>
                    handleGSTOption(
                      "yes"
                    )
                  }
                  disabled={
                    creating
                  }
                />

                Yes
              </label>

              <label>
                <input
                  type="radio"
                  name="vendor_has_gst"
                  checked={
                    formData.vendor_has_gst ===
                    "no"
                  }
                  onChange={() =>
                    handleGSTOption(
                      "no"
                    )
                  }
                  disabled={
                    creating
                  }
                />

                No
              </label>
            </div>
          </div>

          {/* GSTIN */}

          {formData.vendor_has_gst ===
            "yes" && (
            <div className="form-group">
              <label>
                GST Number
                <span>*</span>
              </label>

              <input
                type="text"
                name="vendor_gstin"
                value={
                  formData.vendor_gstin
                }
                onChange={
                  handleChange
                }
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                disabled={creating}
              />

              {gstError && (
                <div className="gst-error">
                  {gstError}
                </div>
              )}

              {!gstError &&
                formData.vendor_gstin.length ===
                  15 &&
                GST_REGEX.test(
                  formData.vendor_gstin
                ) && (
                  <div className="gst-valid">
                    ✓ Valid GST number
                  </div>
                )}
            </div>
          )}

          {/* STATE */}

          <div className="form-group">
            <label>
              Vendor State
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
              disabled={
                creating ||
                formData.vendor_has_gst ===
                  "yes"
              }
            >
              <option value="">
                Select State
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

            {formData.vendor_has_gst ===
              "yes" && (
              <small className="field-help">
                GST number मधील state code वरून state automatic घेतला जातो.
              </small>
            )}
          </div>

          {/* =================================================
              TAXABLE AMOUNT
              IMPORTANT: हा section GST condition च्या बाहेर आहे.
          ================================================= */}

          <div
            className="form-group taxable-amount-section"
            style={{
              display: "block",
              width: "100%",
            }}
          >
            <label>
              Total Amount Before GST
              <span>*</span>
            </label>

            <input
              type="text"
              name="total_amount"
              value={
                formData.total_amount
              }
              onChange={
                handleChange
              }
              placeholder="Enter taxable amount"
              disabled={creating}
              required
            />

            <small className="field-help">
              हा GST आधीचा product / taxable total आहे.
            </small>
          </div>

          {/* SINGLE GST RATE */}

          {formData.vendor_has_gst ===
            "yes" && (
            <div className="form-group">
              <label>
                GST Rate
              </label>

              <input
                type="text"
                name="gst_rate"
                value={
                  formData.gst_rate
                }
                onChange={
                  handleChange
                }
                placeholder="Example: 5, 12, 18"
                disabled={
                  creating ||
                  formData.gst_breakdown
                    .length > 1
                }
              />

              <small className="field-help">
                Single GST rate असल्यास येथे rate टाका. Multiple rates असल्यास खाली breakdown वापरा.
              </small>
            </div>
          )}

          {/* MULTIPLE GST BREAKDOWN */}

          {formData.vendor_has_gst ===
            "yes" && (
            <div className="gst-breakdown-section">

              <div className="gst-breakdown-header">
                <div>
                  <strong>
                    GST Breakdown
                  </strong>

                  <span>
                    Multiple GST rates असल्यास प्रत्येक rate चा taxable amount वेगळा द्या.
                  </span>
                </div>

                <button
                  type="button"
                  className="add-gst-btn"
                  onClick={
                    addGSTRow
                  }
                  disabled={
                    creating
                  }
                >
                  <Plus size={15} />

                  Add GST Rate
                </button>
              </div>

              {formData.gst_breakdown
                .length === 0 && (
                <div className="gst-empty-message">
                  Multiple GST rates असतील तर
                  <strong>
                    {" "}
                    Add GST Rate{" "}
                  </strong>
                  वर click करा.
                </div>
              )}

              {formData.gst_breakdown.map(
                (
                  row,
                  index
                ) => (
                  <div
                    className="gst-breakdown-row"
                    key={index}
                  >

                    {/* RATE */}

                    <div>
                      <label>
                        GST Rate %
                      </label>

                      <input
                        type="text"
                        value={
                          row.rate
                        }
                        placeholder="18"
                        onChange={(e) =>
                          handleGSTBreakdownChange(
                            index,
                            "rate",
                            e.target.value
                          )
                        }
                        disabled={
                          creating
                        }
                      />
                    </div>

                    {/* TAXABLE */}

                    <div>
                      <label>
                        Taxable Amount
                      </label>

                      <input
                        type="text"
                        value={
                          row.taxable_amount
                        }
                        placeholder="10000"
                        onChange={(e) =>
                          handleGSTBreakdownChange(
                            index,
                            "taxable_amount",
                            e.target.value
                          )
                        }
                        disabled={
                          creating
                        }
                      />
                    </div>

                    {/* GST AMOUNT */}

                    <div>
                      <label>
                        GST Amount
                      </label>

                      <input
                        type="text"
                        value={
                          Number(
                            row.gst_amount
                          ).toFixed(2)
                        }
                        readOnly
                      />
                    </div>

                    {/* REMOVE */}

                    <button
                      type="button"
                      className="remove-gst-btn"
                      onClick={() =>
                        removeGSTRow(
                          index
                        )
                      }
                      disabled={
                        creating
                      }
                      title="Remove GST"
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {/* CALCULATION */}

          <div className="invoice-calculation-box">

            <div className="calculation-row">
              <span>
                Taxable Amount
              </span>

              <strong>
                ₹{" "}
                {taxableAmount.toFixed(
                  2
                )}
              </strong>
            </div>

            {formData.gst_breakdown
              .length > 0 &&
              formData.gst_breakdown.map(
                (
                  row,
                  index
                ) => (
                  <div
                    className="calculation-row"
                    key={index}
                  >
                    <span>
                      GST{" "}
                      {row.rate ||
                        0}
                      %
                    </span>

                    <strong>
                      ₹{" "}
                      {numberValue(
                        row.gst_amount
                      ).toFixed(
                        2
                      )}
                    </strong>
                  </div>
                )
              )}

            {formData.vendor_has_gst ===
              "yes" &&
              formData.gst_breakdown
                .length === 0 &&
              numberValue(
                formData.gst_rate
              ) > 0 && (
                <div className="calculation-row">
                  <span>
                    GST{" "}
                    {
                      formData.gst_rate
                    }
                    %
                  </span>

                  <strong>
                    ₹{" "}
                    {currentGST.toFixed(
                      2
                    )}
                  </strong>
                </div>
              )}

            <div className="calculation-row">
              <span>
                Total GST
              </span>

              <strong>
                ₹{" "}
                {currentGST.toFixed(
                  2
                )}
              </strong>
            </div>

            <div className="calculation-final">
              <span>
                Final Amount
              </span>

              <strong>
                ₹{" "}
                {currentFinal.toFixed(
                  2
                )}
              </strong>
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="form-group">
            <label>
              Description
            </label>

            <textarea
              name="description"
              rows="3"
              value={
                formData.description
              }
              onChange={
                handleChange
              }
              placeholder="Enter invoice description"
              disabled={creating}
            />
          </div>

          {/* ACTIONS */}

          <div className="invoice-form-actions">

            <button
              type="button"
              className="invoice-cancel-btn"
              onClick={onClose}
              disabled={
                creating
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="invoice-create-btn"
              disabled={
                creating ||
                scanning
              }
            >
              {creating
                ? "Creating..."
                : "Create Invoice"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
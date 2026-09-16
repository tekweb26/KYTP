
const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;


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
   GSTIN VALIDATION
===================================================== */

export const validateGSTIN = (gstin) => {

  if (!gstin) {
    return {
      isValid: false,
      gstin: null,
      state: null,
      stateCode: null,
      message: "GSTIN is missing",
    };
  }


  const cleanedGSTIN = String(gstin)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");


  const isValid =
    GSTIN_REGEX.test(cleanedGSTIN);


  if (!isValid) {
    return {
      isValid: false,
      gstin: null,
      state: null,
      stateCode: null,
      message: "Invalid GSTIN format",
    };
  }


  const stateCode =
    cleanedGSTIN.substring(0, 2);


  const state =
    GST_STATE_MAP[stateCode] || null;


  return {
    isValid: true,
    gstin: cleanedGSTIN,
    stateCode,
    state,
    message: "GSTIN format is valid",
  };
};


/* =====================================================
   GET STATE FROM GSTIN
===================================================== */

export const getStateFromGSTIN = (gstin) => {

  if (!gstin) {
    return "";
  }


  const cleanedGSTIN = String(gstin)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");


  if (
    !GSTIN_REGEX.test(
      cleanedGSTIN
    )
  ) {
    return "";
  }


  const stateCode =
    cleanedGSTIN.substring(0, 2);


  return (
    GST_STATE_MAP[stateCode] ||
    ""
  );
};


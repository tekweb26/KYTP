import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";


/* =====================================================
   ENVIRONMENT VARIABLES
===================================================== */

dotenv.config();


/* =====================================================
   APP
===================================================== */

const app = express();


/* =====================================================
   DATABASE
===================================================== */

connectDB();


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://kytp.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);


/* =====================================================
   STATIC FILES
===================================================== */

app.use(express.static("public"));


/* =====================================================
   AUTH ROUTES
===================================================== */

/*
   Register
   POST /api/auth/register

   Login
   POST /api/auth/login
*/

app.use(
  "/api/auth",
  authRoutes
);


/* =====================================================
   PROTECTED PROFILE ROUTE
===================================================== */

app.get(
  "/api/auth/profile",
  authMiddleware,
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Protected route accessed successfully",

      user: req.user,
    });
  }
);


/* =====================================================
   GST MOCK DATABASE
   Temporary
===================================================== */

const gstDatabase = {
  "27ABCDE1234F1Z5": {
    gstin: "27ABCDE1234F1Z5",
    businessName:
      "TECH SOLUTIONS PRIVATE LIMITED",
    businessType:
      "Private Limited Company",

    registeredAddress:
      "123 Business Park, Mumbai, Maharashtra 400001",

    state: "Maharashtra",
    stateCode: "27",
    panNumber: "ABCDE1234F",

    registrationDate: "2020-01-15",

    complianceStatus: "Compliant",

    lastReturnFiled: "2024-07-15",

    returnStatus: "Filed",

    outstandingTax: 0,
    invoicesPending: 0,
    filedReturns: 24,

    category: "Regular",

    businessActivity:
      "Software Development & IT Services",
  },


  "36AABCT1234H1Z0": {
    gstin: "36AABCT1234H1Z0",

    businessName:
      "APEX MANUFACTURING CORPORATION",

    businessType:
      "Partnership Firm",

    registeredAddress:
      "Plot 45, Industrial Area, Hyderabad, Telangana 500032",

    state: "Telangana",
    stateCode: "36",
    panNumber: "AABCT1234H",

    registrationDate: "2019-06-20",

    complianceStatus: "Compliant",

    lastReturnFiled: "2024-07-20",

    returnStatus: "Filed",

    outstandingTax: 15000,
    invoicesPending: 5,
    filedReturns: 18,

    category: "Regular",

    businessActivity:
      "Manufacturing of Industrial Equipment",
  },


  "19AABCC1234G1Z5": {
    gstin: "19AABCC1234G1Z5",

    businessName:
      "AGRO EXPORT SOLUTIONS LLP",

    businessType:
      "Limited Liability Partnership",

    registeredAddress:
      "Sector 12, Delhi 110001",

    state: "Delhi",
    stateCode: "19",
    panNumber: "AABCC1234G",

    registrationDate: "2021-03-10",

    complianceStatus:
      "Non-Compliant",

    lastReturnFiled: "2024-05-30",

    returnStatus: "Overdue",

    outstandingTax: 125000,
    invoicesPending: 23,
    filedReturns: 12,

    category: "Regular",

    businessActivity:
      "Agricultural Products Export",
  },
};


/* =====================================================
   GST FORMAT VALIDATION
===================================================== */

function isValidGSTFormat(gstin) {

  const gstRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9]{1}$/;

  return gstRegex.test(gstin);
}


/* =====================================================
   GST CHECK DIGIT
===================================================== */

function calculateGSTCheckDigit(
  gstWithoutCheck
) {

  const factor = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
  ];


  const charMap = {

    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 18,
    J: 19,
    K: 20,
    L: 21,
    M: 22,
    N: 23,
    O: 24,
    P: 25,
    Q: 26,
    R: 27,
    S: 28,
    T: 29,
    U: 30,
    V: 31,
    W: 32,
    X: 33,
    Y: 34,
    Z: 35,

  };


  let sum = 0;

  let position = 0;


  for (
    let i =
      gstWithoutCheck.length - 1;

    i >= 0;

    i--
  ) {

    const char =
      gstWithoutCheck[i];


    const digit =
      isNaN(char)
        ? charMap[char]
        : parseInt(char);


    const product =
      digit *
      factor[position % 10];


    sum +=
      Math.floor(
        product / 36
      ) +
      (product % 36);


    position++;
  }


  const checkDigit =
    (36 - (sum % 36)) % 36;


  return checkDigit < 10
    ? checkDigit.toString()
    : String.fromCharCode(
        55 + checkDigit
      );
}


/* =====================================================
   GST VALIDATION FUNCTION
===================================================== */

function validateGST(gstin) {

  const cleanGST =
    gstin
      .toUpperCase()
      .trim();


  /* ---------------------------------------------
     FORMAT CHECK
  --------------------------------------------- */

  if (
    !isValidGSTFormat(
      cleanGST
    )
  ) {

    return {

      isValid: false,

      message:
        "Invalid GST format. GST must be 15 characters.",

      error:
        "FORMAT_INVALID",

    };
  }


  /* ---------------------------------------------
     MOCK DATABASE CHECK
  --------------------------------------------- */

  if (
    gstDatabase[cleanGST]
  ) {

    return {

      isValid: true,

      message:
        "Valid GST Number",

      data:
        gstDatabase[cleanGST],

    };
  }


  /* ---------------------------------------------
     EXTRACT GST INFORMATION
  --------------------------------------------- */

  const stateCode =
    cleanGST.substring(
      0,
      2
    );


  const panNumber =
    cleanGST.substring(
      2,
      12
    );


  const gstWithoutCheckDigit =
    cleanGST.substring(
      0,
      14
    );


  const providedCheckDigit =
    cleanGST[14];


  const calculatedCheckDigit =
    calculateGSTCheckDigit(
      gstWithoutCheckDigit
    );


  /* ---------------------------------------------
     CHECKSUM VALIDATION
  --------------------------------------------- */

  if (
    providedCheckDigit !==
    calculatedCheckDigit
  ) {

    return {

      isValid: false,

      message:
        "Invalid GST checksum",

      error:
        "CHECKSUM_INVALID",

    };
  }


  /* ---------------------------------------------
     MOCK GST DATA
  --------------------------------------------- */

  const mockData = {

    gstin:
      cleanGST,

    businessName:
      "REGISTERED BUSINESS NAME",

    businessType:
      "Private Limited Company",

    registeredAddress:
      "Address will be fetched from GST registry",

    state:
      "State Name",

    stateCode,

    panNumber,

    registrationDate:
      "2020-01-15",

    complianceStatus:
      "Compliant",

    lastReturnFiled:
      new Date()
        .toISOString()
        .split("T")[0],

    returnStatus:
      "Filed",

    outstandingTax:
      0,

    invoicesPending:
      0,

    filedReturns:
      12,

    category:
      "Regular",

    businessActivity:
      "General Business Activity",
  };


  return {

    isValid:
      true,

    message:
      "Valid GST Number (Mock Data)",

    data:
      mockData,

  };
}


/* =====================================================
   GST POST ROUTE
===================================================== */

app.post(
  "/api/gst/validate",
  (req, res) => {

    const { gstin } =
      req.body;


    if (!gstin) {

      return res
        .status(400)
        .json({

          isValid:
            false,

          message:
            "GST number is required",

          error:
            "GSTIN_REQUIRED",

        });
    }


    const result =
      validateGST(
        gstin
      );


    const statusCode =
      result.isValid
        ? 200
        : 400;


    res
      .status(statusCode)
      .json(result);
  }
);


/* =====================================================
   GST GET ROUTE
===================================================== */

app.get(
  "/api/gst/validate/:gstin",
  (req, res) => {

    const result =
      validateGST(
        req.params.gstin
      );


    const statusCode =
      result.isValid
        ? 200
        : 400;


    res
      .status(statusCode)
      .json(result);
  }
);


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get(
  "/health",
  (req, res) => {

    res.status(200).json({

      status:
        "OK",

      timestamp:
        new Date(),

      message:
        "GST Payment Platform API is running",

    });
  }
);


/* =====================================================
   HOME ROUTE
===================================================== */

app.get(
  "/",
  (req, res) => {

    res.status(200).json({

      success:
        true,

      message:
        "GST Payment Platform API",

      version:
        "0.1.0",

      endpoints: {

        auth: {

          register:
            "POST /api/auth/register",

          login:
            "POST /api/auth/login",

          profile:
            "GET /api/auth/profile",

        },


        gst: {

          validate:
            "POST /api/gst/validate",

          validateGet:
            "GET /api/gst/validate/:gstin",

        },


        health:
          "GET /health",

      },

    });
  }
);


/* =====================================================
   404 HANDLER
===================================================== */

app.use(
  (req, res) => {

    res.status(404).json({

      success:
        false,

      message:
        "Route not found",

      path:
        req.originalUrl,

    });
  }
);


/* =====================================================
   ERROR HANDLER
===================================================== */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      "Server Error:",
      err
    );


    res
      .status(
        err.status || 500
      )
      .json({

        success:
          false,

        message:
          err.message ||
          "Internal Server Error",

      });
  }
);


/* =====================================================
   SERVER
===================================================== */

const PORT =
  process.env.PORT || 5000;


app.listen(
  PORT,
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);
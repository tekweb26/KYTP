import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";


/* =====================================================
   GENERATE JWT TOKEN
===================================================== */

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "7d",
    }
  );
};


/* =====================================================
   REGISTER
===================================================== */

export const register = async (req, res) => {
  try {

    const {
      hasGST,
      gstNumber,
      panNumber,
      mobileNumber,
      email,
      password,
    } = req.body;


    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (
      hasGST === undefined ||
      !panNumber ||
      !mobileNumber ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All required fields are required",
      });
    }


    /* =================================================
       GST VALIDATION
    ================================================= */

    let cleanGST = "";

    if (hasGST === true) {

      if (!gstNumber) {
        return res.status(400).json({
          success: false,
          message:
            "GST number is required",
        });
      }


      cleanGST =
        gstNumber
          .toUpperCase()
          .trim();


      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;


      if (!gstRegex.test(cleanGST)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid GST number",
        });
      }

    } else {

      /*
        User does not have GST.
        Therefore GST number blank ठेवतो.
      */

      cleanGST = "";

    }


    /* =================================================
       PAN VALIDATION
    ================================================= */

    const cleanPAN =
      panNumber
        .toUpperCase()
        .trim();


    const panRegex =
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;


    if (!panRegex.test(cleanPAN)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid PAN number",
      });
    }


    /* =================================================
       MOBILE VALIDATION
    ================================================= */

    const cleanMobile =
      mobileNumber
        .replace(/\D/g, "");


    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid mobile number",
      });
    }


    /* =================================================
       EMAIL
    ================================================= */

    const cleanEmail =
      email
        .toLowerCase()
        .trim();


    /* =================================================
       CHECK EXISTING EMAIL
    ================================================= */

    const existingEmail =
      await User.findOne({
        email: cleanEmail,
      });


    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email already registered",
      });
    }


    /* =================================================
       CHECK EXISTING GST
    ================================================= */

    if (hasGST === true) {

      const existingGST =
        await User.findOne({
          gstNumber: cleanGST,
        });


      if (existingGST) {
        return res.status(400).json({
          success: false,
          message:
            "GST number already registered",
        });
      }

    }


    /* =================================================
       PASSWORD
    ================================================= */

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters",
      });
    }


    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );


    /* =================================================
       CREATE USER
    ================================================= */

    const user =
      await User.create({

        hasGST:
          hasGST === true,

        gstNumber:
          cleanGST,

        panNumber:
          cleanPAN,

        mobileNumber:
          cleanMobile,

        email:
          cleanEmail,

        password:
          hashedPassword,

      });


    /* =================================================
       JWT TOKEN
    ================================================= */

    const token =
      generateToken(user);


    /* =================================================
       RESPONSE
    ================================================= */

    return res.status(201).json({

      success: true,

      message:
        "Registration successful",

      user: {

        id:
          user._id,

        hasGST:
          user.hasGST,

        gstNumber:
          user.gstNumber,

        panNumber:
          user.panNumber,

        mobileNumber:
          user.mobileNumber,

        email:
          user.email,

        role:
          user.role,

      },

      token,

    });

  } catch (error) {

    console.error(
      "Register Error:",
      error
    );


    /* =================================================
       DUPLICATE KEY ERROR
    ================================================= */

    if (error.code === 11000) {

      return res.status(400).json({

        success: false,

        message:
          "Email or GST number already exists",

      });

    }


    return res.status(500).json({

      success: false,

      message:
        "Server error",

    });

  }
};


/* =====================================================
   LOGIN
===================================================== */

export const login = async (req, res) => {

  try {

    const {
      email,
      password,
    } = req.body;


    if (!email || !password) {

      return res.status(400).json({

        success: false,

        message:
          "Email and password are required",

      });

    }


    const cleanEmail =
      email
        .toLowerCase()
        .trim();


    const user =
      await User.findOne({
        email: cleanEmail,
      });


    if (!user) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password",

      });

    }


    const isPasswordMatch =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!isPasswordMatch) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password",

      });

    }


    const token =
      generateToken(user);


    return res.status(200).json({

      success: true,

      message:
        "Login successful",

      user: {

        id:
          user._id,

        hasGST:
          user.hasGST,

        gstNumber:
          user.gstNumber,

        panNumber:
          user.panNumber,

        mobileNumber:
          user.mobileNumber,

        email:
          user.email,

        role:
          user.role,

      },

      token,

    });

  } catch (error) {

    console.error(
      "Login Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Server error",

    });

  }
};
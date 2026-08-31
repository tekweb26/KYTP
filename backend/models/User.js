import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* =====================================================
       PERSON NAME
    ===================================================== */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    /* =====================================================
       COMPANY NAME
    ===================================================== */

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    /* =====================================================
       COMPANY ADDRESS
    ===================================================== */

    companyAddress: {
      type: String,
      required: true,
      trim: true,
    },

    /* =====================================================
       COMPANY STATE

       GST असेल तर GST मधून मिळू शकतो,
       पण GST नसल्यास manual state आवश्यक.
    ===================================================== */

    companyState: {
      type: String,
      required: true,
      trim: true,
    },

    /* =====================================================
       GST AVAILABLE
    ===================================================== */

    hasGST: {
      type: Boolean,
      required: true,
      default: false,
    },

    /* =====================================================
       GST NUMBER
    ===================================================== */

    gstNumber: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      default: "",
    },

    /* =====================================================
       PAN
    ===================================================== */

    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    /* =====================================================
       MOBILE
    ===================================================== */

    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },

    /* =====================================================
       EMAIL
    ===================================================== */

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    /* =====================================================
       PASSWORD
    ===================================================== */

    password: {
      type: String,
      required: true,
    },

    /* =====================================================
       ROLE
    ===================================================== */

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
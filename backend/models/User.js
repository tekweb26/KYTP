import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* =====================================================
       GST AVAILABLE OR NOT
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
       PAN NUMBER
    ===================================================== */

    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },


    /* =====================================================
       MOBILE NUMBER
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


const User = mongoose.model(
  "User",
  userSchema
);


export default User;
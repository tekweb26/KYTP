import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../api/api";
import "./SignupPage.css";

export default function SignupPage({ onLogin }) {
  const navigate = useNavigate();

  const [hasGST, setHasGST] = useState("");

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyState, setCompanyState] = useState("");

  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [gstError, setGstError] = useState("");
  const [loading, setLoading] = useState(false);


  /* =====================================================
     STATES
  ===================================================== */

  const states = [
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
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Puducherry",
    "Chandigarh",
  ];


  /* =====================================================
     GST VALIDATION
  ===================================================== */

  const validateGST = (gst) => {
    const cleanGST =
      gst.toUpperCase().trim();

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!cleanGST) {
      return "GST number is required";
    }

    if (cleanGST.length !== 15) {
      return "GST number must be 15 characters";
    }

    if (!gstRegex.test(cleanGST)) {
      return "Please enter a valid GST number";
    }

    return "";
  };


  /* =====================================================
     PAN
  ===================================================== */

  const validatePAN = (pan) => {
    const cleanPAN =
      pan.toUpperCase().trim();

    const panRegex =
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    return panRegex.test(cleanPAN);
  };


  /* =====================================================
     GST CHANGE
  ===================================================== */

  const handleGSTChange = (e) => {
    const value =
      e.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 15);

    setGstNumber(value);

    if (value.length > 0) {
      setGstError(
        validateGST(value)
      );
    } else {
      setGstError("");
    }
  };


  /* =====================================================
     PAN
  ===================================================== */

  const handlePANChange = (e) => {
    const value =
      e.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);

    setPanNumber(value);
  };


  /* =====================================================
     MOBILE
  ===================================================== */

  const handleMobileChange = (e) => {
    const value =
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 10);

    setMobileNumber(value);
  };


  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName =
      name.trim();

    if (!cleanName) {
      toast.error(
        "Please enter your name"
      );
      return;
    }


    const cleanCompanyName =
      companyName.trim();

    if (!cleanCompanyName) {
      toast.error(
        "Please enter company name"
      );
      return;
    }


    const cleanCompanyAddress =
      companyAddress.trim();

    if (!cleanCompanyAddress) {
      toast.error(
        "Please enter company address"
      );
      return;
    }


    if (!companyState) {
      toast.error(
        "Please select company state"
      );
      return;
    }


    if (!hasGST) {
      toast.error(
        "Please select whether you have GST"
      );
      return;
    }


    if (hasGST === "yes") {
      const error =
        validateGST(gstNumber);

      if (error) {
        setGstError(error);
        toast.error(error);
        return;
      }
    }


    if (!validatePAN(panNumber)) {
      toast.error(
        "Please enter a valid PAN number"
      );
      return;
    }


    if (mobileNumber.length !== 10) {
      toast.error(
        "Please enter a valid 10 digit mobile number"
      );
      return;
    }


    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error(
        "Please enter email address"
      );
      return;
    }


    if (password.length < 6) {
      toast.error(
        "Password must contain at least 6 characters"
      );
      return;
    }


    const signupData = {
      name: cleanName,

      companyName:
        cleanCompanyName,

      companyAddress:
        cleanCompanyAddress,

      companyState,

      hasGST:
        hasGST === "yes",

      gstNumber:
        hasGST === "yes"
          ? gstNumber.trim().toUpperCase()
          : "",

      panNumber:
        panNumber.trim().toUpperCase(),

      mobileNumber:
        mobileNumber.trim(),

      email:
        cleanEmail,

      password,
    };


    setLoading(true);

    try {
      const response =
        await authAPI.register(
          signupData
        );

      const data =
        response.data;

      console.log(
        "Signup Response:",
        data
      );

      if (data.success) {
        toast.success(
          "Account created successfully!"
        );

        if (onLogin) {
          onLogin(data);
        } else {
          navigate("/login");
        }

        return;
      }

      toast.error(
        data.message ||
        "Registration failed"
      );

    } catch (error) {
      console.error(
        "Signup Error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
        "Unable to connect to server"
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="kytp-signup-page">

      <div className="kytp-signup-card">

        <div className="kytp-signup-logo">
          <div className="kytp-signup-logo-box">
            🇮🇳 KYTP
          </div>

          <p>
            GST Payment Platform
          </p>
        </div>


        <div className="kytp-signup-heading">
          <h1>
            Create Account
          </h1>

          <p>
            Register to start using the GST Payment Platform
          </p>
        </div>


        <form
          onSubmit={handleSubmit}
          className="kytp-signup-form"
        >

          {/* PERSON NAME */}

          <div className="kytp-form-group">
            <label>
              Person Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Enter your full name"
              required
            />
          </div>


          {/* COMPANY NAME */}

          <div className="kytp-form-group">
            <label>
              Company Name
            </label>

            <input
              type="text"
              value={companyName}
              onChange={(e) =>
                setCompanyName(
                  e.target.value
                )
              }
              placeholder="Enter company name"
              required
            />
          </div>


          {/* COMPANY ADDRESS */}

          <div className="kytp-form-group">
            <label>
              Company Address
            </label>

            <textarea
              value={companyAddress}
              onChange={(e) =>
                setCompanyAddress(
                  e.target.value
                )
              }
              placeholder="Enter complete company address"
              rows="3"
              required
            />
          </div>


          {/* COMPANY STATE */}

          <div className="kytp-form-group">
            <label>
              Company State
            </label>

            <select
              value={companyState}
              onChange={(e) =>
                setCompanyState(
                  e.target.value
                )
              }
              required
            >
              <option value="">
                Select State
              </option>

              {states.map((state) => (
                <option
                  key={state}
                  value={state}
                >
                  {state}
                </option>
              ))}
            </select>
          </div>


          {/* GST QUESTION */}

          <div className="kytp-form-group">

            <label>
              Do you have a GST Number?
            </label>

            <div className="kytp-gst-options">

              <label className="kytp-radio-option">
                <input
                  type="radio"
                  name="hasGST"
                  value="yes"
                  checked={
                    hasGST === "yes"
                  }
                  onChange={(e) => {
                    setHasGST(
                      e.target.value
                    );
                    setGstError("");
                  }}
                />

                <span>
                  Yes
                </span>
              </label>


              <label className="kytp-radio-option">
                <input
                  type="radio"
                  name="hasGST"
                  value="no"
                  checked={
                    hasGST === "no"
                  }
                  onChange={(e) => {
                    setHasGST(
                      e.target.value
                    );

                    setGstNumber("");
                    setGstError("");
                  }}
                />

                <span>
                  No
                </span>
              </label>

            </div>

          </div>


          {/* GST */}

          {hasGST === "yes" && (
            <div className="kytp-form-group">

              <label>
                GST Number
              </label>

              <input
                type="text"
                value={gstNumber}
                onChange={
                  handleGSTChange
                }
                placeholder="Enter 15 digit GSTIN"
                maxLength={15}
                autoComplete="off"
                className={
                  gstError
                    ? "kytp-input-error"
                    : ""
                }
              />

              {gstError && (
                <small className="kytp-error-text">
                  {gstError}
                </small>
              )}

              {!gstError &&
                gstNumber.length === 15 && (
                  <small className="kytp-success-text">
                    ✓ Valid GST format
                  </small>
                )}

            </div>
          )}


          {/* PAN */}

          <div className="kytp-form-group">
            <label>
              PAN Number
            </label>

            <input
              type="text"
              value={panNumber}
              onChange={
                handlePANChange
              }
              placeholder="Enter PAN number"
              maxLength={10}
              required
            />
          </div>


          {/* MOBILE */}

          <div className="kytp-form-group">
            <label>
              Mobile Number
            </label>

            <input
              type="tel"
              value={mobileNumber}
              onChange={
                handleMobileChange
              }
              placeholder="Enter 10 digit mobile number"
              maxLength={10}
              required
            />
          </div>


          {/* EMAIL */}

          <div className="kytp-form-group">
            <label>
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              required
            />
          </div>


          {/* PASSWORD */}

          <div className="kytp-form-group">
            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Create a password"
              required
            />

            <small className="kytp-password-hint">
              Password must be at least 6 characters
            </small>
          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="kytp-signup-button"
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>


        <div className="kytp-signup-switch">
          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
          >
            Login
          </button>
        </div>


        <div className="kytp-signup-footer">
          © 2026 KYTP • GST Payment Platform
        </div>

      </div>

    </div>
  );
}
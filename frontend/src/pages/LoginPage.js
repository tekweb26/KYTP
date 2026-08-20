import React, { useState } from "react";
import { authAPI } from "../api/api";
import toast from "react-hot-toast";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);


  /* =====================================================
     HANDLE LOGIN / REGISTER
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = isLogin
        ? await authAPI.login(email, password)
        : await authAPI.register(email, password);

      const data = response.data;

      console.log("Auth Response:", data);

      if (data.success) {
        toast.success(
          isLogin
            ? "Login successful!"
            : "Registration successful!"
        );

        /*
          Backend response:

          {
            success: true,
            user: {...},
            token: "JWT TOKEN"
          }

          App.js मध्ये पूर्ण data पाठवत आहोत.
        */

        onLogin(data);

        return;
      }

      toast.error(
        data.message || "Something went wrong"
      );

    } catch (error) {

      console.error(
        "Authentication Error:",
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


  /* =====================================================
     SWITCH LOGIN / REGISTER
  ===================================================== */

  const handleModeChange = () => {
    setIsLogin(!isLogin);

    setEmail("");
    setPassword("");
  };


  return (
    <div className="kytp-login-page">

      <div className="kytp-login-card">


        {/* =================================================
            LOGO
        ================================================= */}

        <div className="kytp-login-logo">

          <div className="kytp-login-logo-box">
            🇮🇳 KYTP
          </div>

          <p>
            GST Payment Platform
          </p>

        </div>


        {/* =================================================
            TITLE
        ================================================= */}

        <div className="kytp-login-heading">

          <h1>
            {isLogin
              ? "Welcome Back!"
              : "Create Account"}
          </h1>

          <p>
            {isLogin
              ? "Login to access your GST payment dashboard"
              : "Register to start using the GST Payment Platform"}
          </p>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="kytp-login-form"
        >


          {/* EMAIL */}

          <div className="kytp-form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

          </div>


          {/* PASSWORD */}

          <div className="kytp-form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              autoComplete={
                isLogin
                  ? "current-password"
                  : "new-password"
              }
              required
            />

          </div>


          {/* SUBMIT BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="kytp-login-button"
          >

            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Create Account"}

          </button>

        </form>


        {/* =================================================
            SWITCH LOGIN / REGISTER
        ================================================= */}

        <div className="kytp-login-switch">

          <span>
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>

          <button
            type="button"
            onClick={handleModeChange}
          >
            {isLogin
              ? "Register"
              : "Login"}
          </button>

        </div>


        {/* =================================================
            LOGIN INFORMATION
        ================================================= */}

        <div className="kytp-demo-box">

          <div className="kytp-demo-title">
            {isLogin
              ? "Login Information"
              : "Account Information"}
          </div>

          <p>
            {isLogin
              ? "Use the email and password you registered with."
              : "Your account will be securely stored in MongoDB."}
          </p>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="kytp-login-footer">
          © 2026 KYTP • GST Payment Platform
        </div>


      </div>

    </div>
  );
}
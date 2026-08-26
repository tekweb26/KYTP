import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/api";
import toast from "react-hot-toast";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);


  /* =====================================================
     HANDLE LOGIN
  ===================================================== */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!email || !password) {

      toast.error(
        "Please enter email and password"
      );

      return;
    }

    setLoading(true);

    try {

      const response =
        await authAPI.login(
          email,
          password
        );

      const data =
        response.data;

      console.log(
        "Login Response:",
        data
      );


      if (data.success) {

        toast.success(
          "Login successful!"
        );


        /*
          Backend response:

          {
            success: true,
            user: {...},
            token: "JWT TOKEN"
          }

          Complete response App.js ला पाठवत आहोत.
        */

        onLogin(data);

        return;
      }


      toast.error(
        data.message ||
        "Login failed"
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
     GO TO SIGNUP
  ===================================================== */

  const handleSignup = () => {

    navigate("/signup");

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
            Welcome Back!
          </h1>

          <p>
            Login to access your GST payment dashboard
          </p>

        </div>


        {/* =================================================
            LOGIN FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="kytp-login-form"
        >


          {/* =================================================
              EMAIL
          ================================================= */}

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


          {/* =================================================
              PASSWORD
          ================================================= */}

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
              autoComplete="current-password"
              required
            />

          </div>


          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
            className="kytp-login-button"
          >

            {loading
              ? "Please wait..."
              : "Login"}

          </button>

        </form>


        {/* =================================================
            SIGNUP LINK
        ================================================= */}

        <div className="kytp-login-switch">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={handleSignup}
          >
            Sign Up
          </button>

        </div>


        {/* =================================================
            LOGIN INFORMATION
        ================================================= */}

        <div className="kytp-demo-box">

          <div className="kytp-demo-title">
            Login Information
          </div>

          <p>
            Use the email and password
            you registered with.
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


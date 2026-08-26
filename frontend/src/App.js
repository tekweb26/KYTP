import React, { useState } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import PaymentsPage from "./pages/PaymentsPage";
import ScannerPage from "./pages/ScannerPage";
import GSTPage from "./pages/GSTPage";


function App() {

  const [isAuthenticated, setIsAuthenticated] =
    useState(
      !!localStorage.getItem("token")
    );


  const [user, setUser] = useState(
    JSON.parse(
      localStorage.getItem("user") || "null"
    )
  );


  /* =====================================================
     LOGIN / SIGNUP SUCCESS
  ===================================================== */

  const handleLogin = (loginData) => {

    const userData = loginData.user;
    const token = loginData.token;

    setIsAuthenticated(true);
    setUser(userData);

    localStorage.setItem(
      "token",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );
  };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {

    setIsAuthenticated(false);
    setUser(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };


  return (

    <Router>

      <div className="min-h-screen bg-gray-50">


        {/* =================================================
            NAVBAR
        ================================================= */}

        {isAuthenticated && (
          <Navbar
            user={user}
            onLogout={handleLogout}
          />
        )}


        {/* =================================================
            TOASTER
        ================================================= */}

        <Toaster
          position="top-right"
        />


        {/* =================================================
            ROUTES
        ================================================= */}

        <Routes>


          {/* =================================================
              LOGIN
          ================================================= */}

          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <LoginPage
                  onLogin={handleLogin}
                />
              )
            }
          />


          {/* =================================================
              SIGNUP
          ================================================= */}

          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <SignupPage
                  onLogin={handleLogin}
                />
              )
            }
          />


          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                isAuthenticated={
                  isAuthenticated
                }
              >
                <DashboardPage
                  user={user}
                />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              INVOICES
          ================================================= */}

          <Route
            path="/invoices"
            element={
              <ProtectedRoute
                isAuthenticated={
                  isAuthenticated
                }
              >
                <InvoicesPage
                  user={user}
                />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              PAYMENTS
          ================================================= */}

          <Route
            path="/payments"
            element={
              <ProtectedRoute
                isAuthenticated={
                  isAuthenticated
                }
              >
                <PaymentsPage
                  user={user}
                />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              SCANNER
          ================================================= */}

          <Route
            path="/scanner"
            element={
              <ProtectedRoute
                isAuthenticated={
                  isAuthenticated
                }
              >
                <ScannerPage
                  user={user}
                />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              GST
          ================================================= */}

          <Route
            path="/gst"
            element={
              <ProtectedRoute
                isAuthenticated={
                  isAuthenticated
                }
              >
                <GSTPage
                  user={user}
                />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              DEFAULT
          ================================================= */}

          <Route
            path="/"
            element={
              <Navigate to="/login" />
            }
          />


          {/* =================================================
              UNKNOWN ROUTE
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate to="/login" />
            }
          />

        </Routes>


        {/* =================================================
            FOOTER
        ================================================= */}

        <Footer />

      </div>

    </Router>
  );
}


export default App;


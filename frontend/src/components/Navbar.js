import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  BarChart3,
  FileText,
  CreditCard,
  Camera,
  TrendingUp,
  Settings,
  Bell,
  User,
} from "lucide-react";

import "./Navbar.css";

export default function Navbar({ user, onLogout }) {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", icon: BarChart3, label: "Dashboard" },
    { path: "/invoices", icon: FileText, label: "Invoices" },
    { path: "/payments", icon: CreditCard, label: "Payments" },
    { path: "/scanner", icon: Camera, label: "Scanner" },
    { path: "/gst", icon: TrendingUp, label: "GST" },
  ];

  return (
    <>
      <nav className="ktyp-navbar">
        <div className="ktyp-navbar-container">

          {/* LOGO */}
          <Link to="/dashboard" className="ktyp-logo">
            <div className="ktyp-logo-box">
              🇮🇳 KYTP
            </div>

            <span className="ktyp-logo-text">
              GST Payment Platform
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="ktyp-nav-links">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`ktyp-nav-link ${
                    isActive(item.path) ? "active" : ""
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* RIGHT SECTION */}
          <div className="ktyp-navbar-right">

            {/* NOTIFICATION */}
            <button className="ktyp-notification">
              <Bell size={20} />
              <span className="ktyp-notification-dot"></span>
            </button>

            {/* USER */}
            <div className="ktyp-user-wrapper">

              <button
                className="ktyp-user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="ktyp-user-avatar">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>

                <span className="ktyp-user-name">
                  {user?.email?.split("@")[0] || "User"}
                </span>
              </button>

              {/* USER DROPDOWN */}
              {showUserMenu && (
                <div className="ktyp-user-dropdown">

                  <div className="ktyp-user-header">
                    <div className="ktyp-user-email">
                      {user?.email || "User"}
                    </div>

                    <div className="ktyp-account-text">
                      Account Settings
                    </div>
                  </div>

                  <button className="ktyp-dropdown-item">
                    <User size={17} />
                    Profile
                  </button>

                  <button className="ktyp-dropdown-item">
                    <Settings size={17} />
                    Settings
                  </button>

                  <div className="ktyp-dropdown-divider"></div>

                  <button
                    className="ktyp-dropdown-item logout"
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              className="ktyp-mobile-button"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>
        </div>

        {/* MOBILE MENU */}
        {isOpen && (
          <div className="ktyp-mobile-menu">

            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`ktyp-mobile-link ${
                    isActive(item.path) ? "active" : ""
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

          </div>
        )}
      </nav>

      {/* DROPDOWN BACKDROP */}
      {showUserMenu && (
        <div
          className="ktyp-dropdown-backdrop"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </>
  );
}
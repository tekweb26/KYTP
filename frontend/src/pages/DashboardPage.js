
import React, { useEffect, useState } from "react";
import "./DashboardPage.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

import { invoiceAPI, paymentAPI } from "../api/api";
import toast from "react-hot-toast";

export default function DashboardPage({ user }) {

  /* =====================================================
     STATES
  ===================================================== */

  const [loading, setLoading] = useState(true);

  const [invoices, setInvoices] = useState([]);

  const [payments, setPayments] = useState([]);

  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPayments: 0,
    paidAmount: 0,
    pendingAmount: 0,
    outstandingAmount: 0,
    gstLiability: 0,
  });


  /* =====================================================
     DUMMY SALES + GST DATA
  ===================================================== */

  const gstChartData = [
    {
      month: "Jan",
      sales: 500000,
      gstCollected: 90000,
      gstPaid: 70000,
    },
    {
      month: "Feb",
      sales: 600000,
      gstCollected: 108000,
      gstPaid: 90000,
    },
    {
      month: "Mar",
      sales: 700000,
      gstCollected: 126000,
      gstPaid: 110000,
    },
    {
      month: "Apr",
      sales: 550000,
      gstCollected: 99000,
      gstPaid: 85000,
    },
    {
      month: "May",
      sales: 800000,
      gstCollected: 144000,
      gstPaid: 120000,
    },
    {
      month: "Jun",
      sales: 750000,
      gstCollected: 135000,
      gstPaid: 115000,
    },
  ];


  /* =====================================================
     DUMMY INVOICE / PAYMENT CHART
  ===================================================== */

  const monthlyData = [
    {
      month: "Jan",
      invoices: 4,
      payments: 3,
      revenue: 45000,
    },
    {
      month: "Feb",
      invoices: 3,
      payments: 2,
      revenue: 38000,
    },
    {
      month: "Mar",
      invoices: 2,
      payments: 2,
      revenue: 32000,
    },
    {
      month: "Apr",
      invoices: 5,
      payments: 4,
      revenue: 55000,
    },
  ];


  /* =====================================================
     GET USER NAME
  ===================================================== */

  const getUserName = () => {

    if (user?.name) {
      return user.name;
    }

    if (user?.username) {
      return user.username;
    }

    if (user?.fullName) {
      return user.fullName;
    }

    if (user?.email) {
      return user.email.split("@")[0];
    }

    try {

      const savedUser = JSON.parse(
        localStorage.getItem("user")
      );

      if (savedUser?.name) {
        return savedUser.name;
      }

      if (savedUser?.username) {
        return savedUser.username;
      }

      if (savedUser?.fullName) {
        return savedUser.fullName;
      }

      if (savedUser?.email) {
        return savedUser.email.split("@")[0];
      }

    } catch (error) {

      console.log(
        "Unable to read user from localStorage"
      );

    }

    return "User";
  };


  /* =====================================================
     FORMAT MONEY
  ===================================================== */

  const formatAmount = (amount) => {

    return Number(
      amount || 0
    ).toLocaleString("en-IN");

  };


  /* =====================================================
     LOAD DASHBOARD DATA
  ===================================================== */

  useEffect(() => {

    loadDashboard();

  }, []);


  const loadDashboard = async () => {

    try {

      let invoiceData = [];

      let paymentData = [];


      /* =================================================
         LOAD INVOICES
      ================================================= */

      try {

        const invoiceResponse =
          await invoiceAPI.list();

        const responseData =
          invoiceResponse?.data;


        /*
          Backend can return:

          1. [ ... ]

          OR

          2. { invoices: [ ... ] }

          OR

          3. { data: [ ... ] }
        */

        if (Array.isArray(responseData)) {

          invoiceData = responseData;

        } else if (
          Array.isArray(
            responseData?.invoices
          )
        ) {

          invoiceData =
            responseData.invoices;

        } else if (
          Array.isArray(
            responseData?.data
          )
        ) {

          invoiceData =
            responseData.data;

        } else {

          invoiceData = [];

        }

      } catch (error) {

        console.log(
          "Invoice API unavailable:",
          error
        );

        invoiceData = [];

      }


      /* =================================================
         LOAD PAYMENTS
      ================================================= */

      try {

        const paymentResponse =
          await paymentAPI.list();

        const responseData =
          paymentResponse?.data;


        if (Array.isArray(responseData)) {

          paymentData = responseData;

        } else if (
          Array.isArray(
            responseData?.payments
          )
        ) {

          paymentData =
            responseData.payments;

        } else if (
          Array.isArray(
            responseData?.data
          )
        ) {

          paymentData =
            responseData.data;

        } else {

          paymentData = [];

        }

      } catch (error) {

        /*
          Payments API नसल्यास किंवा
          /api/payments 404 असल्यास
          Dashboard crash होऊ नये.
        */

        console.log(
          "Payment API unavailable:",
          error
        );

        paymentData = [];

      }


      /* =================================================
         SET RECENT DATA
      ================================================= */

      setInvoices(
        Array.isArray(invoiceData)
          ? invoiceData.slice(0, 5)
          : []
      );


      setPayments(
        Array.isArray(paymentData)
          ? paymentData.slice(0, 5)
          : []
      );


      /* =================================================
         CALCULATE STATS
      ================================================= */

      const totalInvoices =
        Array.isArray(invoiceData)
          ? invoiceData.length
          : 0;


      const totalPayments =
        Array.isArray(paymentData)
          ? paymentData.length
          : 0;


      const invoiceTotal =
        Array.isArray(invoiceData)
          ? invoiceData.reduce(
              (sum, invoice) =>
                sum +
                Number(
                  invoice?.total_amount ||
                  invoice?.totalAmount ||
                  invoice?.amount ||
                  0
                ),
              0
            )
          : 0;


      const paidAmount =
        Array.isArray(paymentData)
          ? paymentData.reduce(
              (sum, payment) =>
                sum +
                Number(
                  payment?.amount || 0
                ),
              0
            )
          : 0;


      const outstandingAmount =
        Math.max(
          0,
          invoiceTotal - paidAmount
        );


      const gstLiability =
        invoiceTotal * 0.18;


      setStats({

        totalInvoices,

        totalPayments,

        paidAmount,

        pendingAmount:
          invoiceTotal,

        outstandingAmount,

        gstLiability,

      });


    } catch (error) {

      console.error(
        "Dashboard error:",
        error
      );

      toast.error(
        "Unable to load dashboard"
      );

    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="dashboard-loading">

        <div className="loading-spinner"></div>

        <p>
          Loading dashboard...
        </p>

      </div>

    );

  }


  /* =====================================================
     DASHBOARD UI
  ===================================================== */

  return (

    <div className="dashboard-page">


      {/* =================================================
          WELCOME
      ================================================= */}

      <section className="dashboard-welcome">

        <h1>
          Welcome back, {getUserName()}!
        </h1>

        <p>
          Here's your GST compliance overview.
        </p>

      </section>


      {/* =================================================
          MAIN CONTAINER
      ================================================= */}

      <main className="dashboard-container">


        {/* =================================================
            SALES + GST CHART
        ================================================= */}

        <section className="gst-chart-card">

          <div className="gst-chart-header">

            <div>

              <h2>
                📊 Sales & GST Overview
              </h2>

              <p>
                Monthly sales, GST collected and GST paid
              </p>

            </div>

          </div>


          <div className="gst-chart-wrapper">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={gstChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fill: "#6b7280",
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#6b7280",
                  }}
                  tickFormatter={(value) =>
                    `₹${value / 1000}K`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Legend />


                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />


                <Line
                  type="monotone"
                  dataKey="gstCollected"
                  name="GST Collected"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />


                <Line
                  type="monotone"
                  dataKey="gstPaid"
                  name="GST Paid"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </section>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="dashboard-stats">


          {/* TOTAL INVOICES */}

          <div className="stat-card">

            <div className="stat-card-content">

              <div>

                <div className="stat-card-title">
                  Total Invoices
                </div>

                <div className="stat-card-value">
                  {stats.totalInvoices}
                </div>

              </div>

              <div className="stat-icon blue-icon">

                <FileText size={24} />

              </div>

            </div>

          </div>


          {/* PAYMENTS */}

          <div className="stat-card">

            <div className="stat-card-content">

              <div>

                <div className="stat-card-title">
                  Payments Made
                </div>

                <div className="stat-card-value">
                  {stats.totalPayments}
                </div>

              </div>

              <div className="stat-icon green-icon">

                <CheckCircle size={24} />

              </div>

            </div>

          </div>


          {/* PAID */}

          <div className="stat-card">

            <div className="stat-card-content">

              <div>

                <div className="stat-card-title">
                  Paid Amount
                </div>

                <div className="stat-card-value green-text">
                  ₹{formatAmount(
                    stats.paidAmount
                  )}
                </div>

              </div>

              <div className="stat-icon green-icon">

                <TrendingUp size={24} />

              </div>

            </div>

          </div>


          {/* PENDING */}

          <div className="stat-card">

            <div className="stat-card-content">

              <div>

                <div className="stat-card-title">
                  Pending Amount
                </div>

                <div className="stat-card-value orange-text">
                  ₹{formatAmount(
                    stats.pendingAmount
                  )}
                </div>

              </div>

              <div className="stat-icon orange-icon">

                <Clock size={24} />

              </div>

            </div>

          </div>


          {/* OUTSTANDING */}

          <div className="stat-card">

            <div className="stat-card-content">

              <div>

                <div className="stat-card-title">
                  Outstanding
                </div>

                <div className="stat-card-value red-text">
                  ₹{formatAmount(
                    stats.outstandingAmount
                  )}
                </div>

              </div>

              <div className="stat-icon red-icon">

                <AlertCircle size={24} />

              </div>

            </div>

          </div>


          {/* GST */}

          <div className="stat-card">

            <div className="stat-card-content">

              <div>

                <div className="stat-card-title">
                  GST Liability
                </div>

                <div className="stat-card-value purple-text">
                  ₹{formatAmount(
                    stats.gstLiability
                  )}
                </div>

              </div>

              <div className="stat-icon purple-icon">

                <TrendingUp size={24} />

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            SECONDARY CHARTS
        ================================================= */}

        <section className="dashboard-charts">


          {/* INVOICE VS PAYMENT */}

          <div className="chart-card">

            <h2>
              📈 Invoices vs Payments
            </h2>

            <p>
              Monthly comparison
            </p>


            <div className="secondary-chart-wrapper">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={monthlyData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="month"
                  />

                  <YAxis />

                  <Tooltip />

                  <Legend />


                  <Line
                    type="monotone"
                    dataKey="invoices"
                    name="Invoices"
                    stroke="#2563eb"
                    strokeWidth={3}
                  />


                  <Line
                    type="monotone"
                    dataKey="payments"
                    name="Payments"
                    stroke="#16a34a"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* MONTHLY REVENUE */}

          <div className="chart-card">

            <h2>
              💰 Monthly Revenue
            </h2>

            <p>
              Revenue over the last 4 months
            </p>


            <div className="secondary-chart-wrapper">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={monthlyData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="month"
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(
                        value
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                  <Legend />


                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        </section>


        {/* =================================================
            RECENT DATA
        ================================================= */}

        <section className="dashboard-recent">


          {/* RECENT INVOICES */}

          <div className="recent-card">

            <h2>
              📋 Recent Invoices
            </h2>

            <p className="recent-description">
              Latest transactions
            </p>


            {invoices.length > 0 ? (

              <div>

                {invoices.map(
                  (invoice) => (

                    <div
                      className="recent-item"
                      key={
                        invoice.id ||
                        invoice._id
                      }
                    >

                      <div>

                        <div className="recent-title">

                          {invoice.vendor_name ||
                            invoice.customer_name ||
                            "Unknown Vendor"}

                        </div>

                        <div className="recent-subtitle">

                          Invoice #
                          {invoice.invoice_number ||
                            invoice.invoiceNumber ||
                            invoice.id ||
                            invoice._id ||
                            "N/A"}

                        </div>

                      </div>


                      <div className="recent-right">

                        <div className="recent-amount">

                          ₹
                          {formatAmount(
                            invoice.total_amount ||
                            invoice.totalAmount ||
                            invoice.amount
                          )}

                        </div>

                        <span className="status-badge">

                          {invoice.status ||
                            "Pending"}

                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="empty-state">

                <FileText size={35} />

                <p>
                  No invoices yet
                </p>

              </div>

            )}

          </div>


          {/* RECENT PAYMENTS */}

          <div className="recent-card">

            <h2>
              ✅ Recent Payments
            </h2>

            <p className="recent-description">
              Payment transactions
            </p>


            {payments.length > 0 ? (

              <div>

                {payments.map(
                  (payment) => (

                    <div
                      className="recent-item"
                      key={
                        payment.id ||
                        payment._id
                      }
                    >

                      <div>

                        <div className="recent-title">

                          Ref:{" "}

                          {payment.reference_id ||
                            payment.referenceId ||
                            "N/A"}

                        </div>

                        <div className="recent-subtitle">

                          {payment.payment_method ||
                            payment.paymentMethod ||
                            "Payment"}

                        </div>

                      </div>


                      <div className="recent-right">

                        <div className="recent-amount green-text">

                          ₹
                          {formatAmount(
                            payment.amount
                          )}

                        </div>

                        <span className="status-badge">

                          {payment.status ||
                            "Pending"}

                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="empty-state">

                <CreditCard size={35} />

                <p>
                  No payments yet
                </p>

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="quick-actions">

          <h2>
            🚀 Quick Actions
          </h2>


          <div className="quick-actions-grid">

            <button>
              ➕ Create Invoice
            </button>

            <button>
              💳 Record Payment
            </button>

            <button>
              📤 Export Report
            </button>

            <button>
              📞 Get Support
            </button>

          </div>

        </section>


      </main>

    </div>

  );

}

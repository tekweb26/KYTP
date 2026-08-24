import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { gstAPI, invoiceAPI } from "../api/api";
import toast from "react-hot-toast";
import { Download } from "lucide-react";

import "./GSTPage.css";


const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];


export default function GSTPage() {

  const [summary, setSummary] = useState(null);

  const [invoices, setInvoices] = useState([]);

  const [chartData, setChartData] = useState([]);

  const [loading, setLoading] = useState(true);


  /* =====================================================
     LOAD GST DATA
  ===================================================== */

  useEffect(() => {
    loadGSTData();
  }, []);


  const loadGSTData = async () => {

    try {

      const now = new Date();

      const {
        data: summaryData
      } = await gstAPI.monthlySummary(
        now.getMonth() + 1,
        now.getFullYear()
      );


      const {
        data: invoicesData
      } = await invoiceAPI.list();


      setSummary(summaryData);

      setInvoices(invoicesData);


      const taxBreakdown = [

        {
          name: "SGST",
          value: summaryData.sgst || 0,
        },

        {
          name: "CGST",
          value: summaryData.cgst || 0,
        },

        {
          name: "IGST",
          value: summaryData.igst || 0,
        },

      ].filter(
        (item) => item.value > 0
      );


      setChartData(taxBreakdown);

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to load GST data"
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

      <div className="gst-loading">

        <div className="gst-loader"></div>

        <p>
          Loading GST data...
        </p>

      </div>

    );

  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="gst-page">

      <div className="gst-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="gst-header">

          <div>

            <h1>
              GST Dashboard
            </h1>

            <p>
              Overview of your GST, tax liability and invoices.
            </p>

          </div>


          <button className="export-button">

            <Download size={18} />

            Export Report

          </button>

        </div>



        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="gst-summary-grid">


          {/* TAXABLE */}

          <div className="gst-summary-card">

            <div className="summary-label">
              Total Taxable Amount
            </div>

            <div className="summary-value">
              ₹{summary?.taxable_amount || 0}
            </div>

          </div>


          {/* SGST */}

          <div className="gst-summary-card sgst-card">

            <div className="summary-label">
              SGST (9%)
            </div>

            <div className="summary-value">
              ₹{summary?.sgst || 0}
            </div>

          </div>


          {/* CGST */}

          <div className="gst-summary-card cgst-card">

            <div className="summary-label">
              CGST (9%)
            </div>

            <div className="summary-value">
              ₹{summary?.cgst || 0}
            </div>

          </div>


          {/* TOTAL TAX */}

          <div className="gst-summary-card liability-card">

            <div className="summary-label">
              Total Tax Liability
            </div>

            <div className="summary-value">
              ₹{summary?.total_tax || 0}
            </div>

          </div>

        </div>



        {/* =================================================
            CHARTS
        ================================================= */}

        <div className="gst-charts-grid">


          {/* =================================================
              PIE CHART
          ================================================= */}

          <div className="gst-chart-card">

            <div className="chart-header">

              <h2>
                Tax Breakdown
              </h2>

              <p>
                Distribution of GST
              </p>

            </div>


            <div className="chart-container">

              {chartData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <PieChart>

                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({
                        name,
                        value
                      }) =>
                        `${name}: ₹${value}`
                      }
                      outerRadius={90}
                      dataKey="value"
                    >

                      {chartData.map(
                        (entry, index) => (

                          <Cell
                            key={`cell-${index}`}
                            fill={
                              COLORS[index]
                            }
                          />

                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        `₹${value}`
                      }
                    />

                  </PieChart>

                </ResponsiveContainer>

              ) : (

                <div className="no-chart-data">
                  No GST data available
                </div>

              )}

            </div>

          </div>



          {/* =================================================
              BAR CHART
          ================================================= */}

          <div className="gst-chart-card">

            <div className="chart-header">

              <h2>
                Monthly Comparison
              </h2>

              <p>
                SGST, CGST and IGST
              </p>

            </div>


            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart
                  data={[

                    {
                      month: "SGST",
                      amount:
                        summary?.sgst || 0,
                    },

                    {
                      month: "CGST",
                      amount:
                        summary?.cgst || 0,
                    },

                    {
                      month: "IGST",
                      amount:
                        summary?.igst || 0,
                    },

                  ]}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="month"
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="amount"
                    fill="#3b82f6"
                    radius={[
                      6,
                      6,
                      0,
                      0
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>



        {/* =================================================
            INVOICE TABLE
        ================================================= */}

        <div className="invoice-table-card">

          <div className="table-header">

            <div>

              <h2>
                Invoices by Tax Type
              </h2>

              <p>
                Tax details of your invoices
              </p>

            </div>

          </div>


          {invoices.length > 0 ? (

            <div className="table-wrapper">

              <table className="gst-table">

                <thead>

                  <tr>

                    <th>
                      Vendor
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Tax Type
                    </th>

                    <th>
                      Tax Amount
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {invoices.map(
                    (invoice) => {

                      const isIntrastate =
                        invoice.vendor_gstin
                          ?.substring(0, 2) ===
                        summary?.payer_state;


                      const taxType =
                        isIntrastate
                          ? "SGST + CGST"
                          : "IGST";


                      return (

                        <tr
                          key={invoice.id}
                        >

                          <td>
                            {invoice.vendor_name ||
                              "N/A"}
                          </td>

                          <td>
                            ₹
                            {invoice.total_amount ||
                              0}
                          </td>

                          <td>

                            <span
                              className={
                                taxType ===
                                "IGST"
                                  ? "tax-badge igst"
                                  : "tax-badge intrastate"
                              }
                            >

                              {taxType}

                            </span>

                          </td>

                          <td>
                            ₹
                            {invoice.tax_amount ||
                              0}
                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="no-invoices">

              No invoices available.

            </div>

          )}

        </div>


      </div>

    </div>

  );
}
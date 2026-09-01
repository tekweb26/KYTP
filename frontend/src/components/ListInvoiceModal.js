import React, { useMemo, useState } from "react";
import {
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";

import "./ListInvoiceModal.css";

export default function ListInvoiceModal({
  invoices = [],
  onView,
  onEdit,
  onDelete,
}) {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  /* =====================================================
     GROUP INVOICES
  ===================================================== */

  const groupedInvoices = useMemo(() => {
    return invoices.reduce((acc, invoice) => {
      if (!invoice) return acc;

      const invoiceDate = new Date(
        invoice.invoice_date ||
          invoice.createdAt
      );

      const validDate =
        !Number.isNaN(invoiceDate.getTime());

      const year =
        invoice.invoice_year ||
        (validDate
          ? invoiceDate.getFullYear()
          : new Date().getFullYear());

      const month =
        invoice.invoice_month ||
        (validDate
          ? invoiceDate.getMonth() + 1
          : new Date().getMonth() + 1);

      if (!acc[year]) {
        acc[year] = {};
      }

      if (!acc[year][month]) {
        acc[year][month] = [];
      }

      acc[year][month].push(invoice);

      return acc;
    }, {});
  }, [invoices]);

  /* =====================================================
     YEARS
  ===================================================== */

  const sortedYears = Object.keys(
    groupedInvoices
  )
    .map(Number)
    .sort((a, b) => b - a);

  /* =====================================================
     MONTHS FOR SELECTED YEAR
  ===================================================== */

  const availableMonths = selectedYear
    ? Object.keys(
        groupedInvoices[selectedYear] || {}
      )
        .map(Number)
        .sort((a, b) => a - b)
    : [];

  /* =====================================================
     SELECT YEAR
  ===================================================== */

  const handleYearChange = (e) => {
    const year = e.target.value;

    setSelectedYear(year);
    setSelectedMonth("");
  };

  /* =====================================================
     SELECT MONTH
  ===================================================== */

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  /* =====================================================
     FORMAT AMOUNT
  ===================================================== */

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const getInvoiceDate = (invoice) => {
    if (!invoice?.invoice_date) {
      return "N/A";
    }

    const date = new Date(
      invoice.invoice_date
    );

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-IN");
  };

  /* =====================================================
     SELECTED MONTH INVOICES
  ===================================================== */

  const monthInvoices =
    selectedYear && selectedMonth
      ? groupedInvoices[selectedYear]?.[
          selectedMonth
        ] || []
      : [];

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="invoice-list-card">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="invoice-list-header">

        <div>
          <h2>Invoice History</h2>

          <p>
            Select a year and month to view invoices
          </p>
        </div>

      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="invoice-history-filters">

        {/* YEAR */}

        <div className="invoice-history-field">

          <label htmlFor="invoice-year">
            Select Year
          </label>

          <select
            id="invoice-year"
            value={selectedYear}
            onChange={handleYearChange}
            className="invoice-history-select"
          >

            <option value="">
              Select Year
            </option>

            {sortedYears.map((year) => (
              <option
                key={year}
                value={year}
              >
                {year}
              </option>
            ))}

          </select>

        </div>


        {/* MONTH */}

        <div className="invoice-history-field">

          <label htmlFor="invoice-month">
            Select Month
          </label>

          <select
            id="invoice-month"
            value={selectedMonth}
            onChange={handleMonthChange}
            disabled={!selectedYear}
            className="invoice-history-select"
          >

            <option value="">
              {selectedYear
                ? "Select Month"
                : "Select Year First"}
            </option>

            {availableMonths.map((month) => (
              <option
                key={month}
                value={month}
              >
                {monthNames[month - 1]}
              </option>
            ))}

          </select>

        </div>

      </div>


      {/* =================================================
          SELECTED PERIOD
      ================================================= */}

      {selectedYear && selectedMonth && (
        <div className="invoice-selected-period">

          <span>
            {monthNames[selectedMonth - 1]}{" "}
            {selectedYear}
          </span>

          <strong>
            {monthInvoices.length}{" "}
            invoice
            {monthInvoices.length !== 1
              ? "s"
              : ""}
          </strong>

        </div>
      )}


      {/* =================================================
          NO MONTH SELECTED
      ================================================= */}

      {!selectedMonth && (
        <div className="invoice-period-empty">

          <strong>
            Select a month
          </strong>

          <p>
            Choose a month to view your invoices.
          </p>

        </div>
      )}


      {/* =================================================
          INVOICE TABLE
      ================================================= */}

      {selectedYear &&
        selectedMonth &&
        monthInvoices.length > 0 && (

          <div className="invoice-table-wrapper">

            <table className="invoice-table">

              <thead>
                <tr>

                  <th>Invoice No.</th>

                  <th>Date</th>

                  <th>Vendor</th>

                  <th>Amount</th>

                  <th>GST</th>

                  <th>Grand Total</th>

                  <th>Status</th>

                  <th>Actions</th>

                </tr>
              </thead>


              <tbody>

                {monthInvoices.map(
                  (invoice) => (

                    <tr
                      key={
                        invoice._id ||
                        invoice.id ||
                        invoice.invoice_number
                      }
                    >

                      {/* Invoice Number */}

                      <td>
                        <strong className="invoice-number-cell">
                          {
                            invoice.invoice_number ||
                            "-"
                          }
                        </strong>
                      </td>


                      {/* Date */}

                      <td>
                        {getInvoiceDate(invoice)}
                      </td>


                      {/* Vendor */}

                      <td>

                        <div className="invoice-vendor-name">
                          {
                            invoice.vendor_name ||
                            "-"
                          }
                        </div>

                        {invoice.vendor_has_gst &&
                          invoice.vendor_gstin && (
                            <div className="invoice-vendor-gstin">
                              {
                                invoice.vendor_gstin
                              }
                            </div>
                          )}

                        {!invoice.vendor_has_gst && (
                          <div className="invoice-vendor-gstin">
                            {
                              invoice.vendor_state ||
                              "-"
                            }
                          </div>
                        )}

                      </td>


                      {/* Amount */}

                      <td>

                        <span className="invoice-amount">
                          ₹
                          {formatAmount(
                            invoice.total_amount
                          )}
                        </span>

                      </td>


                      {/* GST */}

                      <td>

                        {invoice.tax_type ===
                        "CGST_SGST" ? (

                          <div className="invoice-tax">

                            <div>
                              CGST (
                              {
                                invoice.cgst_rate ||
                                0
                              }
                              %)
                            </div>

                            <div>
                              SGST (
                              {
                                invoice.sgst_rate ||
                                0
                              }
                              %)
                            </div>

                          </div>

                        ) : (

                          <div className="invoice-tax">

                            IGST (
                            {
                              invoice.igst_rate ||
                              0
                            }
                            %)

                          </div>

                        )}

                      </td>


                      {/* Grand Total */}

                      <td>

                        <strong className="invoice-grand-total">
                          ₹
                          {formatAmount(
                            invoice.grand_total
                          )}
                        </strong>

                      </td>


                      {/* Status */}

                      <td>

                        <span className="invoice-status">
                          {
                            invoice.status ||
                            "Pending"
                          }
                        </span>

                      </td>


                      {/* Actions */}

                      <td>

                        <div className="invoice-actions">

                          <button
                            type="button"
                            className="invoice-action-btn invoice-view-btn"
                            title="View Invoice"
                            onClick={() =>
                              onView?.(invoice)
                            }
                          >
                            <Eye size={17} />
                          </button>


                          <button
                            type="button"
                            className="invoice-action-btn invoice-edit-btn"
                            title="Edit Invoice"
                            onClick={() =>
                              onEdit?.(invoice)
                            }
                          >
                            <Edit2 size={17} />
                          </button>


                          <button
                            type="button"
                            className="invoice-action-btn invoice-delete-btn"
                            title="Delete Invoice"
                            onClick={() =>
                              onDelete?.(invoice)
                            }
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>
        )}


      {/* =================================================
          NO INVOICE FOR MONTH
      ================================================= */}

      {selectedYear &&
        selectedMonth &&
        monthInvoices.length === 0 && (

          <div className="invoice-period-empty">

            <strong>
              No invoices found
            </strong>

            <p>
              There are no invoices for{" "}
              {monthNames[selectedMonth - 1]}{" "}
              {selectedYear}.
            </p>

          </div>
        )}

    </div>
  );
}
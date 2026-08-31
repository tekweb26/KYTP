
import React, { useEffect, useState } from "react";

import { invoiceAPI } from "../api/api";

import toast from "react-hot-toast";

import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  X,
  Printer,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

import "./InvoicesPage.css";

export default function InvoicesPage() {
  /* =====================================================
     STATE
  ===================================================== */

  const [invoices, setInvoices] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedYear, setSelectedYear] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(null);

  /* =====================================================
     FORM
  ===================================================== */

  const emptyForm = {
    invoice_number: "",
    invoice_date: "",
    vendor_name: "",
    vendor_has_gst: "",
    vendor_gstin: "",
    vendor_state: "",
    total_amount: "",
    gst_rate: "",
    description: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const [gstError, setGstError] = useState("");

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
     LOAD INVOICES
  ===================================================== */

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await invoiceAPI.list();

      const data = response.data;

      if (Array.isArray(data)) {
        setInvoices(data);
      } else if (Array.isArray(data?.invoices)) {
        setInvoices(data.invoices);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error("Invoice Load Error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    let finalValue = value;

    if (name === "vendor_gstin") {
      finalValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 15);

      validateVendorGST(finalValue);
    }

    if (name === "total_amount") {
      finalValue = value.replace(/[^0-9.]/g, "");
    }

    if (name === "gst_rate") {
      finalValue = value.replace(/[^0-9.]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  /* =====================================================
     GST VALIDATION
  ===================================================== */

  const validateVendorGST = (gst) => {
    if (!gst) {
      setGstError("");
      return false;
    }

    if (gst.length < 15) {
      setGstError(
        "GST number must be 15 characters"
      );
      return false;
    }

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstRegex.test(gst)) {
      setGstError(
        "Please enter a valid GST number"
      );
      return false;
    }

    setGstError("");

    return true;
  };

  /* =====================================================
     RESET FORM
  ===================================================== */

  const resetForm = () => {
    setFormData({ ...emptyForm });

    setGstError("");

    setEditingId(null);
  };

  /* =====================================================
     OPEN EDIT
  ===================================================== */

  const handleEdit = (invoice) => {
    if (!invoice) return;

    let invoiceDate = "";

    if (invoice.invoice_date) {
      invoiceDate = new Date(invoice.invoice_date)
        .toISOString()
        .split("T")[0];
    }

    setFormData({
      invoice_number:
        invoice.invoice_number || "",

      invoice_date: invoiceDate,

      vendor_name:
        invoice.vendor_name || "",

      vendor_has_gst:
        invoice.vendor_has_gst ? "yes" : "no",

      vendor_gstin:
        invoice.vendor_gstin || "",

      vendor_state:
        invoice.vendor_state || "",

      total_amount:
        invoice.total_amount !== undefined &&
        invoice.total_amount !== null
          ? String(invoice.total_amount)
          : "",

      gst_rate:
        invoice.gst_rate !== undefined &&
        invoice.gst_rate !== null
          ? String(invoice.gst_rate)
          : "",

      description:
        invoice.description || "",
    });

    setEditingId(invoice._id);

    setGstError("");

    setShowForm(true);

    // Edit form दिसण्यासाठी वर नेणे
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================================
     SUBMIT CREATE / UPDATE
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* ---------------------------------------------
       BASIC VALIDATION
    --------------------------------------------- */

    if (!formData.invoice_number.trim()) {
      toast.error("Please enter invoice number");
      return;
    }

    if (!formData.invoice_date) {
      toast.error("Please select invoice date");
      return;
    }

    if (!formData.vendor_name.trim()) {
      toast.error("Please enter vendor name");
      return;
    }

    if (formData.vendor_has_gst === "") {
      toast.error(
        "Please select whether vendor has GST"
      );
      return;
    }

    /* ---------------------------------------------
       GST VALIDATION
    --------------------------------------------- */

    if (formData.vendor_has_gst === "yes") {
      if (
        !validateVendorGST(
          formData.vendor_gstin
        )
      ) {
        toast.error(
          "Please enter valid vendor GST number"
        );
        return;
      }
    }

    /* ---------------------------------------------
       STATE VALIDATION
    --------------------------------------------- */

    if (
      formData.vendor_has_gst === "no" &&
      !formData.vendor_state
    ) {
      toast.error("Please select vendor state");
      return;
    }

    /* ---------------------------------------------
       AMOUNT VALIDATION
    --------------------------------------------- */

    if (formData.total_amount === "") {
      toast.error("Please enter total amount");
      return;
    }

    const totalAmount = Number(
      formData.total_amount
    );

    if (
      Number.isNaN(totalAmount) ||
      totalAmount <= 0
    ) {
      toast.error(
        "Please enter valid total amount"
      );
      return;
    }

    /* ---------------------------------------------
       GST RATE VALIDATION
    --------------------------------------------- */

    if (formData.gst_rate === "") {
      toast.error("Please enter GST rate");
      return;
    }

    const gstRate = Number(
      formData.gst_rate
    );

    if (
      Number.isNaN(gstRate) ||
      gstRate < 0 ||
      gstRate > 100
    ) {
      toast.error(
        "GST rate must be between 0 and 100"
      );
      return;
    }

    setCreating(true);

    /* ---------------------------------------------
       DATA
    --------------------------------------------- */

    const invoiceData = {
      invoice_number:
        formData.invoice_number.trim(),

      invoice_date:
        formData.invoice_date,

      vendor_name:
        formData.vendor_name.trim(),

      vendor_has_gst:
        formData.vendor_has_gst === "yes",

      vendor_gstin:
        formData.vendor_has_gst === "yes"
          ? formData.vendor_gstin
          : "",

      vendor_state:
        formData.vendor_state,

      total_amount:
        totalAmount,

      gst_rate:
        gstRate,

      description:
        formData.description.trim(),
    };

    try {
      /* ---------------------------------------------
         UPDATE
      --------------------------------------------- */

      if (editingId) {
        const response =
          await invoiceAPI.update(
            editingId,
            invoiceData
          );

        const data = response.data;

        if (
          data?.success === false
        ) {
          toast.error(
            data?.message ||
              "Failed to update invoice"
          );
          return;
        }

        toast.success(
          "Invoice updated successfully"
        );

      } else {
        /* -------------------------------------------
           CREATE
        ------------------------------------------- */

        const response =
          await invoiceAPI.create(
            invoiceData
          );

        const data = response.data;

        if (!data?.success) {
          toast.error(
            data?.message ||
              "Failed to create invoice"
          );
          return;
        }

        toast.success(
          "Invoice created successfully"
        );
      }

      /* ---------------------------------------------
         AFTER SAVE
      --------------------------------------------- */

      resetForm();

      setShowForm(false);

      await loadInvoices();

    } catch (error) {
      console.error(
        editingId
          ? "Invoice Update Error:"
          : "Invoice Create Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          (
            editingId
              ? "Failed to update invoice"
              : "Failed to create invoice"
          )
      );
    } finally {
      setCreating(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = async (id) => {
    if (!id) {
      toast.error("Invoice ID not found");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this invoice?"
    );

    if (!confirmed) return;

    try {
      await invoiceAPI.delete(id);

      toast.success(
        "Invoice deleted successfully"
      );

      /*
       * IMPORTANT:
       * Delete झाल्यावर जुना year/month state
       * ठेवायचा नाही.
       *
       * यामुळे:
       * Cannot read properties of undefined
       * (reading '8')
       * error येणार नाही.
       */

      setSelectedYear(null);
      setSelectedMonth(null);

      setSelectedInvoice(null);

      setShowViewModal(false);

      await loadInvoices();

    } catch (error) {
      console.error(
        "Delete Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to delete invoice"
      );
    }
  };

  /* =====================================================
     AMOUNT FORMAT
  ===================================================== */

  const formatAmount = (amount) => {
    const number = Number(amount || 0);

    return number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  /* =====================================================
     VIEW
  ===================================================== */

  const handleView = (invoice) => {
    if (!invoice) return;

    setSelectedInvoice(invoice);

    setShowViewModal(true);

    document.body.style.overflow = "hidden";
  };

  const closeViewModal = () => {
    setSelectedInvoice(null);

    setShowViewModal(false);

    document.body.style.overflow = "";
  };

  /* =====================================================
     PRINT
  ===================================================== */

  const handlePrint = () => {
    window.print();
  };

  /* =====================================================
     DATE
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

    return date.toLocaleDateString(
      "en-IN"
    );
  };

  /* =====================================================
     GROUP BY YEAR / MONTH
  ===================================================== */

  const groupedInvoices = invoices.reduce(
    (acc, invoice) => {
      if (!invoice) return acc;

      const invoiceDate = new Date(
        invoice.invoice_date ||
          invoice.createdAt
      );

      const year =
        invoice.invoice_year ||
        (
          Number.isNaN(
            invoiceDate.getTime()
          )
            ? new Date().getFullYear()
            : invoiceDate.getFullYear()
        );

      const month =
        invoice.invoice_month ||
        (
          Number.isNaN(
            invoiceDate.getTime()
          )
            ? new Date().getMonth() + 1
            : invoiceDate.getMonth() + 1
        );

      if (!acc[year]) {
        acc[year] = {};
      }

      if (!acc[year][month]) {
        acc[year][month] = [];
      }

      acc[year][month].push(invoice);

      return acc;
    },
    {}
  );

  /* =====================================================
     SORTED YEARS
  ===================================================== */

  const sortedYears = Object.keys(
    groupedInvoices
  )
    .map(Number)
    .sort((a, b) => b - a);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="invoice-loading">
        Loading invoices...
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="invoices-page">

      <div className="invoices-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="invoices-header">

          <div>

            <h1 className="invoices-title">
              Invoices
            </h1>

            <p className="invoices-subtitle">
              Manage your invoices and GST details
            </p>

          </div>

          <button
            type="button"
            onClick={() => {

              if (showForm) {
                resetForm();
              }

              setShowForm(!showForm);

            }}
            className="invoice-primary-btn"
          >

            <Plus size={18} />

            {showForm
              ? "Close Form"
              : "New Invoice"}

          </button>

        </div>


        {/* =================================================
            CREATE / EDIT FORM
        ================================================= */}

        {showForm && (

          <div className="invoice-form-card">

            <h2 className="invoice-form-title">

              {editingId
                ? "Edit Invoice"
                : "Create Invoice"}

            </h2>


            <form onSubmit={handleSubmit}>

              <div className="invoice-form-grid">


                {/* INVOICE NUMBER */}

                <div className="invoice-form-group">

                  <label>
                    Invoice Number
                  </label>

                  <input
                    name="invoice_number"
                    type="text"
                    value={
                      formData.invoice_number
                    }
                    onChange={handleChange}
                    placeholder="Example: INV-001"
                    required
                  />

                </div>


                {/* INVOICE DATE */}

                <div className="invoice-form-group">

                  <label>
                    Invoice Date
                  </label>

                  <input
                    name="invoice_date"
                    type="date"
                    value={
                      formData.invoice_date
                    }
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* VENDOR */}

                <div className="invoice-form-group">

                  <label>
                    Vendor Name
                  </label>

                  <input
                    name="vendor_name"
                    type="text"
                    value={
                      formData.vendor_name
                    }
                    onChange={handleChange}
                    placeholder="Enter vendor name"
                    required
                  />

                </div>


                {/* GST YES NO */}

                <div className="invoice-form-group">

                  <label>
                    Does Vendor Have GST?
                  </label>

                  <div className="kytp-gst-options">

                    <label className="kytp-radio-option">

                      <input
                        type="radio"
                        name="vendor_has_gst"
                        value="yes"
                        checked={
                          formData.vendor_has_gst ===
                          "yes"
                        }
                        onChange={() => {

                          setFormData(
                            (prev) => ({
                              ...prev,

                              vendor_has_gst:
                                "yes",

                              vendor_state:
                                "",
                            })
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
                        name="vendor_has_gst"
                        value="no"
                        checked={
                          formData.vendor_has_gst ===
                          "no"
                        }
                        onChange={() => {

                          setFormData(
                            (prev) => ({
                              ...prev,

                              vendor_has_gst:
                                "no",

                              vendor_gstin:
                                "",
                            })
                          );

                          setGstError("");

                        }}
                      />

                      <span>
                        No
                      </span>

                    </label>

                  </div>

                </div>


                {/* VENDOR GST */}

                {formData.vendor_has_gst ===
                  "yes" && (

                  <div className="invoice-form-group">

                    <label>
                      Vendor GSTIN
                    </label>

                    <input
                      name="vendor_gstin"
                      type="text"
                      value={
                        formData.vendor_gstin
                      }
                      onChange={handleChange}
                      placeholder="Enter 15 digit GSTIN"
                      maxLength={15}
                      autoComplete="off"
                    />

                    {gstError && (

                      <small className="kytp-error-text">
                        {gstError}
                      </small>

                    )}

                    {!gstError &&
                      formData.vendor_gstin.length ===
                        15 && (

                      <small className="kytp-success-text">
                        ✓ Valid GST format
                      </small>

                    )}

                    <small>
                      State will be detected automatically from GSTIN.
                    </small>

                  </div>

                )}


                {/* VENDOR STATE */}

                {formData.vendor_has_gst ===
                  "no" && (

                  <div className="invoice-form-group">

                    <label>
                      Vendor State
                    </label>

                    <select
                      name="vendor_state"
                      value={
                        formData.vendor_state
                      }
                      onChange={handleChange}
                      required
                    >

                      <option value="">
                        Select Vendor State
                      </option>

                      {states.map(
                        (state) => (

                          <option
                            key={state}
                            value={state}
                          >
                            {state}
                          </option>

                        )
                      )}

                    </select>

                    <small>
                      Vendor GST नसल्यामुळे State manually select करा.
                    </small>

                  </div>

                )}


                {/* AMOUNT */}

                <div className="invoice-form-group">

                  <label>
                    Total Amount
                  </label>

                  <input
                    name="total_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formData.total_amount
                    }
                    onChange={handleChange}
                    placeholder="Enter total amount"
                    required
                  />

                </div>


                {/* GST RATE */}

                <div className="invoice-form-group">

                  <label>
                    GST Rate (%)
                  </label>

                  <input
                    name="gst_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      formData.gst_rate
                    }
                    onChange={handleChange}
                    placeholder="Example: 18"
                    required
                  />

                </div>

              </div>


              {/* TAX INFO */}

              <div className="invoice-tax-info">

                <strong>
                  GST Calculation
                </strong>

                <span>
                  Same state → CGST + SGST
                </span>

                <span>
                  Different state → IGST
                </span>

              </div>


              {/* DESCRIPTION */}

              <div className="invoice-form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder="Enter invoice description"
                  rows="3"
                />

              </div>


              {/* ACTIONS */}

              <div className="invoice-form-actions">

                <button
                  type="submit"
                  className="invoice-primary-btn"
                  disabled={creating}
                >

                  {creating
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                      ? "Update Invoice"
                      : "Create"}

                </button>


                <button
                  type="button"
                  className="invoice-secondary-btn"
                  onClick={() => {

                    resetForm();

                    setShowForm(false);

                  }}
                  disabled={creating}
                >

                  Cancel

                </button>

              </div>

            </form>

          </div>
        )}


        {/* =================================================
            YEAR VIEW
        ================================================= */}

        {!selectedYear && (

          <div className="invoice-table-card">

            <div className="invoice-month-header">

              <h2>
                Invoice History
              </h2>

              <p>
                Select a year to view invoices by month
              </p>

            </div>


            {sortedYears.length === 0 ? (

              <div className="invoice-empty">

                No invoices found.

                <br />

                Click{" "}

                <strong>
                  New Invoice
                </strong>{" "}

                to create your first invoice.

              </div>

            ) : (

              <div className="invoice-year-list">

                {sortedYears.map(
                  (year) => (

                    <button
                      key={year}
                      type="button"
                      className="invoice-year-item"
                      onClick={() =>
                        setSelectedYear(year)
                      }
                    >

                      <span>
                        {year}
                      </span>

                      <ChevronRight
                        size={20}
                      />

                    </button>

                  )
                )}

              </div>

            )}

          </div>
        )}


        {/* =================================================
            MONTH VIEW
        ================================================= */}

        {selectedYear &&
          !selectedMonth &&
          groupedInvoices[selectedYear] && (

          <div className="invoice-table-card">

            <div className="invoice-breadcrumb">

              <button
                type="button"
                onClick={() =>
                  setSelectedYear(null)
                }
              >

                <ArrowLeft
                  size={18}
                />

                Back

              </button>

              <h2>
                {selectedYear}
              </h2>

            </div>


            <div className="invoice-month-list">

              {Object.keys(
                groupedInvoices[selectedYear] || {}
              )
                .map(Number)
                .sort(
                  (a, b) => b - a
                )
                .map(
                  (month) => {

                    const monthInvoices =
                      groupedInvoices[
                        selectedYear
                      ]?.[month] || [];


                    return (

                      <button
                        key={month}
                        type="button"
                        className="invoice-month-item"
                        onClick={() =>
                          setSelectedMonth(month)
                        }
                      >

                        <div>

                          <strong>
                            {
                              monthNames[
                                month - 1
                              ] ||
                              "Unknown Month"
                            }
                          </strong>

                          <small>
                            {
                              monthInvoices.length
                            }{" "}
                            invoice
                            {monthInvoices.length !== 1
                              ? "s"
                              : ""}
                          </small>

                        </div>

                        <ChevronRight
                          size={20}
                        />

                      </button>

                    );
                  }
                )}

            </div>

          </div>
        )}


        {/* =================================================
            INVOICES OF SELECTED MONTH
        ================================================= */}

        {selectedYear &&
          selectedMonth &&
          groupedInvoices[selectedYear]?.[
            selectedMonth
          ] && (

          <div className="invoice-table-card">

            <div className="invoice-breadcrumb">

              <button
                type="button"
                onClick={() =>
                  setSelectedMonth(null)
                }
              >

                <ArrowLeft
                  size={18}
                />

                Back

              </button>


              <div>

                <h2>

                  {
                    monthNames[
                      selectedMonth - 1
                    ] ||
                    "Unknown Month"
                  }{" "}

                  {selectedYear}

                </h2>

                <p>

                  {
                    groupedInvoices[
                      selectedYear
                    ]?.[selectedMonth]
                      ?.length || 0
                  }{" "}

                  invoices

                </p>

              </div>

            </div>


            <div className="invoice-table-wrapper">

              <table className="invoice-table">

                <thead>

                  <tr>

                    <th>
                      Invoice No.
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Vendor
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      GST
                    </th>

                    <th>
                      Grand Total
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {(
                    groupedInvoices[
                      selectedYear
                    ]?.[selectedMonth] || []
                  ).map(
                    (invoice) => (

                      <tr
                        key={
                          invoice._id ||
                          invoice.id ||
                          invoice.invoice_number
                        }
                      >

                        {/* INVOICE NUMBER */}

                        <td>

                          <strong>
                            {
                              invoice.invoice_number ||
                              "-"
                            }
                          </strong>

                        </td>


                        {/* DATE */}

                        <td>

                          {
                            getInvoiceDate(
                              invoice
                            )
                          }

                        </td>


                        {/* VENDOR */}

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


                        {/* AMOUNT */}

                        <td>

                          <span className="invoice-amount">

                            ₹
                            {
                              formatAmount(
                                invoice.total_amount
                              )
                            }

                          </span>

                        </td>


                        {/* GST */}

                        <td>

                          {invoice.tax_type ===
                          "CGST_SGST" ? (

                            <div>

                              <div>

                                CGST (
                                {
                                  invoice.cgst_rate ||
                                  0
                                }%)

                              </div>

                              <div>

                                SGST (
                                {
                                  invoice.sgst_rate ||
                                  0
                                }%)

                              </div>

                            </div>

                          ) : (

                            <div>

                              IGST (
                              {
                                invoice.igst_rate ||
                                0
                              }%)

                            </div>

                          )}

                        </td>


                        {/* GRAND TOTAL */}

                        <td>

                          <strong className="invoice-grand-total">

                            ₹
                            {
                              formatAmount(
                                invoice.grand_total
                              )
                            }

                          </strong>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span className="invoice-status">

                            {
                              invoice.status ||
                              "Pending"
                            }

                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="invoice-actions">


                            {/* VIEW */}

                            <button
                              type="button"
                              className="invoice-action-btn invoice-view-btn"
                              title="View Invoice"
                              onClick={() =>
                                handleView(invoice)
                              }
                            >

                              <Eye size={17} />

                            </button>


                            {/* EDIT */}

                            <button
                              type="button"
                              className="invoice-action-btn invoice-edit-btn"
                              title="Edit Invoice"
                              onClick={() =>
                                handleEdit(invoice)
                              }
                            >

                              <Edit2 size={17} />

                            </button>


                            {/* DELETE */}

                            <button
                              type="button"
                              className="invoice-action-btn invoice-delete-btn"
                              title="Delete Invoice"
                              onClick={() =>
                                handleDelete(
                                  invoice._id
                                )
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

          </div>
        )}

      </div>


      {/* =====================================================
          VIEW INVOICE MODAL
      ===================================================== */}

      {showViewModal &&
        selectedInvoice && (

        <div
          className="invoice-modal-overlay"
          onClick={closeViewModal}
        >

          <div
            className="invoice-print-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* TOOLBAR */}

            <div className="invoice-preview-toolbar">

              <strong>
                Invoice Preview
              </strong>


              <div className="invoice-preview-actions">

                <button
                  type="button"
                  className="invoice-print-btn"
                  onClick={handlePrint}
                >

                  <Printer size={17} />

                  Print Invoice

                </button>


                <button
                  type="button"
                  className="invoice-close-btn"
                  onClick={closeViewModal}
                >

                  <X size={19} />

                </button>

              </div>

            </div>


            {/* SCROLL AREA */}

            <div className="invoice-preview-scroll">

              {/* INVOICE PAPER */}

              <div className="tax-invoice-paper">

                {/* HEADING */}

                <div className="tax-invoice-heading">

                  <h1>
                    TAX INVOICE
                  </h1>

                  <p>
                    Original for Recipient
                  </p>

                </div>


                {/* SELLER DETAILS */}

                <div className="tax-invoice-top-grid">

                  <div className="seller-details">

                    <h2>

                      {
                        selectedInvoice.user_id?.companyName ||
                        selectedInvoice.user?.companyName ||
                        selectedInvoice.companyName ||
                        "Your Business Name"
                      }

                    </h2>


                    <p>

                      {
                        selectedInvoice.user_id?.companyAddress ||
                        selectedInvoice.user?.companyAddress ||
                        selectedInvoice.companyAddress ||
                        "Company Address"
                      }

                    </p>


                    <p>

                      {
                        selectedInvoice.user_id?.companyState ||
                        selectedInvoice.user?.companyState ||
                        selectedInvoice.companyState ||
                        ""
                      }

                    </p>


                    {(
                      selectedInvoice.user_id?.gstNumber ||
                      selectedInvoice.user?.gstNumber ||
                      selectedInvoice.gstNumber
                    ) && (

                      <p>

                        <strong>
                          GSTIN:
                        </strong>{" "}

                        {
                          selectedInvoice.user_id?.gstNumber ||
                          selectedInvoice.user?.gstNumber ||
                          selectedInvoice.gstNumber
                        }

                      </p>

                    )}

                  </div>


                  {/* INVOICE META */}

                  <div className="invoice-meta">

                    <div>

                      <span>
                        Invoice No.
                      </span>

                      <strong>

                        {
                          selectedInvoice.invoice_number ||
                          "-"
                        }

                      </strong>

                    </div>


                    <div>

                      <span>
                        Invoice Date
                      </span>

                      <strong>

                        {
                          getInvoiceDate(
                            selectedInvoice
                          )
                        }

                      </strong>

                    </div>


                    <div>

                      <span>
                        Status
                      </span>

                      <strong>

                        {
                          selectedInvoice.status ||
                          "Pending"
                        }

                      </strong>

                    </div>

                  </div>

                </div>


                {/* BILL TO */}

                <div className="bill-to-box">

                  <div className="invoice-section-label">
                    BILL TO
                  </div>

                  <h3>

                    {
                      selectedInvoice.vendor_name ||
                      "-"
                    }

                  </h3>


                  {selectedInvoice.vendor_has_gst ? (

                    <p>

                      GSTIN:{" "}

                      {
                        selectedInvoice.vendor_gstin ||
                        "-"
                      }

                    </p>

                  ) : (

                    <p>

                      State:{" "}

                      {
                        selectedInvoice.vendor_state ||
                        "-"
                      }

                    </p>

                  )}

                </div>


                {/* ITEMS */}

                <table className="tax-invoice-table">

                  <thead>

                    <tr>

                      <th>
                        #
                      </th>

                      <th>
                        Description
                      </th>

                      <th>
                        Qty
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Taxable Value
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    <tr>

                      <td>
                        1
                      </td>

                      <td className="item-description">

                        {
                          selectedInvoice.description ||
                          "Invoice Services"
                        }

                      </td>

                      <td>
                        1
                      </td>

                      <td>

                        ₹
                        {
                          formatAmount(
                            selectedInvoice.total_amount
                          )
                        }

                      </td>

                      <td>

                        ₹
                        {
                          formatAmount(
                            selectedInvoice.total_amount
                          )
                        }

                      </td>

                    </tr>

                  </tbody>

                </table>


                {/* TOTAL */}

                <div className="invoice-bottom-grid">

                  <div className="amount-words">

                    <strong>
                      Amount in Words
                    </strong>

                    <p>

                      Rupees{" "}

                      {
                        numberToWords(
                          selectedInvoice.grand_total
                        )
                      }{" "}

                      Only

                    </p>

                  </div>


                  <div className="invoice-calculation">

                    {/* TAXABLE */}

                    <div>

                      <span>
                        Taxable Amount
                      </span>

                      <strong>

                        ₹
                        {
                          formatAmount(
                            selectedInvoice.total_amount
                          )
                        }

                      </strong>

                    </div>


                    {/* CGST + SGST */}

                    {selectedInvoice.tax_type ===
                    "CGST_SGST" ? (

                      <>

                        <div>

                          <span>

                            CGST (
                            {
                              selectedInvoice.cgst_rate ||
                              0
                            }%)

                          </span>

                          <strong>

                            ₹
                            {
                              formatAmount(
                                selectedInvoice.cgst_amount
                              )
                            }

                          </strong>

                        </div>


                        <div>

                          <span>

                            SGST (
                            {
                              selectedInvoice.sgst_rate ||
                              0
                            }%)

                          </span>

                          <strong>

                            ₹
                            {
                              formatAmount(
                                selectedInvoice.sgst_amount
                              )
                            }

                          </strong>

                        </div>

                      </>

                    ) : (

                      /* IGST */

                      <div>

                        <span>

                          IGST (
                          {
                            selectedInvoice.igst_rate ||
                            0
                          }%)

                        </span>

                        <strong>

                          ₹
                          {
                            formatAmount(
                              selectedInvoice.igst_amount
                            )
                          }

                        </strong>

                      </div>

                    )}


                    {/* GRAND TOTAL */}

                    <div className="invoice-final-total">

                      <span>
                        Grand Total
                      </span>

                      <strong>

                        ₹
                        {
                          formatAmount(
                            selectedInvoice.grand_total
                          )
                        }

                      </strong>

                    </div>

                  </div>

                </div>


                {/* PAYMENT */}

                <div className="invoice-payment-row">

                  <span>
                    Payment Status
                  </span>

                  <strong>

                    {
                      selectedInvoice.status ||
                      "Pending"
                    }

                  </strong>

                </div>


                {/* FOOTER */}

                <div className="tax-invoice-footer">

                  <div>

                    <p>
                      Thank you for your business.
                    </p>

                    <small>
                      This is a computer generated invoice.
                    </small>

                  </div>


                  <div className="signature-box">

                    <div>
                      Authorized Signatory
                    </div>

                    <div className="signature-line">
                    </div>

                    <strong>
                      For Your Business
                    </strong>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );


  /* =====================================================
     NUMBER TO WORDS
  ===================================================== */

  function numberToWords(num) {
    num = Math.floor(
      Number(num || 0)
    );

    if (!Number.isFinite(num)) {
      return "Zero";
    }

    if (num === 0) {
      return "Zero";
    }

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const convert = (n) => {
      if (n < 20) {
        return ones[n] || "";
      }

      if (n < 100) {
        return (
          tens[Math.floor(n / 10)] +
          (
            n % 10
              ? " " + ones[n % 10]
              : ""
          )
        );
      }

      if (n < 1000) {
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (
            n % 100
              ? " " + convert(n % 100)
              : ""
          )
        );
      }

      if (n < 100000) {
        return (
          convert(
            Math.floor(n / 1000)
          ) +
          " Thousand" +
          (
            n % 1000
              ? " " + convert(n % 1000)
              : ""
          )
        );
      }

      if (n < 10000000) {
        return (
          convert(
            Math.floor(n / 100000)
          ) +
          " Lakh" +
          (
            n % 100000
              ? " " + convert(n % 100000)
              : ""
          )
        );
      }

      return (
        convert(
          Math.floor(n / 10000000)
        ) +
        " Crore" +
        (
          n % 10000000
            ? " " +
              convert(n % 10000000)
            : ""
        )
      );
    };

    return convert(num);
  }
}


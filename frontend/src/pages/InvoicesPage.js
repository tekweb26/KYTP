import React, {
  useEffect,
  useState,
} from "react";

import { invoiceAPI } from "../api/api";

import toast from "react-hot-toast";

import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  X,
  Printer,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

import "./InvoicesPage.css";


export default function InvoicesPage() {

  const [invoices, setInvoices] =
    useState([]);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [selectedInvoice, setSelectedInvoice] =
    useState(null);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedYear, setSelectedYear] =
    useState(null);

  const [selectedMonth, setSelectedMonth] =
    useState(null);


  /* =====================================================
     FORM
  ===================================================== */

  const [formData, setFormData] =
    useState({

      invoice_number: "",

      invoice_date: "",

      vendor_name: "",

      vendor_has_gst: "",

      vendor_gstin: "",

      vendor_state: "",

      total_amount: "",

      gst_rate: "",

      description: "",
    });


  const [gstError, setGstError] =
    useState("");


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
     LOAD
  ===================================================== */

  useEffect(() => {
    loadInvoices();
  }, []);


  const loadInvoices = async () => {

    try {

      const response =
        await invoiceAPI.list();

      const data =
        response.data;

      if (Array.isArray(data)) {
        setInvoices(data);
      }

      else if (
        Array.isArray(
          data?.invoices
        )
      ) {
        setInvoices(
          data.invoices
        );
      }

      else {
        setInvoices([]);
      }

    } catch (error) {

      console.error(
        "Invoice Load Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to load invoices"
      );

    } finally {

      setLoading(false);
    }
  };


  /* =====================================================
     CHANGE
  ===================================================== */

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;


    let finalValue =
      value;


    if (
      name ===
      "vendor_gstin"
    ) {

      finalValue =
        value
          .toUpperCase()
          .replace(
            /[^A-Z0-9]/g,
            ""
          )
          .slice(0, 15);

      validateVendorGST(
        finalValue
      );
    }


    if (
      name ===
      "total_amount"
    ) {

      finalValue =
        value.replace(
          /[^0-9.]/g,
          ""
        );
    }


    if (
      name ===
      "gst_rate"
    ) {

      finalValue =
        value.replace(
          /[^0-9.]/g,
          ""
        );
    }


    setFormData(
      (prev) => ({
        ...prev,
        [name]:
          finalValue,
      })
    );
  };


  /* =====================================================
     GST VALIDATION
  ===================================================== */

  const validateVendorGST = (
    gst
  ) => {

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
     RESET
  ===================================================== */

  const resetForm = () => {

    setFormData({

      invoice_number: "",

      invoice_date: "",

      vendor_name: "",

      vendor_has_gst: "",

      vendor_gstin: "",

      vendor_state: "",

      total_amount: "",

      gst_rate: "",

      description: "",
    });

    setGstError("");
  };


  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit =
    async (e) => {

      e.preventDefault();


      if (
        !formData.invoice_number.trim()
      ) {

        toast.error(
          "Please enter invoice number"
        );

        return;
      }


      if (
        !formData.invoice_date
      ) {

        toast.error(
          "Please select invoice date"
        );

        return;
      }


      if (
        !formData.vendor_name.trim()
      ) {

        toast.error(
          "Please enter vendor name"
        );

        return;
      }


      if (
        formData.vendor_has_gst === ""
      ) {

        toast.error(
          "Please select whether vendor has GST"
        );

        return;
      }


      /* =================================================
         VENDOR GST
      ================================================= */

      if (
        formData.vendor_has_gst ===
        "yes"
      ) {

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


      /* =================================================
         VENDOR WITHOUT GST
      ================================================= */

      if (
        formData.vendor_has_gst ===
        "no" &&
        !formData.vendor_state
      ) {

        toast.error(
          "Please select vendor state"
        );

        return;
      }


      /* =================================================
         AMOUNT
      ================================================= */

      if (
        formData.total_amount === ""
      ) {

        toast.error(
          "Please enter total amount"
        );

        return;
      }


      const totalAmount =
        Number(
          formData.total_amount
        );


      if (
        Number.isNaN(
          totalAmount
        ) ||
        totalAmount <= 0
      ) {

        toast.error(
          "Please enter valid total amount"
        );

        return;
      }


      /* =================================================
         GST RATE
      ================================================= */

      if (
        formData.gst_rate === ""
      ) {

        toast.error(
          "Please enter GST rate"
        );

        return;
      }


      const gstRate =
        Number(
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


      try {

        const invoiceData = {

          invoice_number:
            formData.invoice_number.trim(),

          invoice_date:
            formData.invoice_date,

          vendor_name:
            formData.vendor_name.trim(),

          vendor_has_gst:
            formData.vendor_has_gst ===
            "yes",

          vendor_gstin:
            formData.vendor_has_gst ===
            "yes"
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


        const response =
          await invoiceAPI.create(
            invoiceData
          );


        const data =
          response.data;


        if (data?.success) {

          toast.success(
            "Invoice created successfully"
          );

          resetForm();

          setShowForm(false);

          await loadInvoices();

        }

        else {

          toast.error(
            data?.message ||
            "Failed to create invoice"
          );
        }

      } catch (error) {

        console.error(
          "Invoice Create Error:",
          error
        );

        toast.error(
          error?.response?.data?.message ||
          "Failed to create invoice"
        );

      } finally {

        setCreating(false);
      }
    };


  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete =
    async (id) => {

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this invoice?"
        );


      if (!confirmed)
        return;


      try {

        await invoiceAPI.delete(
          id
        );

        toast.success(
          "Invoice deleted successfully"
        );

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
     AMOUNT
  ===================================================== */

  const formatAmount =
    (amount) => {

      return Number(
        amount || 0
      ).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        }
      );
    };


  /* =====================================================
     VIEW
  ===================================================== */

  const handleView =
    (invoice) => {

      setSelectedInvoice(
        invoice
      );

      setShowViewModal(
        true
      );
    };


  const closeViewModal =
    () => {

      setSelectedInvoice(
        null
      );

      setShowViewModal(
        false
      );
    };


  /* =====================================================
     PRINT
  ===================================================== */

  const handlePrint =
    () => {

      window.print();
    };


  /* =====================================================
     DATE
  ===================================================== */

  const getInvoiceDate =
    (invoice) => {

      if (
        !invoice.invoice_date
      ) {
        return "N/A";
      }

      return new Date(
        invoice.invoice_date
      ).toLocaleDateString(
        "en-IN"
      );
    };


  /* =====================================================
     GROUP BY YEAR
  ===================================================== */

  const groupedInvoices =
    invoices.reduce(
      (acc, invoice) => {

        const year =
          invoice.invoice_year ||
          new Date(
            invoice.invoice_date ||
            invoice.createdAt
          ).getFullYear();

        const month =
          invoice.invoice_month ||
          (
            new Date(
              invoice.invoice_date ||
              invoice.createdAt
            ).getMonth() + 1
          );


        if (!acc[year]) {
          acc[year] = {};
        }


        if (!acc[year][month]) {
          acc[year][month] = [];
        }


        acc[year][month].push(
          invoice
        );


        return acc;

      },
      {}
    );


  const sortedYears =
    Object.keys(
      groupedInvoices
    )
      .map(Number)
      .sort(
        (a, b) =>
          b - a
      );


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
            onClick={() =>
              setShowForm(
                !showForm
              )
            }
            className="invoice-primary-btn"
          >

            <Plus size={18} />

            {showForm
              ? "Close Form"
              : "New Invoice"}

          </button>

        </div>


        {/* =================================================
            CREATE FORM
        ================================================= */}

        {showForm && (

          <div className="invoice-form-card">

            <h2 className="invoice-form-title">
              Create Invoice
            </h2>


            <form
              onSubmit={
                handleSubmit
              }
            >


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
                    onChange={
                      handleChange
                    }
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
                    onChange={
                      handleChange
                    }
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
                    onChange={
                      handleChange
                    }
                    placeholder="Enter vendor name"
                    required
                  />

                </div>


                {/* VENDOR GST YES NO */}

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
                      onChange={
                        handleChange
                      }
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
                      onChange={
                        handleChange
                      }
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
                    onChange={
                      handleChange
                    }
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
                    onChange={
                      handleChange
                    }
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
                  onChange={
                    handleChange
                  }
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
                    ? "Creating..."
                    : "Create"}

                </button>


                <button
                  type="button"
                  className="invoice-secondary-btn"
                  onClick={() => {

                    resetForm();

                    setShowForm(
                      false
                    );

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
            YEAR / MONTH VIEW
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


            {sortedYears.length ===
            0 ? (

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
                        setSelectedYear(
                          year
                        )
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
          !selectedMonth && (

          <div className="invoice-table-card">

            <div className="invoice-breadcrumb">

              <button
                type="button"
                onClick={() =>
                  setSelectedYear(
                    null
                  )
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
                groupedInvoices[
                  selectedYear
                ] || {}
              )
                .map(Number)
                .sort(
                  (a, b) =>
                    b - a
                )
                .map(
                  (month) => {

                    const monthInvoices =
                      groupedInvoices[
                        selectedYear
                      ][month];


                    return (

                      <button
                        key={month}
                        type="button"
                        className="invoice-month-item"
                        onClick={() =>
                          setSelectedMonth(
                            month
                          )
                        }
                      >

                        <div>

                          <strong>
                            {
                              monthNames[
                                month - 1
                              ]
                            }
                          </strong>

                          <small>
                            {
                              monthInvoices.length
                            }{" "}
                            invoice
                            {monthInvoices.length !==
                            1
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
          selectedMonth && (

          <div className="invoice-table-card">

            <div className="invoice-breadcrumb">

              <button
                type="button"
                onClick={() =>
                  setSelectedMonth(
                    null
                  )
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
                    ]
                  }{" "}
                  {selectedYear}
                </h2>

                <p>
                  {
                    groupedInvoices[
                      selectedYear
                    ][selectedMonth]
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
                    ][selectedMonth] || []
                  ).map(
                    (invoice) => (

                      <tr
                        key={
                          invoice._id
                        }
                      >

                        <td>
                          <strong>
                            {
                              invoice.invoice_number
                            }
                          </strong>
                        </td>


                        <td>
                          {
                            getInvoiceDate(
                              invoice
                            )
                          }
                        </td>


                        <td>

                          <div className="invoice-vendor-name">
                            {
                              invoice.vendor_name
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
                                invoice.vendor_state
                              }
                            </div>
                          )}

                        </td>


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


                        <td>

                          {invoice.tax_type ===
                          "CGST_SGST" ? (

                            <div>

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

                            <div>
                              IGST (
                              {
                                invoice.igst_rate ||
                                0
                              }
                              %)
                            </div>

                          )}

                        </td>


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


                        <td>

                          <span className="invoice-status">
                            {
                              invoice.status ||
                              "Pending"
                            }
                          </span>

                        </td>


                        <td>

                          <div className="invoice-actions">

                            <button
                              type="button"
                              className="invoice-action-btn invoice-view-btn"
                              title="View Invoice"
                              onClick={() =>
                                handleView(
                                  invoice
                                )
                              }
                            >
                              <Eye
                                size={17}
                              />
                            </button>


                            <button
                              type="button"
                              className="invoice-action-btn invoice-edit-btn"
                              title="Edit Invoice"
                              onClick={() =>
                                toast(
                                  "Edit feature will be added next"
                                )
                              }
                            >
                              <Edit2
                                size={17}
                              />
                            </button>


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
                              <Trash2
                                size={17}
                              />
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
          VIEW MODAL
      ===================================================== */}

      {showViewModal &&
        selectedInvoice && (

        <div
          className="invoice-modal-overlay"
          onClick={
            closeViewModal
          }
        >

          <div
            className="invoice-print-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="invoice-preview-toolbar">

              <strong>
                Invoice Preview
              </strong>

              <div className="invoice-preview-actions">

                <button
                  type="button"
                  className="invoice-print-btn"
                  onClick={
                    handlePrint
                  }
                >
                  <Printer
                    size={17}
                  />

                  Print Invoice
                </button>


                <button
                  type="button"
                  className="invoice-close-btn"
                  onClick={
                    closeViewModal
                  }
                >
                  <X
                    size={19}
                  />
                </button>

              </div>

            </div>


            {/* =================================================
                INVOICE PAPER
            ================================================= */}

            <div className="tax-invoice-paper">


              <div className="tax-invoice-heading">

                <h1>
                  TAX INVOICE
                </h1>

                <p>
                  Original for Recipient
                </p>

              </div>


              <div className="tax-invoice-top-grid">


                <div className="seller-details">

                  <h2>
                    {selectedInvoice.user_id?.companyName ||
                      "Your Business Name"}
                  </h2>

                  <p>
                    {selectedInvoice.user_id?.companyAddress ||
                      "Company Address"}
                  </p>

                  <p>
                    {selectedInvoice.user_id?.companyState ||
                      ""}
                  </p>

                  {selectedInvoice.user_id?.gstNumber && (
                    <p>
                      <strong>
                        GSTIN:
                      </strong>{" "}
                      {
                        selectedInvoice.user_id.gstNumber
                      }
                    </p>
                  )}

                </div>


                <div className="invoice-meta">

                  <div>

                    <span>
                      Invoice No.
                    </span>

                    <strong>
                      {
                        selectedInvoice.invoice_number
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
                    selectedInvoice.vendor_name
                  }
                </h3>


                {selectedInvoice.vendor_has_gst ? (

                  <p>
                    GSTIN:{" "}
                    {
                      selectedInvoice.vendor_gstin
                    }
                  </p>

                ) : (

                  <p>
                    State:{" "}
                    {
                      selectedInvoice.vendor_state
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
                      Rate
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
      )}

    </div>
  );


  /* =====================================================
     NUMBER TO WORDS
  ===================================================== */

  function numberToWords(num) {

    num =
      Math.floor(
        Number(num || 0)
      );


    if (num === 0)
      return "Zero";


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

      if (n < 20)
        return ones[n];


      if (n < 100) {

        return (
          tens[
            Math.floor(
              n / 10
            )
          ] +
          (
            n % 10
              ? " " +
                ones[
                  n % 10
                ]
              : ""
          )
        );
      }


      if (n < 1000) {

        return (
          ones[
            Math.floor(
              n / 100
            )
          ] +
          " Hundred" +
          (
            n % 100
              ? " " +
                convert(
                  n % 100
                )
              : ""
          )
        );
      }


      if (n < 100000) {

        return (
          convert(
            Math.floor(
              n / 1000
            )
          ) +
          " Thousand" +
          (
            n % 1000
              ? " " +
                convert(
                  n % 1000
                )
              : ""
          )
        );
      }


      if (n < 10000000) {

        return (
          convert(
            Math.floor(
              n / 100000
            )
          ) +
          " Lakh" +
          (
            n % 100000
              ? " " +
                convert(
                  n % 100000
                )
              : ""
          )
        );
      }


      return (
        convert(
          Math.floor(
            n / 10000000
          )
        ) +
        " Crore" +
        (
          n % 10000000
            ? " " +
              convert(
                n % 10000000
              )
            : ""
        )
      );
    };


    return convert(num);
  }
}
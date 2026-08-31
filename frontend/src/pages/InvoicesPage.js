
import React, { useEffect, useState } from "react";
import { invoiceAPI } from "../api/api";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  X,
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

  /* =====================================================
     VIEW MODAL
  ===================================================== */

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);

  /* =====================================================
     FORM DATA
  ===================================================== */

  const [formData, setFormData] = useState({
    vendor_name: "",
    vendor_gstin: "",
    total_amount: "",
    gst_rate: "",
    description: "",
  });

  /* =====================================================
     GST ERROR
  ===================================================== */

  const [gstError, setGstError] = useState("");

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
     FORM CHANGE
  ===================================================== */

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    let finalValue = value;

    /* ---------------------------------------------
       VENDOR GST
    --------------------------------------------- */

    if (name === "vendor_gstin") {

      finalValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 15);

      validateVendorGST(finalValue);
    }

    /* ---------------------------------------------
       GST RATE
    --------------------------------------------- */

    if (name === "gst_rate") {

      finalValue = value
        .replace(/[^0-9.]/g, "");

    }

    /* ---------------------------------------------
       TOTAL AMOUNT
    --------------------------------------------- */

    if (name === "total_amount") {

      finalValue = value
        .replace(/[^0-9.]/g, "");

    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

  };

  /* =====================================================
     VALIDATE VENDOR GST
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

    setFormData({
      vendor_name: "",
      vendor_gstin: "",
      total_amount: "",
      gst_rate: "",
      description: "",
    });

    setGstError("");

  };

  /* =====================================================
     CREATE INVOICE
  ===================================================== */

  const handleSubmit = async (e) => {

    e.preventDefault();

    /* ---------------------------------------------
       VENDOR NAME
    --------------------------------------------- */

    if (!formData.vendor_name.trim()) {

      toast.error(
        "Please enter vendor name"
      );

      return;
    }

    /* ---------------------------------------------
       VENDOR GST
    --------------------------------------------- */

    const cleanGST =
      formData.vendor_gstin
        .toUpperCase()
        .trim();

    if (!cleanGST) {

      toast.error(
        "Please enter vendor GST number"
      );

      return;
    }

    if (!validateVendorGST(cleanGST)) {

      toast.error(
        "Please enter a valid vendor GST number"
      );

      return;
    }

    /* ---------------------------------------------
       TOTAL AMOUNT
    --------------------------------------------- */

    if (formData.total_amount === "") {

      toast.error(
        "Please enter total amount"
      );

      return;
    }

    const totalAmount =
      Number(formData.total_amount);

    if (
      Number.isNaN(totalAmount) ||
      totalAmount <= 0
    ) {

      toast.error(
        "Please enter a valid total amount"
      );

      return;
    }

    /* ---------------------------------------------
       GST RATE
    --------------------------------------------- */

    if (formData.gst_rate === "") {

      toast.error(
        "Please enter GST rate"
      );

      return;
    }

    const gstRate =
      Number(formData.gst_rate);

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

    /* ---------------------------------------------
       CREATE
    --------------------------------------------- */

    setCreating(true);

    try {

      const invoiceData = {

        vendor_name:
          formData.vendor_name.trim(),

        vendor_gstin:
          cleanGST,

        total_amount:
          totalAmount,

        gst_rate:
          gstRate,

        description:
          formData.description.trim(),

      };

      console.log(
        "Invoice Data:",
        invoiceData
      );

      const response =
        await invoiceAPI.create(
          invoiceData
        );

      const data =
        response.data;

      console.log(
        "Invoice Response:",
        data
      );

      if (data?.success) {

        toast.success(
          "Invoice created successfully"
        );

        resetForm();

        setShowForm(false);

        await loadInvoices();

      } else {

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
        error?.response?.data?.error ||
        "Failed to create invoice"
      );

    } finally {

      setCreating(false);

    }

  };

  /* =====================================================
     DELETE INVOICE
  ===================================================== */

  const handleDelete = async (id) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this invoice?"
      );

    if (!confirmed) {
      return;
    }

    try {

      await invoiceAPI.delete(id);

      toast.success(
        "Invoice deleted successfully"
      );

      await loadInvoices();

    } catch (error) {

      console.error(
        "Invoice Delete Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to delete invoice"
      );

    }

  };

  /* =====================================================
     FORMAT CURRENCY
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
     VIEW INVOICE
  ===================================================== */

  const handleView = (invoice) => {

    setSelectedInvoice(invoice);

    setShowViewModal(true);

  };

  /* =====================================================
     CLOSE VIEW MODAL
  ===================================================== */

  const closeViewModal = () => {

    setShowViewModal(false);

    setSelectedInvoice(null);

  };

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
              setShowForm(!showForm)
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

            <form onSubmit={handleSubmit}>

              <div className="invoice-form-grid">

                {/* VENDOR NAME */}

                <div className="invoice-form-group">

                  <label htmlFor="vendor_name">
                    Vendor Name
                  </label>

                  <input
                    id="vendor_name"
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

                {/* VENDOR GST */}

                <div className="invoice-form-group">

                  <label htmlFor="vendor_gstin">
                    Vendor GSTIN
                  </label>

                  <input
                    id="vendor_gstin"
                    name="vendor_gstin"
                    type="text"
                    value={
                      formData.vendor_gstin
                    }
                    onChange={handleChange}
                    placeholder="Enter 15 digit GSTIN"
                    maxLength={15}
                    autoComplete="off"
                    required
                  />

                  {gstError && (

                    <small className="kytp-error-text">
                      {gstError}
                    </small>

                  )}

                  {!gstError &&
                    formData.vendor_gstin.length === 15 && (

                      <small className="kytp-success-text">
                        ✓ Valid GST format
                      </small>

                    )}

                </div>

                {/* TOTAL AMOUNT */}

                <div className="invoice-form-group">

                  <label htmlFor="total_amount">
                    Total Amount
                  </label>

                  <input
                    id="total_amount"
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

                  <label htmlFor="gst_rate">
                    GST Rate (%)
                  </label>

                  <input
                    id="gst_rate"
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

                  <small className="invoice-field-hint">
                    Enter GST rate manually
                  </small>

                </div>

              </div>

              {/* GST INFORMATION */}

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

                <small>
                  Final tax type will be determined
                  automatically using your GST and
                  vendor GST.
                </small>

              </div>

              {/* DESCRIPTION */}

              <div className="invoice-form-group">

                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder="Enter invoice description"
                  rows="3"
                />

              </div>

              {/* BUTTONS */}

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
            INVOICE TABLE
        ================================================= */}

        <div className="invoice-table-card">

          <div className="invoice-table-wrapper">

            <table className="invoice-table">

              <thead>

                <tr>

                  <th>Vendor</th>

                  <th>Amount</th>

                  <th>GST Rate</th>

                  <th>Tax</th>

                  <th>Grand Total</th>

                  <th>Status</th>

                  <th>Actions</th>

                </tr>

              </thead>

              <tbody>

                {invoices.length > 0 ? (

                  invoices.map((invoice) => (

                    <tr
                      key={
                        invoice._id ||
                        invoice.id
                      }
                    >

                      {/* VENDOR */}

                      <td>

                        <div className="invoice-vendor-name">

                          {invoice.vendor_name ||
                            "Unknown Vendor"}

                        </div>

                        {invoice.vendor_gstin && (

                          <div className="invoice-vendor-gstin">

                            {invoice.vendor_gstin}

                          </div>

                        )}

                      </td>

                      {/* AMOUNT */}

                      <td>

                        <span className="invoice-amount">

                          ₹
                          {formatAmount(
                            invoice.total_amount
                          )}

                        </span>

                      </td>

                      {/* GST RATE */}

                      <td>

                        <span className="invoice-tax">

                          {invoice.gst_rate || 0}%

                        </span>

                      </td>

                      {/* TAX */}

                      <td>

                        {invoice.tax_type ===
                        "CGST_SGST" ? (

                          <div>

                            <div>
                              CGST (
                              {invoice.cgst_rate || 0}
                              %):
                              ₹
                              {formatAmount(
                                invoice.cgst_amount
                              )}
                            </div>

                            <div>
                              SGST (
                              {invoice.sgst_rate || 0}
                              %):
                              ₹
                              {formatAmount(
                                invoice.sgst_amount
                              )}
                            </div>

                          </div>

                        ) : (

                          <div>

                            <div>
                              IGST (
                              {invoice.igst_rate || 0}
                              %):
                              ₹
                              {formatAmount(
                                invoice.igst_amount
                              )}
                            </div>

                          </div>

                        )}

                      </td>

                      {/* GRAND TOTAL */}

                      <td>

                        <strong className="invoice-grand-total">

                          ₹
                          {formatAmount(
                            invoice.grand_total
                          )}

                        </strong>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span className="invoice-status">

                          {invoice.status ||
                            "Pending"}

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
                              toast(
                                "Edit feature will be added next"
                              )
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
                                invoice._id ||
                                invoice.id
                              )
                            }
                          >

                            <Trash2 size={17} />

                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="7"
                      className="invoice-empty"
                    >

                      No invoices found.

                      <br />

                      Click{" "}

                      <strong>
                        New Invoice
                      </strong>{" "}

                      to create your first invoice.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

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
              className="invoice-view-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="invoice-modal-header">

                <div>

                  <h2>
                    Invoice Details
                  </h2>

                  <p>
                    Complete invoice information
                  </p>

                </div>

                <button
                  type="button"
                  className="invoice-modal-close"
                  onClick={closeViewModal}
                  title="Close"
                >

                  <X size={20} />

                </button>

              </div>

              {/* MODAL BODY */}

              <div className="invoice-modal-body">

                {/* VENDOR DETAILS */}

                <div className="invoice-detail-section">

                  <h3>
                    Vendor Details
                  </h3>

                  <div className="invoice-detail-grid">

                    <div className="invoice-detail-item">

                      <span>
                        Vendor Name
                      </span>

                      <strong>
                        {selectedInvoice.vendor_name ||
                          "N/A"}
                      </strong>

                    </div>

                    <div className="invoice-detail-item">

                      <span>
                        Vendor GSTIN
                      </span>

                      <strong>
                        {selectedInvoice.vendor_gstin ||
                          "N/A"}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* AMOUNT DETAILS */}

                <div className="invoice-detail-section">

                  <h3>
                    Amount Details
                  </h3>

                  <div className="invoice-detail-grid">

                    <div className="invoice-detail-item">

                      <span>
                        Total Amount
                      </span>

                      <strong className="invoice-modal-amount">
                        ₹
                        {formatAmount(
                          selectedInvoice.total_amount
                        )}
                      </strong>

                    </div>

                    <div className="invoice-detail-item">

                      <span>
                        GST Rate
                      </span>

                      <strong>
                        {selectedInvoice.gst_rate ||
                          0}
                        %
                      </strong>

                    </div>

                    <div className="invoice-detail-item">

                      <span>
                        Tax Type
                      </span>

                      <strong>
                        {selectedInvoice.tax_type ||
                          "N/A"}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* TAX DETAILS */}

                <div className="invoice-detail-section">

                  <h3>
                    Tax Details
                  </h3>

                  {selectedInvoice.tax_type ===
                  "CGST_SGST" ? (

                    <div className="invoice-tax-detail-box">

                      <div>

                        <span>
                          CGST
                        </span>

                        <strong>
                          {selectedInvoice.cgst_rate ||
                            0}
                          % — ₹
                          {formatAmount(
                            selectedInvoice.cgst_amount
                          )}
                        </strong>

                      </div>

                      <div>

                        <span>
                          SGST
                        </span>

                        <strong>
                          {selectedInvoice.sgst_rate ||
                            0}
                          % — ₹
                          {formatAmount(
                            selectedInvoice.sgst_amount
                          )}
                        </strong>

                      </div>

                    </div>

                  ) : (

                    <div className="invoice-tax-detail-box">

                      <div>

                        <span>
                          IGST
                        </span>

                        <strong>
                          {selectedInvoice.igst_rate ||
                            0}
                          % — ₹
                          {formatAmount(
                            selectedInvoice.igst_amount
                          )}
                        </strong>

                      </div>

                    </div>

                  )}

                </div>

                {/* GRAND TOTAL */}

                <div className="invoice-grand-total-box">

                  <span>
                    Grand Total
                  </span>

                  <strong>
                    ₹
                    {formatAmount(
                      selectedInvoice.grand_total
                    )}
                  </strong>

                </div>

                {/* STATUS */}

                <div className="invoice-detail-section">

                  <h3>
                    Invoice Status
                  </h3>

                  <span className="invoice-modal-status">

                    {selectedInvoice.status ||
                      "Pending"}

                  </span>

                </div>

                {/* DESCRIPTION */}

                <div className="invoice-detail-section">

                  <h3>
                    Description
                  </h3>

                  <div className="invoice-description-box">

                    {selectedInvoice.description ||
                      "No description provided."}

                  </div>

                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="invoice-modal-footer">

                <button
                  type="button"
                  className="invoice-secondary-btn"
                  onClick={closeViewModal}
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}


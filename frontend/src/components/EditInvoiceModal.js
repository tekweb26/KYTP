import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { invoiceAPI } from "../api/api";

import "./EditInvoiceModal.css";

export default function EditInvoiceModal({
  invoice,
  onClose,
  onUpdated,
}) {
  const [saving, setSaving] = useState(false);

  const [gstError, setGstError] = useState("");

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

  const getDateValue = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    invoice_number: "",
    invoice_date: "",
    vendor_name: "",
    vendor_has_gst: "",
    vendor_gstin: "",
    vendor_state: "",
    total_amount: "",
    gst_rate: "",
    description: "",
    status: "Pending",
  });

  /* =====================================================
     LOAD INVOICE INTO FORM
  ===================================================== */

  useEffect(() => {
    if (!invoice) return;

    setFormData({
      invoice_number:
        invoice.invoice_number || "",

      invoice_date:
        getDateValue(invoice.invoice_date),

      vendor_name:
        invoice.vendor_name || "",

      vendor_has_gst:
        invoice.vendor_has_gst
          ? "yes"
          : "no",

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

      status:
        invoice.status || "Pending",
    });

    setGstError("");
  }, [invoice]);

  /* =====================================================
     GST VALIDATION
  ===================================================== */

  const validateGST = (gst) => {
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
     CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    let finalValue = value;

    if (name === "vendor_gstin") {
      finalValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 15);

      validateGST(finalValue);
    }

    if (
      name === "total_amount" ||
      name === "gst_rate"
    ) {
      finalValue = value.replace(
        /[^0-9.]/g,
        ""
      );
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  /* =====================================================
     SUBMIT UPDATE
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!invoice?._id) {
      toast.error("Invoice ID not found");
      return;
    }

    /* ---------------------------------------------
       BASIC VALIDATION
    --------------------------------------------- */

    if (!formData.invoice_number.trim()) {
      toast.error(
        "Please enter invoice number"
      );
      return;
    }

    if (!formData.invoice_date) {
      toast.error(
        "Please select invoice date"
      );
      return;
    }

    if (!formData.vendor_name.trim()) {
      toast.error(
        "Please enter vendor name"
      );
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

    if (
      formData.vendor_has_gst === "yes"
    ) {
      if (
        !validateGST(
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
       STATE
    --------------------------------------------- */

    if (
      formData.vendor_has_gst === "no" &&
      !formData.vendor_state
    ) {
      toast.error(
        "Please select vendor state"
      );
      return;
    }

    /* ---------------------------------------------
       AMOUNT
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
        "Please enter valid total amount"
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
       DATA
    --------------------------------------------- */

    const updateData = {
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

      status:
        formData.status,
    };

    try {
      setSaving(true);

      const response =
        await invoiceAPI.update(
          invoice._id,
          updateData
        );

      const data = response.data;

      if (data?.success === false) {
        toast.error(
          data?.message ||
            "Failed to update invoice"
        );
        return;
      }

      toast.success(
        "Invoice updated successfully"
      );

      if (onUpdated) {
        await onUpdated(
          data?.invoice
        );
      }

      onClose();

    } catch (error) {
      console.error(
        "Invoice Update Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to update invoice"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!invoice) {
    return null;
  }

  return (
    <div
      className="edit-invoice-overlay"
      onClick={onClose}
    >
      <div
        className="edit-invoice-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="edit-invoice-header">

          <div>
            <h2>
              Edit Invoice
            </h2>

            <p>
              Update invoice details
            </p>
          </div>

          <button
            type="button"
            className="edit-invoice-close"
            onClick={onClose}
            disabled={saving}
          >
            <X size={20} />
          </button>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="edit-invoice-form"
        >

          <div className="edit-invoice-grid">

            {/* INVOICE NUMBER */}

            <div className="edit-form-group">

              <label>
                Invoice Number
              </label>

              <input
                type="text"
                name="invoice_number"
                value={
                  formData.invoice_number
                }
                onChange={handleChange}
                placeholder="Example: INV-001"
                required
              />

            </div>


            {/* DATE */}

            <div className="edit-form-group">

              <label>
                Invoice Date
              </label>

              <input
                type="date"
                name="invoice_date"
                value={
                  formData.invoice_date
                }
                onChange={handleChange}
                required
              />

            </div>


            {/* VENDOR */}

            <div className="edit-form-group">

              <label>
                Vendor Name
              </label>

              <input
                type="text"
                name="vendor_name"
                value={
                  formData.vendor_name
                }
                onChange={handleChange}
                placeholder="Enter vendor name"
                required
              />

            </div>


            {/* GST */}

            <div className="edit-form-group">

              <label>
                Does Vendor Have GST?
              </label>

              <div className="edit-gst-options">

                <label className="edit-radio">

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


                <label className="edit-radio">

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


            {/* GSTIN */}

            {formData.vendor_has_gst ===
              "yes" && (

              <div className="edit-form-group">

                <label>
                  Vendor GSTIN
                </label>

                <input
                  type="text"
                  name="vendor_gstin"
                  value={
                    formData.vendor_gstin
                  }
                  onChange={handleChange}
                  placeholder="Enter 15 digit GSTIN"
                  maxLength={15}
                  autoComplete="off"
                />

                {gstError && (
                  <small className="edit-error">
                    {gstError}
                  </small>
                )}

                {!gstError &&
                  formData.vendor_gstin.length ===
                    15 && (
                    <small className="edit-success">
                      ✓ Valid GST format
                    </small>
                  )}

              </div>
            )}


            {/* STATE */}

            {formData.vendor_has_gst ===
              "no" && (

              <div className="edit-form-group">

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

              </div>
            )}


            {/* AMOUNT */}

            <div className="edit-form-group">

              <label>
                Total Amount
              </label>

              <input
                type="number"
                name="total_amount"
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

            <div className="edit-form-group">

              <label>
                GST Rate (%)
              </label>

              <input
                type="number"
                name="gst_rate"
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


            {/* STATUS */}

            <div className="edit-form-group">

              <label>
                Status
              </label>

              <select
                name="status"
                value={
                  formData.status
                }
                onChange={handleChange}
              >

                <option value="Pending">
                  Pending
                </option>

                <option value="Paid">
                  Paid
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>

              </select>

            </div>

          </div>


          {/* DESCRIPTION */}

          <div className="edit-form-group">

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
              rows="4"
            />

          </div>


          {/* TAX INFO */}

          <div className="edit-tax-info">

            <strong>
              GST Calculation
            </strong>

            <span>
              Same State → CGST + SGST
            </span>

            <span>
              Different State → IGST
            </span>

            <small>
              Tax calculation will be
              automatically updated.
            </small>

          </div>


          {/* ACTIONS */}

          <div className="edit-form-actions">

            <button
              type="button"
              className="edit-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-update-btn"
              disabled={saving}
            >
              {saving
                ? "Updating..."
                : "Update Invoice"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { invoiceAPI } from "../api/api";

import "./NewInvoice.css";

export default function NewInvoice({
  onClose,
  onCreated,
}) {
  const [creating, setCreating] = useState(false);
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
  });

  /* =====================================================
     GST
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
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    if (
      formData.vendor_has_gst === "yes" &&
      !validateGST(formData.vendor_gstin)
    ) {
      toast.error(
        "Please enter valid vendor GST number"
      );
      return;
    }

    if (
      formData.vendor_has_gst === "no" &&
      !formData.vendor_state
    ) {
      toast.error("Please select vendor state");
      return;
    }

    const totalAmount =
      Number(formData.total_amount);

    if (
      !formData.total_amount ||
      Number.isNaN(totalAmount) ||
      totalAmount <= 0
    ) {
      toast.error(
        "Please enter valid total amount"
      );
      return;
    }

    const gstRate =
      Number(formData.gst_rate);

    if (
      formData.gst_rate === "" ||
      Number.isNaN(gstRate) ||
      gstRate < 0 ||
      gstRate > 100
    ) {
      toast.error(
        "GST rate must be between 0 and 100"
      );
      return;
    }

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
      setCreating(true);

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

      if (onCreated) {
        await onCreated(
          data?.invoice
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

  return (
    <div
      className="new-invoice-overlay"
      onClick={onClose}
    >
      <div
        className="new-invoice-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* HEADER */}

        <div className="new-invoice-header">

          <div>
            <h2>New Invoice</h2>

            <p>
              Create a new invoice
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
          >
            <X size={20} />
          </button>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="new-invoice-form"
        >

          <div className="new-invoice-grid">

            <div className="new-form-group">
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


            <div className="new-form-group">
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


            <div className="new-form-group">
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


            <div className="new-form-group">

              <label>
                Does Vendor Have GST?
              </label>

              <div className="new-gst-options">

                <label>
                  <input
                    type="radio"
                    name="vendor_has_gst"
                    value="yes"
                    checked={
                      formData.vendor_has_gst ===
                      "yes"
                    }
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        vendor_has_gst:
                          "yes",
                        vendor_state: "",
                      }))
                    }
                  />

                  <span>Yes</span>
                </label>


                <label>
                  <input
                    type="radio"
                    name="vendor_has_gst"
                    value="no"
                    checked={
                      formData.vendor_has_gst ===
                      "no"
                    }
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        vendor_has_gst:
                          "no",
                        vendor_gstin: "",
                      }))
                    }
                  />

                  <span>No</span>
                </label>

              </div>

            </div>


            {formData.vendor_has_gst ===
              "yes" && (

              <div className="new-form-group">

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
                  maxLength={15}
                  placeholder="Enter 15 digit GSTIN"
                  autoComplete="off"
                />

                {gstError && (
                  <small className="new-gst-error">
                    {gstError}
                  </small>
                )}

                {!gstError &&
                  formData.vendor_gstin
                    .length === 15 && (
                  <small className="new-gst-success">
                    ✓ Valid GST format
                  </small>
                )}

              </div>
            )}


            {formData.vendor_has_gst ===
              "no" && (

              <div className="new-form-group">

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

                  {states.map((state) => (
                    <option
                      key={state}
                      value={state}
                    >
                      {state}
                    </option>
                  ))}
                </select>

              </div>
            )}


            <div className="new-form-group">
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


            <div className="new-form-group">
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

          </div>


          <div className="new-tax-info">

            <strong>
              GST Calculation
            </strong>

            <span>
              Same State → CGST + SGST
            </span>

            <span>
              Different State → IGST
            </span>

          </div>


          <div className="new-form-group">

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


          <div className="new-form-actions">

            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="new-cancel-btn"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creating}
              className="new-create-btn"
            >
              {creating
                ? "Creating..."
                : "Create Invoice"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
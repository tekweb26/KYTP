
import React, { useEffect, useState } from "react";
import { invoiceAPI } from "../api/api";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit2 } from "lucide-react";
import "./InvoicesPage.css";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    vendor_name: "",
    vendor_gstin: "",
    total_amount: "",
    tax_amount: "",
    description: "",
  });

  /* =====================================================
     LOAD INVOICES
  ===================================================== */

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data } = await invoiceAPI.list();

      /*
        Backend कडून response:
        {
          success: true,
          invoices: [...]
        }

        त्यामुळे invoices array handle केला आहे.
      */

      if (Array.isArray(data)) {
        setInvoices(data);
      } else if (Array.isArray(data?.invoices)) {
        setInvoices(data.invoices);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error("Invoice Load Error:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };


  /* =====================================================
     FORM INPUT CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  /* =====================================================
     CREATE INVOICE
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await invoiceAPI.create(formData);

      toast.success("Invoice created successfully");

      setFormData({
        vendor_name: "",
        vendor_gstin: "",
        total_amount: "",
        tax_amount: "",
        description: "",
      });

      setShowForm(false);

      await loadInvoices();
    } catch (error) {
      console.error("Invoice Create Error:", error);

      toast.error(
        error?.response?.data?.error ||
        "Failed to create invoice"
      );
    }
  };


  /* =====================================================
     DELETE INVOICE
  ===================================================== */

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this invoice?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await invoiceAPI.delete(id);

      toast.success("Invoice deleted");

      await loadInvoices();
    } catch (error) {
      console.error("Invoice Delete Error:", error);

      toast.error("Failed to delete invoice");
    }
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
            PAGE HEADER
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
            onClick={() => setShowForm(!showForm)}
            className="invoice-primary-btn"
          >
            <Plus size={18} />

            {showForm
              ? "Close Form"
              : "New Invoice"}
          </button>

        </div>


        {/* =================================================
            CREATE INVOICE FORM
        ================================================= */}

        {showForm && (

          <div className="invoice-form-card">

            <h2 className="invoice-form-title">
              Create Invoice
            </h2>


            <form onSubmit={handleSubmit}>

              {/* FORM GRID */}

              <div className="invoice-form-grid">

                {/* Vendor Name */}

                <div className="invoice-form-group">

                  <label htmlFor="vendor_name">
                    Vendor Name
                  </label>

                  <input
                    id="vendor_name"
                    name="vendor_name"
                    type="text"
                    value={formData.vendor_name}
                    onChange={handleChange}
                    placeholder="Enter vendor name"
                    required
                  />

                </div>


                {/* GSTIN */}

                <div className="invoice-form-group">

                  <label htmlFor="vendor_gstin">
                    Vendor GSTIN
                  </label>

                  <input
                    id="vendor_gstin"
                    name="vendor_gstin"
                    type="text"
                    value={formData.vendor_gstin}
                    onChange={handleChange}
                    placeholder="Enter GSTIN"
                  />

                </div>


                {/* Total Amount */}

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
                    value={formData.total_amount}
                    onChange={handleChange}
                    placeholder="Enter total amount"
                    required
                  />

                </div>


                {/* Tax Amount */}

                <div className="invoice-form-group">

                  <label htmlFor="tax_amount">
                    Tax Amount
                  </label>

                  <input
                    id="tax_amount"
                    name="tax_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={handleChange}
                    placeholder="Enter tax amount"
                  />

                </div>

              </div>


              {/* Description */}

              <div className="invoice-form-group">

                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
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
                >
                  Create
                </button>


                <button
                  type="button"
                  className="invoice-secondary-btn"
                  onClick={() => setShowForm(false)}
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

                  <th>
                    Vendor
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Tax
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

                {invoices.length > 0 ? (

                  invoices.map((invoice) => (

                    <tr
                      key={
                        invoice.id ||
                        invoice._id
                      }
                    >

                      {/* Vendor */}

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


                      {/* Amount */}

                      <td>

                        <span className="invoice-amount">
                          ₹
                          {Number(
                            invoice.total_amount || 0
                          ).toLocaleString("en-IN")}
                        </span>

                      </td>


                      {/* Tax */}

                      <td>

                        <span className="invoice-tax">
                          ₹
                          {Number(
                            invoice.tax_amount || 0
                          ).toLocaleString("en-IN")}
                        </span>

                      </td>


                      {/* Status */}

                      <td>

                        <span className="invoice-status">
                          {invoice.status ||
                            "Pending"}
                        </span>

                      </td>


                      {/* Actions */}

                      <td>

                        <div className="invoice-actions">

                          <button
                            type="button"
                            className="invoice-action-btn invoice-edit-btn"
                            title="Edit Invoice"
                          >
                            <Edit2 size={17} />
                          </button>


                          <button
                            type="button"
                            className="invoice-action-btn invoice-delete-btn"
                            title="Delete Invoice"
                            onClick={() =>
                              handleDelete(
                                invoice.id ||
                                invoice._id
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
                      colSpan="5"
                      className="invoice-empty"
                    >
                      No invoices found.
                      <br />

                      Click
                      <strong>
                        {" New Invoice "}
                      </strong>
                      to create your first invoice.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}


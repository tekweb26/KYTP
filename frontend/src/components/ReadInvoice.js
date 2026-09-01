import React from "react";
import {
  X,
  Printer,
} from "lucide-react";

import "./ReadInvoice.css";

export default function ReadInvoice({
  invoice,
  onClose,
}) {
  if (!invoice) return null;

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getInvoiceDate = () => {
    if (!invoice.invoice_date) {
      return "N/A";
    }

    const date = new Date(invoice.invoice_date);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-IN");
  };

  const numberToWords = (num) => {
    num = Math.floor(Number(num || 0));

    if (!Number.isFinite(num) || num === 0) {
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
          (n % 10 ? " " + ones[n % 10] : "")
        );
      }

      if (n < 1000) {
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " " + convert(n % 100) : "")
        );
      }

      if (n < 100000) {
        return (
          convert(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + convert(n % 1000) : "")
        );
      }

      if (n < 10000000) {
        return (
          convert(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + convert(n % 100000) : "")
        );
      }

      return (
        convert(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000
          ? " " + convert(n % 10000000)
          : "")
      );
    };

    return convert(num);
  };

  const companyName =
    invoice.user_id?.companyName ||
    invoice.user?.companyName ||
    invoice.companyName ||
    "Your Business Name";

  const companyAddress =
    invoice.user_id?.companyAddress ||
    invoice.user?.companyAddress ||
    invoice.companyAddress ||
    "Company Address";

  const companyState =
    invoice.user_id?.companyState ||
    invoice.user?.companyState ||
    invoice.companyState ||
    "";

  const companyGST =
    invoice.user_id?.gstNumber ||
    invoice.user?.gstNumber ||
    invoice.gstNumber ||
    "";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="invoice-modal-overlay"
      onClick={onClose}
    >
      <div
        className="invoice-print-modal"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ================================
            TOOLBAR
        ================================= */}

        <div className="invoice-preview-toolbar">

          <strong>
            Invoice Preview
          </strong>

          <div className="invoice-preview-actions">

            <button
              type="button"
              onClick={handlePrint}
              className="invoice-print-btn"
            >
              <Printer size={17} />
              Print Invoice
            </button>

            <button
              type="button"
              onClick={onClose}
              className="invoice-close-btn"
              title="Close"
            >
              <X size={19} />
            </button>

          </div>

        </div>


        {/* ================================
            SCROLL AREA
        ================================= */}

        <div className="invoice-preview-scroll">

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


            {/* SELLER */}

            <div className="tax-invoice-top-grid">

              <div className="seller-details">

                <h2>
                  {companyName}
                </h2>

                <p>
                  {companyAddress}
                </p>

                {companyState && (
                  <p>
                    {companyState}
                  </p>
                )}

                {companyGST && (
                  <p>
                    <strong>
                      GSTIN:
                    </strong>{" "}
                    {companyGST}
                  </p>
                )}

              </div>


              <div className="invoice-meta">

                <div>
                  <span>
                    Invoice No.
                  </span>

                  <strong>
                    {invoice.invoice_number || "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Invoice Date
                  </span>

                  <strong>
                    {getInvoiceDate()}
                  </strong>
                </div>

                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    {invoice.status || "Pending"}
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
                {invoice.vendor_name || "-"}
              </h3>

              {invoice.vendor_has_gst ? (
                <p>
                  GSTIN:{" "}
                  {invoice.vendor_gstin || "-"}
                </p>
              ) : (
                <p>
                  State:{" "}
                  {invoice.vendor_state || "-"}
                </p>
              )}

            </div>


            {/* ITEMS */}

            <table className="tax-invoice-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Taxable Value</th>
                </tr>
              </thead>

              <tbody>

                <tr>

                  <td>
                    1
                  </td>

                  <td className="item-description">
                    {invoice.description ||
                      "Invoice Services"}
                  </td>

                  <td>
                    1
                  </td>

                  <td>
                    ₹
                    {formatAmount(
                      invoice.total_amount
                    )}
                  </td>

                  <td>
                    ₹
                    {formatAmount(
                      invoice.total_amount
                    )}
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
                  {numberToWords(
                    invoice.grand_total
                  )}{" "}
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
                    {formatAmount(
                      invoice.total_amount
                    )}
                  </strong>

                </div>


                {invoice.tax_type ===
                "CGST_SGST" ? (
                  <>

                    <div>

                      <span>
                        CGST (
                        {invoice.cgst_rate || 0}
                        %)
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          invoice.cgst_amount
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        SGST (
                        {invoice.sgst_rate || 0}
                        %)
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          invoice.sgst_amount
                        )}
                      </strong>

                    </div>

                  </>
                ) : (

                  <div>

                    <span>
                      IGST (
                      {invoice.igst_rate || 0}
                      %)
                    </span>

                    <strong>
                      ₹
                      {formatAmount(
                        invoice.igst_amount
                      )}
                    </strong>

                  </div>

                )}


                <div className="invoice-final-total">

                  <span>
                    Grand Total
                  </span>

                  <strong>
                    ₹
                    {formatAmount(
                      invoice.grand_total
                    )}
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
                {invoice.status || "Pending"}
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

                <div className="signature-line" />

                <strong>
                  For {companyName}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
import React from "react";
import { X } from "lucide-react";

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

  const purchaserName =
    invoice.user_id?.companyName ||
    invoice.user?.companyName ||
    invoice.companyName ||
    "Purchaser";

  const purchaserAddress =
    invoice.user_id?.companyAddress ||
    invoice.user?.companyAddress ||
    invoice.companyAddress ||
    "Company Address";

  const purchaserState =
    invoice.user_id?.companyState ||
    invoice.user?.companyState ||
    invoice.companyState ||
    "";

  const purchaserGST =
    invoice.user_id?.gstNumber ||
    invoice.user?.gstNumber ||
    invoice.gstNumber ||
    "";

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
                <div className="invoice-section-label">
                  SELLER
                </div>

                <h2>
                  {invoice.vendor_name || "-"}
                </h2>

                {invoice.vendor_state && (
                  <p>{invoice.vendor_state}</p>
                )}

                {invoice.vendor_gstin && (
                  <p>
                    <strong>GSTIN:</strong>{" "}
                    {invoice.vendor_gstin}
                  </p>
                )}
              </div>

              <div className="invoice-meta">
                <div>
                  <span>Invoice No.</span>
                  <strong>
                    {invoice.invoice_number || "-"}
                  </strong>
                </div>

                <div>
                  <span>Invoice Date</span>
                  <strong>{getInvoiceDate()}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{invoice.status || "Pending"}</strong>
                </div>
              </div>
            </div>


            {/* PURCHASER */}
            <div className="bill-to-box">
              <div className="invoice-section-label">PURCHASER</div>
              <h3>{purchaserName}</h3>
              {purchaserAddress && <p>{purchaserAddress}</p>}
              {purchaserState && <p>State: {purchaserState}</p>}
              {purchaserGST && <p><strong>GSTIN:</strong> {purchaserGST}</p>}
            </div>


            {/* ITEMS */}
            <table className="tax-invoice-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>HSN/SAC</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>GST</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(invoice.items) && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={`invoice-item-${index}`}>
                      <td>{index + 1}</td>
                      <td className="item-description">{`Item ${index + 1}`}</td>
                      <td>{item.hsn_sac || "-"}</td>
                      <td>{item.quantity ?? "-"}</td>
                      <td>₹{formatAmount(item.rate)}</td>
                      <td>₹{formatAmount(item.amount)}</td>
                      <td>{item.gst_rate ?? 0}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No invoice items available</td>
                  </tr>
                )}
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
                  For {invoice.vendor_name || "-"}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
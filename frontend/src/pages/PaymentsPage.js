import React, { useEffect, useState } from "react";
import { invoiceAPI, paymentAPI } from "../api/api";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import UPIPaymentDisplay from "../components/UPIPaymentDisplay";
import "./PaymentsPage.css";

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const [showUPIModal, setShowUPIModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [loading, setLoading] = useState(true);


  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        invoiceAPI.list(),
        paymentAPI.list(),
      ]);

      setInvoices(invoicesRes.data || []);
      setPayments(paymentsRes.data || []);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };


  /* =====================================================
     OPEN UPI PAYMENT
  ===================================================== */

  const openUPIPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setShowUPIModal(true);
  };


  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const closeUPIModal = () => {
    setShowUPIModal(false);
    setSelectedInvoice(null);
  };


  /* =====================================================
     PAYMENT INITIATED
  ===================================================== */

  const handlePaymentInitiated = () => {
    loadData();
  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="payments-loading">
        Loading payments...
      </div>
    );
  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="payments-page">

      <div className="payments-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="payments-header">

          <h1>
            💳 Payments
          </h1>

        </div>


        {/* =================================================
            UPI PAYMENT MODAL
        ================================================= */}

        {showUPIModal && selectedInvoice && (
          <div className="upi-modal-overlay">

            <div className="upi-modal">

              <div className="upi-modal-header">

                <h2>
                  UPI Payment
                </h2>

                <button
                  type="button"
                  onClick={closeUPIModal}
                  className="upi-close-button"
                >
                  ×
                </button>

              </div>


              <div className="upi-modal-content">

                <UPIPaymentDisplay
                  invoiceId={selectedInvoice.id}
                  amount={selectedInvoice.total_amount}
                  vendorUPI={selectedInvoice.vendor_gstin}
                  vendorName={selectedInvoice.vendor_name}
                  onPaymentInitiated={
                    handlePaymentInitiated
                  }
                />

              </div>

            </div>

          </div>
        )}


        {/* =================================================
            PENDING INVOICES
        ================================================= */}

        <div className="pending-section">

          <h2>
            📋 Invoices Pending Payment
          </h2>


          {invoices.length > 0 ? (

            <div className="invoice-grid">

              {invoices.map((invoice) => (

                <div
                  key={invoice.id}
                  className="invoice-card"
                >


                  {/* Vendor */}

                  <div className="invoice-detail">

                    <p className="invoice-detail-label">
                      Vendor
                    </p>

                    <p className="invoice-vendor">
                      {invoice.vendor_name || "N/A"}
                    </p>

                  </div>


                  {/* Amount */}

                  <div className="invoice-detail">

                    <p className="invoice-detail-label">
                      Amount
                    </p>

                    <p className="invoice-amount">
                      ₹
                      {Number(
                        invoice.total_amount || 0
                      ).toLocaleString("en-IN")}
                    </p>

                  </div>


                  {/* Status */}

                  <div className="invoice-detail">

                    <p className="invoice-detail-label">
                      Status
                    </p>

                    <span className="payment-status">
                      {invoice.status || "Pending"}
                    </span>

                  </div>


                  {/* Pay Button */}

                  <button
                    type="button"
                    onClick={() =>
                      openUPIPayment(invoice)
                    }
                    className="upi-button"
                  >

                    <Send size={18} />

                    Pay via UPI

                  </button>

                </div>

              ))}

            </div>

          ) : (

            <div className="no-pending-invoices">

              No invoices pending payment

            </div>

          )}

        </div>


        {/* =================================================
            PAYMENT HISTORY
        ================================================= */}

        <div className="payment-history">

          <h2>
            ✅ Payment History
          </h2>


          <div className="payment-table-wrapper">

            <table className="payment-table">

              <thead>

                <tr>

                  <th>
                    Invoice ID
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Date
                  </th>

                </tr>

              </thead>


              <tbody>

                {payments.length > 0 ? (

                  payments.map((payment) => {

                    const paymentStatus =
                      payment.status || "Pending";

                    const isCompleted =
                      paymentStatus.toLowerCase() ===
                      "completed";


                    return (

                      <tr key={payment.id}>

                        {/* Invoice ID */}

                        <td>

                          <span className="payment-invoice-id">

                            #
                            {payment.invoiceId ||
                              payment.invoice_id ||
                              payment.id}

                          </span>

                        </td>


                        {/* Amount */}

                        <td>

                          <span className="payment-amount">

                            ₹
                            {Number(
                              payment.amount || 0
                            ).toLocaleString("en-IN")}

                          </span>

                        </td>


                        {/* Status */}

                        <td>

                          <span
                            className={`payment-history-status ${
                              isCompleted
                                ? "completed"
                                : "pending"
                            }`}
                          >

                            {paymentStatus}

                          </span>

                        </td>


                        {/* Date */}

                        <td>

                          <span className="payment-date">

                            {payment.created_at
                              ? new Date(
                                  payment.created_at
                                ).toLocaleDateString(
                                  "en-IN"
                                )
                              : "-"}

                          </span>

                        </td>

                      </tr>

                    );

                  })

                ) : (

                  <tr>

                    <td
                      colSpan="4"
                      className="no-payment-history"
                    >

                      No payment history

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
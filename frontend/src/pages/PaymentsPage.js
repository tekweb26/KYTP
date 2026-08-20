import React, { useEffect, useState } from 'react';
import { invoiceAPI, paymentAPI } from '../api/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Send } from 'lucide-react';
import UPIPaymentDisplay from '../components/UPIPaymentDisplay';

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        invoiceAPI.list(),
        paymentAPI.list(),
      ]);
      setInvoices(invoicesRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openUPIPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setShowUPIModal(true);
  };

  const handlePaymentInitiated = (data) => {
    // Refresh payments list
    loadData();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading payments...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">💳 Payments</h1>
      </div>

      {/* UPI Payment Modal */}
      {showUPIModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">UPI Payment</h2>
              <button
                onClick={() => setShowUPIModal(false)}
                className="text-2xl text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <UPIPaymentDisplay
                invoiceId={selectedInvoice.id}
                amount={selectedInvoice.total_amount}
                vendorUPI={selectedInvoice.vendor_gstin} // Or store actual UPI
                vendorName={selectedInvoice.vendor_name}
                onPaymentInitiated={handlePaymentInitiated}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pending Invoices - Ready for Payment */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">📋 Invoices Pending Payment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Vendor</p>
                  <p className="font-bold text-gray-900">{invoice.vendor_name}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-blue-600">₹{invoice.total_amount?.toLocaleString('en-IN')}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-block px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                    {invoice.status || 'Pending'}
                  </span>
                </div>
                <button
                  onClick={() => openUPIPayment(invoice)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Pay via UPI
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No invoices pending payment
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">✅ Payment History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">#{payment.invoiceId || payment.id}</td>
                    <td className="py-3 px-4">₹{payment.amount?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        payment.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No payment history
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
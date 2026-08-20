import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle, AlertCircle, Loader, Copy } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

export default function UPIPaymentDisplay({ invoiceId, amount, vendorUPI, vendorName, onPaymentInitiated }) {
  const [upiString, setUpiString] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Step 1: Generate UPI String
  const generatePaymentLink = async () => {
    if (!vendorUPI || !amount || !invoiceId) {
      toast.error('Missing vendor UPI, amount, or invoice ID');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/upi/generate`, {
        vendorUPI,
        vendorName: vendorName || 'Vendor',
        amount,
        invoiceId,
        description: `Payment for Invoice ${invoiceId}`
      });

      if (data.success) {
        setUpiString(data.upiString);
        setPaymentStatus('generated');
        toast.success('✅ Payment link generated!');
        
        // Call parent callback
        if (onPaymentInitiated) {
          onPaymentInitiated({
            invoiceId,
            upiString: data.upiString,
            amount,
            vendorUPI
          });
        }
      } else {
        toast.error(data.error || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating UPI string:', error);
      toast.error(error.response?.data?.error || 'Error generating payment link');
    } finally {
      setLoading(false);
    }
  };

  // Copy UPI string to clipboard
  const copyToClipboard = () => {
    if (upiString) {
      navigator.clipboard.writeText(upiString);
      toast.success('📋 UPI link copied to clipboard!');
    }
  };

  // Mark payment as completed
  const markPaymentCompleted = async (transactionRef = '') => {
    try {
      const { data } = await axios.post(`${API_URL}/upi/record-payment`, {
        invoiceId,
        vendorUPI,
        amount,
        transactionRef: transactionRef || `UPI-${Date.now()}`,
        status: 'completed'
      });

      if (data.success) {
        setPaymentStatus('completed');
        toast.success('✅ Payment recorded as completed!');
      }
    } catch (error) {
      toast.error('Error recording payment');
      console.error(error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Step 1: Initial Form */}
      {!upiString && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-4">💳 UPI Payment</h3>

          {/* Invoice Details */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 font-semibold">Invoice ID</p>
                <p className="text-lg font-bold text-gray-900">#{invoiceId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Amount</p>
                <p className="text-lg font-bold text-blue-600">₹{amount?.toLocaleString('en-IN')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600 font-semibold">Recipient UPI</p>
                <p className="text-sm font-mono text-gray-900">{vendorUPI}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600 font-semibold">Recipient Name</p>
                <p className="text-sm font-medium text-gray-900">{vendorName}</p>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-6 rounded">
            <p className="text-xs text-yellow-800">
              ℹ️ Click below to generate a UPI payment link. Share it with the payer.
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePaymentLink}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode size={20} />
                Generate Payment Link
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Payment Link Generated */}
      {upiString && paymentStatus === 'generated' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-700">✅ Link Ready!</h3>
              <p className="text-sm text-gray-600">Share with payer</p>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 font-semibold">Invoice</p>
                <p className="font-bold text-gray-900">#{invoiceId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Amount to Pay</p>
                <p className="text-2xl font-bold text-green-600">₹{amount?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Recipient</p>
                <p className="text-sm text-gray-900">{vendorName}</p>
              </div>
            </div>
          </div>

          {/* UPI String Display */}
          <div className="bg-gray-50 p-4 rounded mb-6">
            <p className="text-xs text-gray-600 font-semibold mb-2">UPI Payment Link</p>
            <div className="bg-white p-3 rounded border border-gray-200">
              <code className="text-xs break-all text-gray-900 font-mono">
                {upiString}
              </code>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={copyToClipboard}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Copy size={18} />
              📋 Copy Link
            </button>

            <a
              href={upiString}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 text-center"
            >
              📱 Open in UPI App
            </a>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded mb-6">
            <p className="text-sm font-semibold text-blue-900 mb-2">📝 Instructions:</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Copy the link above</li>
              <li>Share with the payer (email, SMS, chat)</li>
              <li>Payer clicks link or scans QR</li>
              <li>Opens in their UPI app</li>
              <li>Confirms and completes payment</li>
              <li>Click "Payment Completed" below</li>
            </ol>
          </div>

          {/* Confirmation Button */}
          <button
            onClick={() => markPaymentCompleted()}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            ✅ Payment Completed
          </button>

          {/* Back Button */}
          <button
            onClick={() => {
              setUpiString(null);
              setPaymentStatus(null);
            }}
            className="w-full mt-2 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400"
          >
            Generate New Link
          </button>
        </div>
      )}

      {/* Step 3: Payment Completed */}
      {paymentStatus === 'completed' && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>

          <h3 className="text-2xl font-bold text-green-600 mb-2">✅ Payment Recorded!</h3>
          <p className="text-gray-600 mb-6">Payment has been marked as completed for invoice #{invoiceId}</p>

          <div className="bg-green-50 p-4 rounded mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Invoice ID</p>
                <p className="font-semibold">#{invoiceId}</p>
              </div>
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-bold text-green-600">₹{amount?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-semibold text-green-700">✅ Completed</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setUpiString(null);
              setPaymentStatus(null);
            }}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Create Another Payment
          </button>
        </div>
      )}
    </div>
  );
}

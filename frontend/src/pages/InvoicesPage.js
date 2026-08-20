import React, { useEffect, useState } from 'react';
import { invoiceAPI } from '../api/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_gstin: '',
    total_amount: '',
    tax_amount: '',
    description: '',
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data } = await invoiceAPI.list();
      setInvoices(data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await invoiceAPI.create(formData);
      toast.success('Invoice created successfully');
      setFormData({
        vendor_name: '',
        vendor_gstin: '',
        total_amount: '',
        tax_amount: '',
        description: '',
      });
      setShowForm(false);
      loadInvoices();
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await invoiceAPI.delete(id);
        toast.success('Invoice deleted');
        loadInvoices();
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading invoices...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Create Invoice</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label>Vendor Name</label>
                <input
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Vendor GSTIN</label>
                <input
                  type="text"
                  value={formData.vendor_gstin}
                  onChange={(e) => setFormData({...formData, vendor_gstin: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Total Amount</label>
                <input
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tax Amount</label>
                <input
                  type="number"
                  value={formData.tax_amount}
                  onChange={(e) => setFormData({...formData, tax_amount: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
              />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary">Create</button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Vendor</th>
              <th className="text-left py-3">Amount</th>
              <th className="text-left py-3">Tax</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50">
                <td className="py-3">{invoice.vendor_name}</td>
                <td className="py-3">₹{invoice.total_amount}</td>
                <td className="py-3">₹{invoice.tax_amount}</td>
                <td className="py-3">
                  <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-700">
                    {invoice.status || 'Pending'}
                  </span>
                </td>
                <td className="py-3 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800">
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

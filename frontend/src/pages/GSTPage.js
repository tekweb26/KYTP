import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { gstAPI, invoiceAPI } from '../api/api';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function GSTPage() {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGSTData();
  }, []);

  const loadGSTData = async () => {
    try {
      const now = new Date();
      const { data: summaryData } = await gstAPI.monthlySummary(now.getMonth() + 1, now.getFullYear());
      const { data: invoicesData } = await invoiceAPI.list();

      setSummary(summaryData);
      setInvoices(invoicesData);

      const taxBreakdown = [
        { name: 'SGST', value: summaryData.sgst || 0 },
        { name: 'CGST', value: summaryData.cgst || 0 },
        { name: 'IGST', value: summaryData.igst || 0 },
      ].filter(item => item.value > 0);

      setChartData(taxBreakdown);
    } catch (error) {
      toast.error('Failed to load GST data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading GST data...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">GST Dashboard</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <Download size={18} />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="text-sm text-gray-600">Total Taxable Amount</div>
          <div className="text-2xl font-bold">₹{summary?.taxable_amount || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">SGST (9%)</div>
          <div className="text-2xl font-bold text-blue-600">₹{summary?.sgst || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">CGST (9%)</div>
          <div className="text-2xl font-bold text-green-600">₹{summary?.cgst || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Total Tax Liability</div>
          <div className="text-2xl font-bold text-red-600">₹{summary?.total_tax || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Tax Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ₹${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Monthly Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { month: 'SGST', amount: summary?.sgst || 0 },
              { month: 'CGST', amount: summary?.cgst || 0 },
              { month: 'IGST', amount: summary?.igst || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Invoices by Tax Type</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Vendor</th>
              <th className="text-left py-3">Amount</th>
              <th className="text-left py-3">Tax Type</th>
              <th className="text-left py-3">Tax Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const isIntrastate = invoice.vendor_gstin?.substring(0, 2) === summary?.payer_state;
              const taxType = isIntrastate ? 'SGST + CGST' : 'IGST';
              
              return (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{invoice.vendor_name}</td>
                  <td className="py-3">₹{invoice.total_amount}</td>
                  <td className="py-3">{taxType}</td>
                  <td className="py-3">₹{invoice.tax_amount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

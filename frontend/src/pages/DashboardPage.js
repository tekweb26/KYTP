import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { invoiceAPI, paymentAPI } from '../api/api';
import toast from 'react-hot-toast';
import { FileText, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage({ user }) {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPayments: 0,
    pendingAmount: 0,
    gstLiability: 0,
    paidAmount: 0,
    outstandingAmount: 0,
  });
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const invoicesRes = await invoiceAPI.list();
      const paymentsRes = await paymentAPI.list();

      setInvoices(invoicesRes.data.slice(0, 5));
      setPayments(paymentsRes.data.slice(0, 5));

      const totalInvoices = invoicesRes.data.length;
      const totalPayments = paymentsRes.data.length;
      const pendingAmount = invoicesRes.data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const paidAmount = paymentsRes.data.reduce((sum, pay) => sum + (pay.amount || 0), 0);

      setStats({
        totalInvoices,
        totalPayments,
        pendingAmount,
        gstLiability: pendingAmount * 0.18,
        paidAmount,
        outstandingAmount: pendingAmount - paidAmount,
      });

      setChartData([
        { month: 'Jan', invoices: 4, payments: 3, revenue: 45000 },
        { month: 'Feb', invoices: 3, payments: 2, revenue: 38000 },
        { month: 'Mar', invoices: 2, payments: 2, revenue: 32000 },
        { month: 'Apr', invoices: 5, payments: 4, revenue: 55000 },
      ]);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Header Section */}
      

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">📊 Dashboard</h1>
              <p className="text-blue-100">Welcome back, {user?.email?.split('@')[0]}! Here's your GST compliance overview.</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Last updated</div>
              <div className="text-lg font-semibold">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Total Invoices */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Invoices</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalInvoices}</div>
                <div className="text-xs text-gray-500 mt-2">📈 Up from last month</div>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Payments */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Payments Made</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPayments}</div>
                <div className="text-xs text-gray-500 mt-2">✅ {Math.round((stats.totalPayments / (stats.totalInvoices || 1)) * 100)}% completion</div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          {/* Paid Amount */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Paid Amount</div>
                <div className="text-3xl font-bold text-green-600 mt-2">₹{stats.paidAmount.toLocaleString('en-IN')}</div>
                <div className="text-xs text-gray-500 mt-2">Cleared invoices</div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          {/* Pending Amount */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Pending Amount</div>
                <div className="text-3xl font-bold text-orange-600 mt-2">₹{stats.pendingAmount.toLocaleString('en-IN')}</div>
                <div className="text-xs text-gray-500 mt-2">Awaiting payment</div>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock size={24} className="text-orange-600" />
              </div>
            </div>
          </div>

          {/* Outstanding Amount */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Outstanding</div>
                <div className="text-3xl font-bold text-red-600 mt-2">₹{stats.outstandingAmount.toLocaleString('en-IN')}</div>
                <div className="text-xs text-gray-500 mt-2">Overdue invoices</div>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          {/* GST Liability */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-purple-400 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-sm font-semibold uppercase tracking-wide">GST Liability</div>
                <div className="text-3xl font-bold mt-2">₹{stats.gstLiability.toLocaleString('en-IN')}</div>
                <div className="text-xs text-purple-200 mt-2">18% on invoices</div>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">📊 Invoices vs Payments Trend</h2>
              <p className="text-sm text-gray-500 mt-1">Monthly comparison over the last 4 months</p>
            </div>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="invoices" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  <Line type="monotone" dataKey="payments" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">💰 Monthly Revenue Trend</h2>
              <p className="text-sm text-gray-500 mt-1">Revenue generation over the last 4 months</p>
            </div>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">📋 Recent Invoices</h2>
              <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
            </div>
            <div className="space-y-3">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{invoice.vendor_name || 'Unknown Vendor'}</div>
                      <div className="text-xs text-gray-500 mt-1">Invoice #{invoice.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">₹{invoice.total_amount || 0}</div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        invoice.status === 'Paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {invoice.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No invoices yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">✅ Recent Payments</h2>
              <p className="text-sm text-gray-500 mt-1">Payment transactions</p>
            </div>
            <div className="space-y-3">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Ref: {payment.reference_id}</div>
                      <div className="text-xs text-gray-500 mt-1">{payment.payment_method}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">₹{payment.amount || 0}</div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        payment.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No payments yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🚀 Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition px-6 py-3 rounded-lg font-semibold">
              ➕ Create Invoice
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition px-6 py-3 rounded-lg font-semibold">
              💳 Record Payment
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition px-6 py-3 rounded-lg font-semibold">
              📤 Export Report
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition px-6 py-3 rounded-lg font-semibold">
              📞 Get Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

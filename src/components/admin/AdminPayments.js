import React, { useState, useEffect } from 'react';
import {
  DollarSign, CreditCard, TrendingUp, Download, Filter,
  Calendar, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Search, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('30days');
  
  useEffect(() => {
    fetchPayments();
  }, [filterType, dateRange]);

  const fetchPayments = async () => {
    try {
      const response = await adminAPI.getPayments({ filterType, dateRange });
      setPayments(response.data.payments || []);
      setStats(response.data.stats || {});
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const exportPayments = () => {
    const csv = [
      ['Transaction ID', 'User', 'Amount', 'Type', 'Status', 'Date'],
      ...payments.map(p => [
        p.transactionId,
        p.user?.email,
        `KSh ${p.amount}`,
        p.type,
        p.status,
        new Date(p.createdAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Payment Management</h2>
        <div className="flex space-x-3">
          <button onClick={fetchPayments} className="p-2 text-gray-600 hover:text-gray-900">
            <RefreshCw className="h-5 w-5" />
          </button>
          <button onClick={exportPayments} className="btn-primary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                KSh {(stats.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-1">
                <ArrowUpRight className="inline h-4 w-4" />
                {stats.revenueGrowth || 0}% from last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                KSh {(stats.monthlyRevenue || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.monthlyTransactions || 0} transactions
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.successRate || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.successfulPayments || 0} successful
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.failedPayments || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                KSh {(stats.failedAmount || 0).toLocaleString()}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Payments</option>
            <option value="mpesa">M-Pesa</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.transactionId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.property?.title}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm text-gray-900">{payment.user?.name}</p>
                    <p className="text-xs text-gray-500">{payment.user?.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-semibold text-gray-900">
                    KSh {payment.amount.toLocaleString()}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    payment.method === 'mpesa' ? 'bg-green-100 text-green-800' :
                    payment.method === 'stripe' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.method}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`flex items-center text-sm ${
                    payment.status === 'success' ? 'text-green-600' :
                    payment.status === 'failed' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {payment.status === 'success' && <CheckCircle className="h-4 w-4 mr-1" />}
                    {payment.status === 'failed' && <XCircle className="h-4 w-4 mr-1" />}
                    {payment.status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayments;
